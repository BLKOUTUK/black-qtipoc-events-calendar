# Jina AI Enhanced Event Discovery Setup

## Overview

The IVOR Events Calendar now includes advanced AI-powered event discovery using Jina AI's web scraping and intelligence APIs. This dramatically improves the quality and coverage of Black QTIPOC+ event discovery.

## Setup Instructions

### 1. Get Jina AI API Key

1. Visit [https://jina.ai/](https://jina.ai/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy the API key for configuration

### 2. API Key Configuration

#### Option A: Browser Storage (Easiest for Development)
1. Open the IVOR calendar in your browser
2. Open browser console (F12)
3. Run this command:
```javascript
localStorage.setItem("JINA_AI_API_KEY", "your_jina_api_key_here")
```
4. Refresh the page

#### Option B: Environment File (Production)
Create a `.env` file in the project root:
```bash
# Jina AI Configuration
VITE_JINA_API_KEY=your_jina_api_key_here

# Existing Google Sheets Configuration
VITE_GOOGLE_SHEET_ID=your_google_sheet_id
VITE_GOOGLE_API_KEY=your_google_api_key
```

### 3. API Usage and Costs

**Free Tier Limits:**
- Search API: 40 requests/minute
- Reader API: 100 requests/day
- Embeddings: Limited requests

**Estimated Monthly Costs (Production):**
- Search operations: ~$3-5/month
- Content extraction: ~$2-3/month
- Intelligence analysis: ~$1-2/month
- **Total: ~$6-10/month**

**Daily Budget Controls:**
- Automatic budget limiting (100 API calls/day default)
- Smart caching to reduce API usage
- Fallback to mock data if budget exhausted

### 4. Features Enabled

#### Enhanced Event Discovery
- **Quick Discovery**: Daily high-value source scanning
- **Deep Discovery**: Weekly comprehensive web scraping
- **Intelligent Discovery**: Pattern-based event finding

#### Community Intelligence
- Trending topics analysis
- Emerging organizer identification
- Location hotspot mapping
- Accessibility score calculation

#### Partnership Opportunities
- Automatic organizer contact identification
- Event theme analysis
- Partnership potential scoring

### 5. Testing the Integration

#### Without API Key (Development)
- System falls back to enhanced mock data
- Full functionality available for testing
- No API costs incurred

#### With API Key (Production)
1. Add API key to `.env` file
2. Run event scraping from admin panel
3. Check Intelligence Dashboard for insights
4. Monitor API usage in dashboard

### 6. Usage Instructions

#### For Administrators
1. **Login** with admin credentials (admin@example.com / admin123)
2. **Intelligence Dashboard**: Click "Intelligence" button
3. **Run Discovery**: Use "Run Discovery" button to find new events
4. **Monitor Usage**: Check API usage in dashboard

#### For Developers
```typescript
// Manual discovery trigger
import { enhancedDiscoveryEngine } from './services/enhancedDiscoveryEngine';

// Quick daily discovery
const events = await enhancedDiscoveryEngine.runDiscovery('quick');

// Deep weekly discovery
const events = await enhancedDiscoveryEngine.runDiscovery('deep');

// Get community intelligence
const intelligence = await jinaAIService.generateCommunityIntelligence(events);
```

### 7. Monitoring and Optimization

#### API Usage Optimization
- **Caching**: Events cached to prevent duplicate API calls
- **Deduplication**: Smart event deduplication reduces processing
- **Budget Control**: Daily limits prevent cost overruns
- **Fallback Systems**: Graceful degradation if API unavailable

#### Quality Metrics
- **Relevance Scoring**: AI-powered QTIPOC+ relevance assessment
- **Source Reliability**: Track which sources provide best events
- **Discovery Efficiency**: Monitor events found per API call

### 8. Troubleshooting

#### Common Issues

**"API key not configured" error:**
- Check `.env` file exists with correct API key
- Restart development server after adding key

**"Daily budget exhausted" message:**
- Increase daily budget in `jinaAIService.ts`
- Or wait for automatic daily reset

**"Discovery failed, falling back" message:**
- Check internet connection
- Verify API key is valid
- Check Jina AI service status

#### Debugging

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('debug', 'jina:*');
```

### 9. Production Deployment

#### Environment Variables
- Set `VITE_JINA_API_KEY` in production environment
- Configure Google Sheets API for persistence
- Set up monitoring and alerting

#### Scaling Considerations
- Monitor API usage patterns
- Consider upgrading Jina AI plan for higher limits
- Implement database persistence for events
- Set up automated daily/weekly discovery schedules

### 10. Future Enhancements

#### Planned Features
- **RSS Feed Integration**: Automatic organization feed monitoring
- **Social Media Discovery**: Twitter/Instagram event finding
- **Predictive Analytics**: Event attendance and success prediction
- **Advanced Partnerships**: Automated outreach recommendations

#### Integration Opportunities
- **BLKOUTHUB Integration**: Share intelligence data
- **Advocacy Tools**: Generate community impact reports
- **Grant Applications**: Automated community metrics for funding

## Support

For technical support:
- Check [Jina AI Documentation](https://docs.jina.ai/)
- Review console logs for error details
- Contact BLKOUT development team

For community questions:
- Use #askivor hashtag on social media
- Join BLKOUTHUB discussions
- Submit feedback through the calendar interface