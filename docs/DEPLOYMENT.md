# Deployment Guide

This guide covers deploying the Black QTIPOC+ Events Calendar to production.

## 🚀 Quick Deployment

### Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables (see below)
5. Deploy!

### Backend (Supabase)
1. Create a Supabase project
2. Run database migrations
3. Deploy edge functions
4. Configure environment variables

## 🔧 Detailed Setup

### 1. Supabase Project Setup

#### Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and region
4. Set database password (save this!)

#### Database Setup
1. Go to SQL Editor in your Supabase dashboard
2. Run the migration files in order:
   ```sql
   -- Run each file in /supabase/migrations/ in chronological order
   ```

#### Edge Functions
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and link project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Deploy functions:
   ```bash
   supabase functions deploy scrape-eventbrite
   supabase functions deploy scrape-facebook
   supabase functions deploy scrape-outsavvy
   supabase functions deploy scrape-all-sources
   ```

#### Environment Variables
In Supabase Dashboard > Settings > Edge Functions:
```
EVENTBRITE_API_TOKEN=your_eventbrite_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token
OUTSAVVY_API_KEY=your_outsavvy_key
```

### 2. Netlify Frontend Deployment

#### Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project"
3. Connect to GitHub and select your repository

#### Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18 (in netlify.toml or environment)

#### Environment Variables
In Netlify Dashboard > Site Settings > Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Custom Domain (Optional)
1. Go to Domain Settings in Netlify
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Netlify)

### 3. Production Configuration

#### Security Headers
Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Database Security
1. Review Row Level Security policies
2. Ensure proper user roles and permissions
3. Enable database backups
4. Set up monitoring and alerts

### 4. Monitoring and Analytics

#### Supabase Monitoring
- Enable database metrics
- Set up log retention
- Configure alerts for errors

#### Netlify Analytics
- Enable Netlify Analytics (paid feature)
- Monitor site performance
- Track deployment success rates

#### Custom Monitoring
Consider adding:
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User analytics (privacy-focused options)

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🔐 Security Checklist

### Pre-Deployment
- [ ] Review all environment variables
- [ ] Ensure no secrets in code
- [ ] Test RLS policies thoroughly
- [ ] Verify API rate limiting
- [ ] Check CORS settings
- [ ] Review user permissions

### Post-Deployment
- [ ] Test authentication flows
- [ ] Verify event submission works
- [ ] Test admin dashboard
- [ ] Check scraping functions
- [ ] Monitor error logs
- [ ] Test on multiple devices

## 📊 Performance Optimization

### Frontend
- [ ] Enable Netlify's asset optimization
- [ ] Implement lazy loading for images
- [ ] Use React.memo for expensive components
- [ ] Optimize bundle size with code splitting

### Backend
- [ ] Add database indexes for common queries
- [ ] Implement query optimization
- [ ] Set up connection pooling
- [ ] Monitor slow queries

### API Integration
- [ ] Implement proper caching
- [ ] Use efficient pagination
- [ ] Optimize scraping schedules
- [ ] Monitor API usage

## 🚨 Troubleshooting

### Common Deployment Issues

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

**Environment Variable Issues**
- Ensure all required variables are set
- Check variable names match exactly
- Verify Supabase URL and keys are correct

**Database Connection Issues**
- Check Supabase project status
- Verify RLS policies allow necessary access
- Review database logs for errors

**Edge Function Errors**
- Check function logs in Supabase dashboard
- Verify environment variables are set
- Test functions individually

### Monitoring Commands
```bash
# Check Netlify deployment status
netlify status

# View Supabase logs
supabase logs

# Test edge functions
curl -X POST https://your-project.supabase.co/functions/v1/scrape-eventbrite
```

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review platform documentation (Netlify, Supabase)
3. Open an issue in the GitHub repository
4. Email: tech@qtipocevents.org

## 🎉 Post-Deployment

### Launch Checklist
- [ ] Test all functionality in production
- [ ] Set up monitoring and alerts
- [ ] Create admin accounts
- [ ] Import initial event data
- [ ] Share with beta community members
- [ ] Gather feedback and iterate

### Community Outreach
- [ ] Announce to community organizations
- [ ] Create social media presence
- [ ] Develop partnership agreements
- [ ] Plan launch events
- [ ] Gather community feedback

Congratulations on deploying a platform that serves the Black QTIPOC+ community! 🌟✊🏿🏳️‍⚧️🏳️‍🌈