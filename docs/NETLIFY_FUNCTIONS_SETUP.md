# Netlify Functions Setup for Event Scraping

## 🎯 Overview

This guide covers setting up Netlify Functions to automatically discover Black QTIPOC+ events from multiple sources and add them to your Google Sheet.

## 📁 Function Structure

```
netlify/functions/
├── scrape-eventbrite.ts     # Eventbrite API scraping
├── scrape-facebook.ts       # Facebook Graph API scraping  
├── scrape-all-sources.ts    # Orchestrates all scrapers
└── monitor-organizations.ts # Monitors known organizations
```

## 🔧 Environment Variables Setup

### In Netlify Dashboard:

1. Go to your site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add these variables:

```bash
# API Keys for Event Scraping
EVENTBRITE_API_TOKEN=your_eventbrite_api_token
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# Google Sheets Integration
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_API_KEY=your_google_api_key

# Optional: For write access to Google Sheets
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
```

## 🎫 Eventbrite API Setup

### Step 1: Get API Token
1. Go to [Eventbrite API](https://www.eventbrite.com/platform/api)
2. Create an app: "Black QTIPOC+ Events Calendar"
3. Copy your **Private Token**
4. Add to Netlify environment variables as `EVENTBRITE_API_TOKEN`

### Step 2: Function Features
- **Smart Search**: 10 different search strategies across UK cities
- **Relevance Scoring**: Weighted keyword matching (identity, community, values)
- **Quality Filtering**: Only events scoring 10+ points are added
- **Rate Limiting**: Respects Eventbrite's 1000 requests/hour limit
- **Error Handling**: Graceful handling of API errors and rate limits

### Step 3: Search Strategies
The function searches for:
- `black queer` in London, Manchester, Birmingham, Bristol, Leeds
- `qtipoc` in London, Brighton, Manchester, Bristol  
- `black trans` in London, Manchester, Birmingham, Leeds
- `black lgbtq` in London, Bristol, Manchester, Brighton
- Plus 6 more targeted searches

## 📘 Facebook Graph API Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app type: "Consumer"
3. Add Graph API product

### Step 2: Request Permissions (App Review Required)
You'll need these permissions:
- `pages_read_engagement`
- `pages_show_list` 
- `public_profile`

**Important**: Facebook requires app review for public event access.

### Step 3: Known Organizations
The function monitors these UK QTIPOC+ organizations:
- UK Black Pride (`UKBlackPride`)
- Glitter Cymru (`GlitterCymru`)
- Rainbow Noir Manchester (`RainbowNoirMCR`)
- Pxssy Palace (`PxssyPalace`)
- BBZ London (`bbz_london`)
- House of Noir (`houseofnoirmcr`)
- Colours Youth Network (`ColoursYouthUK`)
- Black Trans Alliance (`blacktransalliance`)
- Rat Party Leeds (`rat._.party`)
- Scotch Bonnet (`scotchbonnetglasgow`)

### Step 4: Function Features
- **Organization-Focused**: Monitors known QTIPOC+ pages
- **Relevance Filtering**: Additional keyword filtering
- **Event Enrichment**: Extracts tags, location data, attendance
- **Error Handling**: Graceful handling of permission issues

## 🔄 Combined Scraping Function

### scrape-all-sources.ts
This orchestrator function:
1. Calls all individual scrapers
2. Aggregates results
3. Logs combined session to Google Sheets
4. Returns comprehensive results

### Usage from Frontend:
```typescript
const response = await fetch('/.netlify/functions/scrape-all-sources', {
  method: 'POST'
});
const results = await response.json();
```

## 📊 Google Sheets Integration

### Writing to Sheets
Each function writes to your Google Sheet:

**Events Sheet**: New events added as draft status
**ScrapingLogs Sheet**: Session logs with metrics

### Data Format
Events are formatted as:
```
ID | Name | Description | EventDate | Location | Source | SourceURL | Organizer | Tags | Status | Price | ImageURL | ScrapedDate
```

## 🚀 Deployment

### Automatic Deployment
Functions deploy automatically when you push to your connected GitHub repository.

### Manual Testing
Test individual functions:
```bash
# Test Eventbrite scraper
curl -X POST https://your-site.netlify.app/.netlify/functions/scrape-eventbrite

# Test Facebook scraper  
curl -X POST https://your-site.netlify.app/.netlify/functions/scrape-facebook

# Test combined scraper
curl -X POST https://your-site.netlify.app/.netlify/functions/scrape-all-sources
```

## 📈 Monitoring & Analytics

### Function Logs
View logs in Netlify Dashboard:
1. Go to **Functions** tab
2. Click on function name
3. View **Function log**

### Performance Metrics
Each function returns:
- `events_found`: Total events discovered
- `events_relevant`: Events passing relevance filter
- `events_added`: Events added to Google Sheet
- `relevance_rate`: Percentage of relevant events
- `avg_relevance_score`: Average quality score

### Example Response:
```json
{
  "success": true,
  "events_found": 45,
  "events_relevant": 12,
  "events_added": 8,
  "relevance_rate": "26.7%",
  "avg_relevance_score": "15.2",
  "search_strategies_used": 10
}
```

## ⚡ Scheduled Execution

### Option 1: Netlify Scheduled Functions (Paid)
```typescript
// In your function file
export const schedule = "0 9 * * 1"; // Every Monday at 9 AM

export const handler = async (event, context) => {
  // Your scraping logic
};
```

### Option 2: GitHub Actions (Free)
Create `.github/workflows/scrape-events.yml`:
```yaml
name: Scrape Events
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Function
        run: |
          curl -X POST https://your-site.netlify.app/.netlify/functions/scrape-all-sources
```

### Option 3: External Cron Service
Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Zapier](https://zapier.com) (with webhooks)

## 🛡️ Security & Rate Limiting

### API Key Security
- Store all keys in Netlify environment variables
- Never commit keys to code
- Rotate keys periodically

### Rate Limiting
- **Eventbrite**: 1000 requests/hour (1.5 second delays)
- **Facebook**: Varies by app (2 second delays)
- Functions include automatic retry with exponential backoff

### Error Handling
- Graceful degradation when APIs are unavailable
- Detailed error logging for debugging
- Partial success reporting

## 🔧 Troubleshooting

### Common Issues

**Function Timeout**
- Netlify functions timeout after 10 seconds (free) / 26 seconds (paid)
- Consider breaking large operations into smaller chunks

**API Rate Limits**
- Check function logs for 429 errors
- Increase delays between requests
- Consider upgrading API plans

**Google Sheets Write Errors**
- Verify OAuth2 setup for write access
- Check sheet permissions
- Ensure proper data formatting

### Debug Mode
Add debug logging:
```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug info:', { events, relevanceScores });
}
```

## 📞 Support

For issues with:
- **Netlify Functions**: [Netlify Docs](https://docs.netlify.com/functions/overview/)
- **Eventbrite API**: [Eventbrite API Docs](https://www.eventbrite.com/platform/api)
- **Facebook API**: [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- **Google Sheets API**: [Google Sheets API Docs](https://developers.google.com/sheets/api)

## 🎉 Success!

Your Netlify Functions are now:
- ✅ Automatically discovering Black QTIPOC+ events
- ✅ Filtering for community relevance
- ✅ Adding events to your Google Sheet
- ✅ Logging all activity transparently
- ✅ Ready for scheduled execution

The community calendar will now grow automatically while maintaining quality and transparency! 🌟