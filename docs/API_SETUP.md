# API Setup Guide

This guide walks you through setting up the necessary API keys for the event scraping functionality.

## 🎫 Eventbrite API Setup

### Step 1: Create Eventbrite Account
1. Go to [Eventbrite.com](https://www.eventbrite.com) and create an account
2. Navigate to [Eventbrite API](https://www.eventbrite.com/platform/api)

### Step 2: Create an App
1. Click "Create App" or "Get Started"
2. Fill out the application form:
   - **App Name**: "Black QTIPOC+ Events Calendar"
   - **Description**: "Community platform for discovering Black QTIPOC+ events"
   - **Website**: Your platform URL
   - **Use Case**: "Event Discovery and Community Calendar"

### Step 3: Get API Token
1. Once approved, go to your app dashboard
2. Copy your **Private Token** (this is your API key)
3. Add to your Supabase Edge Functions environment variables:
   ```
   EVENTBRITE_API_TOKEN=your_token_here
   ```

### API Limits
- **Free Tier**: 1,000 requests per day
- **Rate Limit**: 1000 requests per hour
- **Paid Plans**: Available for higher usage

### Testing
```bash
curl "https://www.eventbriteapi.com/v3/events/search/?q=black%20queer&location.address=New%20York&token=YOUR_TOKEN"
```

## 📘 Facebook Graph API Setup

### Step 1: Create Facebook Developer Account
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a developer account if you don't have one

### Step 2: Create Facebook App
1. Click "Create App"
2. Choose "Consumer" as the app type
3. Fill out app details:
   - **App Name**: "Black QTIPOC+ Events Calendar"
   - **Contact Email**: Your email
   - **Purpose**: "Community event discovery platform"

### Step 3: Add Graph API Product
1. In your app dashboard, click "Add Product"
2. Find "Graph API" and click "Set Up"

### Step 4: Request Permissions
For public event access, you'll need to request these permissions:
- `pages_read_engagement`
- `pages_show_list`
- `public_profile`

### Step 5: App Review Process
**Important**: Facebook requires app review for accessing public events.

1. Go to "App Review" in your app dashboard
2. Request the permissions listed above
3. Provide detailed explanation:
   ```
   Our platform serves the Black QTIPOC+ community by discovering 
   and curating relevant events. We need access to public events 
   from known community organizations to help our community find 
   safe, inclusive spaces and celebrations.
   ```
4. Include screenshots of your platform
5. Provide test credentials if requested

### Step 6: Get Access Token
1. Go to "Tools" > "Graph API Explorer"
2. Select your app
3. Generate a long-lived access token
4. Add to your environment variables:
   ```
   FACEBOOK_ACCESS_TOKEN=your_token_here
   ```

### Known Organizations to Track
Add these types of organizations to your scraping list:
- Black Lives Matter chapters
- Local QTIPOC+ community centers
- Black queer arts organizations
- Trans advocacy groups
- Intersectional justice organizations

### Testing
```bash
curl "https://graph.facebook.com/v18.0/PAGE_ID/events?access_token=YOUR_TOKEN"
```

## 🎭 Outsavvy API Setup

### Current Status
Outsavvy may not have a publicly available API. Here are alternatives:

### Option 1: Contact Outsavvy
1. Email their support team
2. Explain your community platform purpose
3. Request API access or partnership

### Option 2: Web Scraping (Legal Considerations)
1. Review Outsavvy's Terms of Service
2. Implement respectful scraping with rate limiting
3. Consider reaching out for permission first

### Option 3: Manual Curation
1. Create partnerships with UK-based QTIPOC+ organizations
2. Encourage direct event submissions
3. Monitor Outsavvy manually for relevant events

## 🔧 Environment Variable Setup

### Supabase Edge Functions
Add these to your Supabase project settings:

1. Go to your Supabase dashboard
2. Navigate to "Settings" > "Edge Functions"
3. Add environment variables:
   ```
   EVENTBRITE_API_TOKEN=your_eventbrite_token
   FACEBOOK_ACCESS_TOKEN=your_facebook_token
   OUTSAVVY_API_KEY=your_outsavvy_key (if available)
   ```

### Local Development
Create a `.env` file in your project root:
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (for testing edge functions locally)
EVENTBRITE_API_TOKEN=your_eventbrite_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token
```

## 📊 Monitoring and Rate Limits

### Best Practices
1. **Respect Rate Limits**: Implement proper delays between requests
2. **Monitor Usage**: Track API usage to avoid hitting limits
3. **Error Handling**: Gracefully handle API errors and rate limiting
4. **Caching**: Cache results to reduce API calls
5. **Logging**: Log all API interactions for debugging

### Rate Limiting Strategy
```typescript
// Example rate limiting implementation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Eventbrite: 1000 requests/hour = ~1 request every 3.6 seconds
await delay(4000);

// Facebook: Varies by app, typically 200 requests/hour
await delay(18000);
```

## 🚨 Troubleshooting

### Common Issues

**Eventbrite 401 Unauthorized**
- Check your API token is correct
- Ensure token has proper permissions
- Verify token hasn't expired

**Facebook 403 Forbidden**
- App may need review for permissions
- Check if accessing public vs private events
- Verify access token is valid

**Rate Limiting (429 Too Many Requests)**
- Implement exponential backoff
- Reduce request frequency
- Consider upgrading API plan

### Testing Your Setup
Use the admin dashboard's "Discover Events" button to test your API integrations. Check the scraping logs for any errors or issues.

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review API documentation for each platform
3. Open an issue in the GitHub repository
4. Email: tech@qtipocevents.org

Remember: Building community platforms takes time, and API approvals can take weeks. Be patient and persistent! 🌟