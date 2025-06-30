# 🚀 Black QTIPOC+ Events Calendar - Deployment Ready

## ✅ **Production Ready Features**

### 🏛️ **Organization Management System**
- **6 pre-configured UK QTIPOC+ organizations** with monitoring data
- **350+ organization directory** documented and ready for expansion
- **Smart scheduling**: Weekly/Monthly/Quarterly monitoring frequencies
- **Google Sheets integration** for transparent community data management

### 🔍 **Automated Event Discovery**
- **Multi-platform scraping**: Eventbrite + Facebook + Outsavvy
- **UK-focused targeting**: 5 major cities, 10 search strategies
- **37 sophisticated keywords** across 4 categories (identity, community, values, event types)
- **Relevance scoring algorithm** for Black QTIPOC+ event filtering

### 🤖 **GitHub Actions Automation**
- **Weekly automated scraping** (Mondays 9 AM UTC)
- **Organization monitoring** with frequency-based checking
- **Deployment automation** on main branch pushes
- **Manual trigger options** for testing and emergency runs

### 🌐 **Netlify Functions Ready**
- `scrape-all-sources.ts` - Coordinated multi-platform discovery
- `scrape-eventbrite.ts` - Eventbrite API integration
- `scrape-facebook.ts` - Facebook Graph API integration  
- `monitor-organizations.ts` - Organization-specific monitoring

### 📊 **Community Dashboard**
- **Public event calendar** with advanced filtering
- **Community submission form** for event contributions
- **Admin moderation queue** with approval workflows
- **Organization monitoring dashboard** with performance metrics
- **Google Sheets transparency** - all data publicly accessible

## 🔧 **Environment Variables Required**

### **Frontend (Netlify Site)**
```bash
VITE_GOOGLE_SHEET_ID=1v9QRB1SMlSfUpwc-skEFVL_9zM32CTb9mOcBpxWL7es
VITE_GOOGLE_API_KEY=AIzaSyCRD3GT7vU9seLW4XqE87N5zvbQuPzc85c
VITE_GOOGLE_CLIENT_ID=914448728713-rh7jb89d84oesik32me40cqjjbnrie3g.apps.googleusercontent.com
```

### **Netlify Functions (Serverless)**
```bash
EVENTBRITE_API_TOKEN=LFE2HSUANJZB57JJXNYZ
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
OUTSAVVY_API_KEY=ZR8JUA8ILRSSVWUNFIT3
GOOGLE_SHEET_ID=1v9QRB1SMlSfUpwc-skEFVL_9zM32CTb9mOcBpxWL7es
GOOGLE_API_KEY=AIzaSyCRD3GT7vU9seLW4XqE87N5zvbQuPzc85c
```

### **GitHub Secrets Required**
```bash
NETLIFY_SITE_URL=https://your-site.netlify.app
VITE_GOOGLE_SHEET_ID=1v9QRB1SMlSfUpwc-skEFVL_9zM32CTb9mOcBpxWL7es
VITE_GOOGLE_API_KEY=AIzaSyCRD3GT7vU9seLW4XqE87N5zvbQuPzc85c
```

## 📋 **Deployment Checklist**

### **Phase 1: Repository Setup** ✅
- [x] Git repository initialized
- [x] GitHub remote configured: `BLKOUTUK/black-qtipoc-events-calendar`
- [x] GitHub Actions workflows configured
- [x] Netlify configuration ready (`netlify.toml`)

### **Phase 2: Netlify Deployment**
- [ ] Connect GitHub repository to Netlify
- [ ] Configure environment variables in Netlify
- [ ] Set up Netlify Functions environment
- [ ] Test initial deployment

### **Phase 3: API Configuration**  
- [ ] Verify Google Sheets API access
- [ ] Test Eventbrite API token (may need refresh)
- [ ] Configure Facebook Graph API (requires app review)
- [ ] Test Outsavvy API integration

### **Phase 4: Automation Setup**
- [ ] Configure GitHub repository secrets
- [ ] Test GitHub Actions workflows
- [ ] Set up weekly scraping schedule
- [ ] Configure monitoring alerts

### **Phase 5: Community Launch**
- [ ] Import initial event data
- [ ] Test community submission flow
- [ ] Set up admin access for moderation
- [ ] Community announcement and feedback collection

## 🎯 **Immediate Next Steps**

1. **Push to GitHub**: `git push -u origin main`
2. **Connect to Netlify**: Link GitHub repository
3. **Configure Environment Variables**: Set up all required variables
4. **Test Deployment**: Verify build and functions work
5. **Test Scraping**: Run manual scraping functions

## 🌟 **Community Impact Ready**

This platform is specifically designed for **Black QTIPOC+ community event discovery**:

- **Transparent Data**: Google Sheets backend for community oversight
- **Inclusive Discovery**: AI-powered relevance scoring for community events
- **Geographic Coverage**: UK-wide with focus on major cities
- **Organization-Centered**: Direct monitoring of known community groups
- **Community Guidelines**: Built-in moderation and safety features

**Ready to serve the Black QTIPOC+ community with sophisticated event discovery while maintaining transparency and community control.**