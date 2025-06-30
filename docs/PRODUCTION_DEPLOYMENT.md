# Production Deployment Guide - Minimal Cost

## 🎯 Overview

Deploy the Black QTIPOC+ Events Calendar with **$0-5/month** total costs using free tiers and minimal paid services.

## 💰 Cost Breakdown

| Service | Cost | Purpose |
|---------|------|---------|
| **Netlify** | Free | Frontend hosting + Functions |
| **Google Sheets** | Free | Database (transparent & collaborative) |
| **Google Cloud API** | Free | 100 requests/100 seconds limit |
| **Domain (optional)** | $12/year | Custom domain |
| **Total Monthly** | **$0-1** | Essentially free! |

## 🚀 Step 1: Frontend Deployment (Netlify)

### 1.1 Connect Repository
1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository

### 1.2 Build Settings
```
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 1.3 Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables:
```bash
VITE_GOOGLE_SHEET_ID=your_google_sheet_id
VITE_GOOGLE_API_KEY=your_google_api_key
```

### 1.4 Deploy
- Push to main branch
- Netlify auto-deploys
- Get your live URL: `https://your-site.netlify.app`

## 📊 Step 2: Google Sheets Database Setup

### 2.1 Create Production Sheet
1. **Copy Template**: Use the guide in `docs/GOOGLE_SHEET_SETUP_COMPLETE.md`
2. **Name**: "Black QTIPOC+ Events Calendar - Production"
3. **Structure**: 4 sheets (Events, ScrapingLogs, Contacts, OrganizationsToMonitor)

### 2.2 Make Public (Read-Only)
1. Click "Share" → "Anyone with the link can view"
2. Copy Sheet ID from URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

### 2.3 Google Cloud API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "QTIPOC Events Calendar"
3. Enable Google Sheets API
4. Create API Key → Restrict to Google Sheets API only
5. Add your domain to restrictions

## ⚡ Step 3: Netlify Functions (Event Scraping)

### 3.1 API Keys Setup
Add to Netlify Environment Variables:
```bash
# Event Discovery APIs
EVENTBRITE_API_TOKEN=your_eventbrite_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token

# Google Sheets Integration  
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_API_KEY=your_api_key
```

### 3.2 Functions Auto-Deploy
- Functions in `/netlify/functions/` auto-deploy with your site
- No manual deployment needed
- Test at: `https://your-site.netlify.app/.netlify/functions/scrape-eventbrite`

### 3.3 Scheduled Scraping (Optional)
**Free Option - GitHub Actions:**
Create `.github/workflows/scrape-events.yml`:
```yaml
name: Scrape Events
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday 9 AM
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scraping
        run: |
          curl -X POST https://your-site.netlify.app/.netlify/functions/scrape-all-sources
```

## 🔧 Step 4: Production Optimizations

### 4.1 Performance
```bash
# Add to netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
    
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 4.2 Security Headers
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### 4.3 Redirects
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 📈 Step 5: Monitoring & Analytics

### 5.1 Free Monitoring
- **Netlify Analytics**: Built-in (free tier)
- **Google Sheets**: Built-in change history
- **GitHub**: Commit history and issues

### 5.2 Error Tracking
- Use browser console for debugging
- Netlify function logs for backend errors
- Google Sheets for data validation

### 5.3 Performance Monitoring
- Lighthouse (built into Chrome)
- Netlify's performance insights
- Google PageSpeed Insights

## 🌐 Step 6: Custom Domain (Optional - $12/year)

### 6.1 Purchase Domain
- **Namecheap**: ~$12/year for .org
- **Google Domains**: ~$12/year
- **Cloudflare**: ~$10/year

### 6.2 Configure DNS
1. In domain registrar, set nameservers to Netlify's
2. In Netlify, add custom domain
3. Enable HTTPS (automatic)

## 🔒 Step 7: Security & Backup

### 7.1 Data Backup
- **Google Sheets**: Auto-backed up by Google
- **Code**: Backed up on GitHub
- **Export**: Regular CSV exports from sheets

### 7.2 Access Control
- **Google Sheet**: Editor access for trusted moderators
- **Netlify**: Team access for developers
- **GitHub**: Collaborator access

### 7.3 API Security
- Restrict API keys to your domain only
- Rotate keys every 6 months
- Monitor usage in Google Cloud Console

## 📋 Step 8: Launch Checklist

### Pre-Launch
- [ ] Google Sheet created and populated
- [ ] API keys configured and tested
- [ ] Netlify site deployed successfully
- [ ] All functions working
- [ ] Mobile responsiveness tested
- [ ] Performance optimized

### Launch Day
- [ ] Final data review
- [ ] Community guidelines published
- [ ] Social media announcement
- [ ] Partner organization outreach
- [ ] Monitor for issues

### Post-Launch
- [ ] Weekly data backups
- [ ] Monthly performance reviews
- [ ] Quarterly security audits
- [ ] Community feedback integration

## 🎉 Expected Results

### Performance
- **Load Time**: <2 seconds
- **Uptime**: 99.9% (Netlify SLA)
- **Mobile Score**: 90+ (Lighthouse)

### Costs
- **Month 1-12**: $0-1/month
- **Year 1 Total**: $0-12 (domain only)
- **Scaling**: Stays free until 100GB bandwidth

### Community Impact
- **Transparency**: All data visible in Google Sheets
- **Collaboration**: Multiple moderators can work simultaneously
- **Accessibility**: Works on all devices
- **Sustainability**: No vendor lock-in

## 🆘 Troubleshooting

### Common Issues
1. **Build Fails**: Check Node version (use 18)
2. **API Errors**: Verify environment variables
3. **Sheet Access**: Ensure public read permissions
4. **Functions Timeout**: Optimize API calls

### Support Resources
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Google Sheets API**: [developers.google.com/sheets](https://developers.google.com/sheets)
- **Community**: GitHub Issues

## 🚀 Ready to Launch!

This setup gives you:
✅ **Production-ready platform**  
✅ **Minimal costs** ($0-1/month)  
✅ **Community transparency** (Google Sheets)  
✅ **Automatic scaling** (Netlify)  
✅ **Easy maintenance** (No complex infrastructure)  

Your Black QTIPOC+ Events Calendar will be live, affordable, and serving the community! 🌟