# 🚀 Launch Checklist - Black QTIPOC+ Events Calendar

## 📋 Pre-Launch (Complete these first)

### Google Sheets Setup
- [ ] **Create production Google Sheet** with 4 tabs (Events, ScrapingLogs, Contacts, OrganizationsToMonitor)
- [ ] **Add sample data** from the setup guide
- [ ] **Configure formatting** (colors, validation, conditional formatting)
- [ ] **Make sheet public** (read-only access)
- [ ] **Copy Sheet ID** from URL
- [ ] **Test sheet access** in incognito mode

### Google Cloud API
- [ ] **Create Google Cloud project**
- [ ] **Enable Google Sheets API**
- [ ] **Create API key**
- [ ] **Restrict API key** to Google Sheets API only
- [ ] **Add domain restrictions** (your Netlify domain)
- [ ] **Test API access** with curl or Postman

### GitHub Repository
- [ ] **Push all code** to main branch
- [ ] **Verify all files** are committed
- [ ] **Check .env.example** has all required variables
- [ ] **Update README.md** with your specific setup

### Netlify Deployment
- [ ] **Connect GitHub repo** to Netlify
- [ ] **Set build command**: `npm run build`
- [ ] **Set publish directory**: `dist`
- [ ] **Add environment variables**:
  - `VITE_GOOGLE_SHEET_ID`
  - `VITE_GOOGLE_API_KEY`
- [ ] **Deploy successfully** (green build)
- [ ] **Test live site** functionality

## 🔧 API Integration (Optional but recommended)

### Eventbrite API
- [ ] **Create Eventbrite developer account**
- [ ] **Create app** and get API token
- [ ] **Add to Netlify env vars**: `EVENTBRITE_API_TOKEN`
- [ ] **Test scraping function**: `/.netlify/functions/scrape-eventbrite`

### Facebook API (Requires app review)
- [ ] **Create Facebook developer account**
- [ ] **Create Facebook app**
- [ ] **Request permissions** for public events
- [ ] **Submit for app review** (can take weeks)
- [ ] **Add to Netlify env vars**: `FACEBOOK_ACCESS_TOKEN`

## 🧪 Testing Phase

### Functionality Testing
- [ ] **Homepage loads** correctly
- [ ] **Event submission form** works
- [ ] **Events display** properly
- [ ] **Filtering works** (date, source, location, search)
- [ ] **Admin login** works (`admin@example.com` / `admin123`)
- [ ] **Moderation queue** displays pending events
- [ ] **Event approval/rejection** updates Google Sheet
- [ ] **Calendar export** generates correct links

### Mobile Testing
- [ ] **Test on iPhone** (Safari)
- [ ] **Test on Android** (Chrome)
- [ ] **Check responsive design** at different screen sizes
- [ ] **Verify touch interactions** work properly
- [ ] **Test form submission** on mobile

### Performance Testing
- [ ] **Lighthouse score** 90+ on mobile and desktop
- [ ] **Page load time** under 3 seconds
- [ ] **Images load** properly
- [ ] **No console errors**

### Data Integration Testing
- [ ] **Submit test event** through form
- [ ] **Verify event appears** in Google Sheet
- [ ] **Approve event** in admin dashboard
- [ ] **Check event shows** on public homepage
- [ ] **Test scraping functions** (if APIs configured)

## 🌐 Production Launch

### Final Preparations
- [ ] **Remove test data** from Google Sheet
- [ ] **Add real community events** (5-10 to start)
- [ ] **Update community guidelines** with real contact info
- [ ] **Set up monitoring** (bookmark Netlify dashboard)
- [ ] **Create admin accounts** for community moderators

### Go Live
- [ ] **Announce to community** on social media
- [ ] **Share with partner organizations**
- [ ] **Submit to community directories**
- [ ] **Create press kit** with screenshots and description
- [ ] **Monitor for issues** first 24 hours

### Custom Domain (Optional)
- [ ] **Purchase domain** (e.g., qtipocevents.org)
- [ ] **Configure DNS** in Netlify
- [ ] **Enable HTTPS** (automatic)
- [ ] **Update social media** with new domain
- [ ] **Update Google Cloud API** restrictions

## 📊 Post-Launch Monitoring

### Week 1
- [ ] **Check daily** for new event submissions
- [ ] **Monitor Netlify** function logs for errors
- [ ] **Review Google Sheet** for data quality
- [ ] **Gather community feedback**
- [ ] **Fix any reported issues**

### Month 1
- [ ] **Review analytics** (Netlify dashboard)
- [ ] **Assess event quality** and relevance
- [ ] **Optimize scraping** if APIs are active
- [ ] **Plan feature improvements**
- [ ] **Document lessons learned**

### Ongoing
- [ ] **Weekly moderation** of new events
- [ ] **Monthly data backup** (export Google Sheet)
- [ ] **Quarterly security review** (rotate API keys)
- [ ] **Annual platform review** and updates

## 🎯 Success Metrics

### Technical
- **Uptime**: 99%+ (Netlify provides this)
- **Load Speed**: <3 seconds
- **Mobile Score**: 90+ (Lighthouse)
- **Error Rate**: <1%

### Community
- **Events Published**: 20+ in first month
- **Community Submissions**: 50%+ of events
- **User Engagement**: Regular return visitors
- **Community Feedback**: Positive response

## 🆘 Emergency Contacts

### Technical Issues
- **Netlify Support**: [netlify.com/support](https://netlify.com/support)
- **Google Cloud Support**: [cloud.google.com/support](https://cloud.google.com/support)
- **GitHub Issues**: Your repository issues page

### Community Issues
- **Platform Email**: community@qtipocevents.org
- **Moderation Team**: List your moderators
- **Emergency Contact**: Your primary contact

## ✅ Launch Complete!

Once all items are checked:
- [ ] **Celebrate!** 🎉 You've built something amazing for the community
- [ ] **Share your success** with the community
- [ ] **Plan next features** based on user feedback
- [ ] **Keep building** and improving

**Your Black QTIPOC+ Events Calendar is now live and serving the community!** 🌟✊🏿🏳️‍⚧️🏳️‍🌈