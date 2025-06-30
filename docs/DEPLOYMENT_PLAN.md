# Deployment Plan for Black QTIPOC+ Events Calendar

## 🎯 Overview

This deployment plan covers the transition from Supabase to Google Sheets as the primary database, along with setting up serverless functions for event scraping and organization monitoring.

## 📋 Phase 1: Google Sheets Setup (Week 1)

### 1.1 Create Production Google Sheet
- [ ] Create new Google Sheet: "Black QTIPOC+ Events Calendar - Production"
- [ ] Set up 5 sheets: Events, ScrapingLogs, Contacts, OrganizationsToMonitor, Dashboard
- [ ] Import sample data and UK QTIPOC+ organizations
- [ ] Configure data validation and conditional formatting
- [ ] Set up Google Apps Script for automation

### 1.2 API Configuration
- [ ] Create Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] Create API key with domain restrictions
- [ ] Set up OAuth2 credentials for write access
- [ ] Configure environment variables

### 1.3 Testing
- [ ] Test read access from frontend
- [ ] Test write operations (event submission)
- [ ] Verify moderation workflow
- [ ] Test bulk operations

## 🔧 Phase 2: Serverless Functions Migration (Week 2)

### 2.1 Choose Serverless Platform
**Recommended: Netlify Functions** (for simplicity and integration)
- ✅ Easy integration with Netlify frontend hosting
- ✅ Built-in environment variable management
- ✅ Automatic deployment with Git
- ✅ Free tier suitable for community project

**Alternative: Vercel Functions**
- ✅ Similar benefits to Netlify
- ✅ Good TypeScript support

### 2.2 Migrate Scraping Functions
Convert existing Supabase Edge Functions to Netlify Functions:

```
netlify/functions/
├── scrape-eventbrite.ts
├── scrape-facebook.ts
├── scrape-outsavvy.ts
├── scrape-all-sources.ts
└── monitor-organizations.ts
```

### 2.3 Update API Integration
- [ ] Modify functions to write to Google Sheets instead of Supabase
- [ ] Implement proper error handling and logging
- [ ] Add rate limiting and retry logic
- [ ] Test each function individually

## 🏗️ Phase 3: Frontend Deployment (Week 3)

### 3.1 Netlify Frontend Setup
- [ ] Connect GitHub repository to Netlify
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: 18
- [ ] Set environment variables:
  ```
  VITE_GOOGLE_SHEET_ID=your_sheet_id
  VITE_GOOGLE_API_KEY=your_api_key
  VITE_GOOGLE_CLIENT_ID=your_oauth_client_id
  ```

### 3.2 Custom Domain (Optional)
- [ ] Purchase domain (e.g., qtipocevents.org)
- [ ] Configure DNS settings
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Set up redirects if needed

### 3.3 Performance Optimization
- [ ] Enable Netlify asset optimization
- [ ] Configure caching headers
- [ ] Test loading speeds
- [ ] Optimize images and assets

## 🔄 Phase 4: CI/CD Pipeline (Week 4)

### 4.1 GitHub Actions Setup
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
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

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### 4.2 Automated Testing
- [ ] Set up unit tests for components
- [ ] Add integration tests for Google Sheets API
- [ ] Test scraping functions
- [ ] Set up end-to-end tests

### 4.3 Monitoring & Alerts
- [ ] Set up Netlify Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Create alerts for failed deployments

## 📊 Phase 5: Organization Monitoring (Week 5)

### 5.1 Populate Organizations Sheet
Add all UK QTIPOC+ organizations from the directory:

```
OrganizationsToMonitor Sheet Columns:
- ID
- Name
- Type (community_center, arts_collective, advocacy, etc.)
- Location
- Website
- FacebookPage
- EventbriteOrganizer
- MonitoringFrequency (weekly/monthly/quarterly)
- LastChecked
- EventsFoundLastCheck
- Status (active/inactive/needs_review)
- Notes
```

### 5.2 Automated Monitoring
- [ ] Create scheduled function to check organizations
- [ ] Implement smart frequency-based checking
- [ ] Add notification system for new events found
- [ ] Create monitoring dashboard

### 5.3 Community Integration
- [ ] Allow community to suggest new organizations
- [ ] Create form for organization updates
- [ ] Set up moderation for organization additions

## 🚀 Phase 6: Launch & Community Onboarding (Week 6)

### 6.1 Soft Launch
- [ ] Deploy to production
- [ ] Test all functionality end-to-end
- [ ] Invite beta testers from community
- [ ] Gather feedback and iterate

### 6.2 Community Training
- [ ] Create moderation guidelines
- [ ] Train community moderators on Google Sheets
- [ ] Set up communication channels (Discord/Slack)
- [ ] Create documentation for common tasks

### 6.3 Public Launch
- [ ] Announce on social media
- [ ] Reach out to organizations in directory
- [ ] Create press kit and media outreach
- [ ] Monitor usage and performance

## 📈 Phase 7: Optimization & Growth (Ongoing)

### 7.1 Performance Monitoring
- [ ] Track key metrics (events added, user engagement)
- [ ] Monitor API usage and costs
- [ ] Optimize scraping efficiency
- [ ] Improve relevance algorithms

### 7.2 Feature Expansion
- [ ] Add email notifications
- [ ] Implement user favorites
- [ ] Create mobile app (PWA)
- [ ] Add calendar integrations

### 7.3 Community Growth
- [ ] Partner with organizations
- [ ] Expand to other regions
- [ ] Add multi-language support
- [ ] Create community feedback loops

## 🔒 Security & Compliance

### Data Protection
- [ ] Implement GDPR compliance
- [ ] Create privacy policy
- [ ] Set up data retention policies
- [ ] Regular security audits

### Access Control
- [ ] Limit Google Sheet edit access
- [ ] Rotate API keys regularly
- [ ] Monitor for unauthorized access
- [ ] Backup data regularly

## 💰 Cost Estimation

### Monthly Costs (Estimated)
- **Netlify Pro**: $19/month (for better performance)
- **Domain**: $1-2/month
- **Google Cloud API**: $0-10/month (within free tier)
- **Monitoring Tools**: $0-20/month
- **Total**: ~$40-50/month

### Free Tier Options
- **Netlify Starter**: Free (with limitations)
- **Google Sheets API**: Free up to 100 requests/100 seconds
- **GitHub Actions**: Free for public repositories

## 📞 Support & Maintenance

### Community Support
- Create documentation wiki
- Set up community Discord/Slack
- Regular community calls
- Feedback collection system

### Technical Maintenance
- Weekly monitoring reviews
- Monthly performance optimization
- Quarterly security reviews
- Annual architecture review

## 🎉 Success Metrics

### Technical Metrics
- 99%+ uptime
- <3 second page load times
- <1% error rate
- 100+ events discovered per month

### Community Metrics
- 50+ organizations monitored
- 10+ community moderators
- 1000+ monthly active users
- 90%+ user satisfaction

This deployment plan ensures a smooth transition to Google Sheets while maintaining the community-focused, transparent approach that makes this platform special for the Black QTIPOC+ community! 🌟