# BrowserAct Webhook Deployment Options

## Decision: Which Platform Should You Use?

You have 3 options for deploying the BrowserAct webhook. Here's the analysis:

---

## **Option 1: Railway (ivor-core) - ✅ RECOMMENDED**

### Why This is Best
- ✅ **No new service** - Uses existing ivor-core infrastructure
- ✅ **Simpler architecture** - One API handles everything
- ✅ **Already have CORS configured** - Railway allows all origins
- ✅ **Easier debugging** - All logs in one place
- ✅ **Lower cost** - No additional service fees
- ✅ **Fastest** - Direct API call, no serverless cold starts

### Implementation
I've already added the code to `ivor-core/src/api/browserActRoutes.ts` and registered it in `server.ts`.

### Webhook URL
```
https://ivor-core.railway.app/api/browseract/webhook
```

### Deployment Steps
1. Push code to GitHub/Railway
2. Add environment variables to Railway:
   ```
   BROWSERACT_SECRET_TOKEN=your_token
   GOOGLE_SHEET_ID=your_sheet_id
   GOOGLE_API_KEY=your_api_key
   ```
3. Railway auto-deploys
4. Test: `curl https://ivor-core.railway.app/api/browseract/webhook`

### Pros
- Simplest maintenance (one service instead of two)
- No cold starts (Express server always running)
- Direct moderation integration (same codebase)
- Free tier: Railway gives $5/month credit

### Cons
- None significant for this use case

---

## **Option 2: Vercel Serverless Function**

### When This Makes Sense
- If events-calendar is already deployed to Vercel
- If you want to keep webhook separate from main API
- If you prefer serverless architecture

### Implementation
Create file at: `/events-calendar/api/browseract-webhook.ts`

```typescript
// See the detailed code I created in DEPLOYMENT-OPTIONS.md
```

### Webhook URL
```
https://blkout-events-calendar.vercel.app/api/browseract-webhook
```

### Deployment Steps
1. Create `/api` directory in events-calendar root
2. Add `browseract-webhook.ts` file
3. Configure environment variables in Vercel dashboard
4. Push to GitHub
5. Vercel auto-deploys

### Pros
- Serverless (only runs when called, no idle costs)
- Vercel's excellent performance and CDN
- Separate concerns (webhook not in main API)
- Free tier: Vercel gives 100GB bandwidth/month

### Cons
- Cold starts (first request after idle is slower)
- Adds another deployment to manage
- Vercel function timeout: 10 seconds (should be fine)

---

## **Option 3: Keep Netlify Functions (Current Setup)** ❌

### ⚠️ CRITICAL ISSUE: Netlify Functions Not Operational

**User Feedback**: "Netlify functions deployed (scrape-eventbrite, scrape-facebook, etc.) - but not operational"

**Status**: ❌ **NOT RECOMMENDED** - Existing Netlify scraping functions are broken and unreliable

### When This Makes Sense
- ❌ **It doesn't** - existing Netlify functions aren't working
- If you want to debug and fix existing Netlify infrastructure first
- Only after confirming Netlify functions are operational

### Implementation
You already have this code in `/netlify/functions/browseract-receiver.ts`

### Webhook URL
```
https://blkout-events-calendar.netlify.app/.netlify/functions/browseract-receiver
```

### Deployment Steps
1. Code already exists
2. **FIX EXISTING NETLIFY FUNCTIONS FIRST** (scrape-eventbrite, scrape-facebook)
3. Configure environment variables in Netlify dashboard
4. Push to GitHub
5. Netlify auto-deploys

### Pros
- Already implemented
- Netlify's simple function model
- Free tier: Netlify gives 125k requests/month

### Cons
- ❌ **CRITICAL**: Existing functions broken - unreliable infrastructure
- Cold starts on Netlify functions
- Another service to manage (vs Railway-only)
- Netlify function timeout: 10 seconds
- Debugging issues with current deployment

---

## Quick Comparison Table

| Feature | Railway (IVOR) | Vercel | Netlify |
|---------|---------------|--------|---------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Simplest | ⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐ Easy |
| **Performance** | ⭐⭐⭐⭐⭐ Always on | ⭐⭐⭐⭐ Cold starts | ⭐⭐⭐ Cold starts |
| **Cost** | $0 (existing) | $0 (free tier) | $0 (free tier) |
| **Maintenance** | ⭐⭐⭐⭐⭐ One service | ⭐⭐⭐ Two services | ⭐⭐⭐ Two services |
| **Debugging** | ⭐⭐⭐⭐⭐ One log | ⭐⭐⭐⭐ Separate logs | ⭐⭐⭐⭐ Separate logs |
| **Integration** | ⭐⭐⭐⭐⭐ Direct | ⭐⭐⭐⭐ HTTP call | ⭐⭐⭐⭐ HTTP call |

---

## Recommendation: Railway (Option 1) ✅

### Why?
1. **You already have Railway running 24/7 for ivor-core**
2. **No cold starts** - webhook responds instantly
3. **Simpler architecture** - one service instead of two
4. **Easier debugging** - all logs in Railway dashboard
5. **Cost-effective** - no additional service needed
6. **✅ PROVEN RELIABILITY** - Unlike Netlify functions which are currently broken

### Migration from Netlify/Vercel (if currently using)
If events-calendar is currently on Netlify or Vercel, you can:
1. Keep the frontend there (static hosting is fine)
2. Move just the webhook to Railway (via ivor-core)
3. Update BrowserAct webhook URL to Railway

---

## Implementation Status

### ✅ Railway (IVOR-CORE) - READY
- Code created: `ivor-core/src/api/browserActRoutes.ts`
- Routes registered in `server.ts`
- Ready to deploy once you add environment variables

### ✅ Netlify - READY
- Code created: `netlify/functions/browseract-receiver.ts`
- Ready to deploy once you add environment variables

### ⏳ Vercel - TEMPLATE PROVIDED
- See code template in previous file
- Need to create `/api` directory and add file
- Then configure environment variables

---

## Next Steps

### For Railway Deployment (Recommended)

1. **Commit and push ivor-core changes**:
   ```bash
   cd deployment-repos/ivor-core
   git add .
   git commit -m "Add BrowserAct webhook endpoint"
   git push
   ```

2. **Add environment variables in Railway dashboard**:
   - `BROWSERACT_SECRET_TOKEN` (generate with `openssl rand -base64 32`)
   - `GOOGLE_SHEET_ID` (from Google Sheets URL)
   - `GOOGLE_API_KEY` (from Google Cloud Console)
   - `GROQ_API_KEY` (from https://console.groq.com) - if not already set

3. **Test the endpoint**:
   ```bash
   curl -X POST https://ivor-core.railway.app/api/browseract/webhook \
     -H "Content-Type: application/json" \
     -H "X-BrowserAct-Token: YOUR_TOKEN" \
     -d '{
       "events": [{
         "type": "event",
         "title": "Test Event",
         "description": "Black Trans Community Gathering",
         "source_url": "https://test.com",
         "location": "London",
         "organizer_name": "Test Org"
       }]
     }'
   ```

4. **Configure BrowserAct**:
   - Webhook URL: `https://ivor-core.railway.app/api/browseract/webhook`
   - Header: `X-BrowserAct-Token: YOUR_TOKEN`
   - Method: POST

---

## Still Not Sure?

Ask yourself:

**"Where is events-calendar currently hosted?"**

- **Not deployed yet?** → Use Railway (simplest)
- **Already on Vercel?** → Use Railway anyway (better performance, simpler)
- **Already on Netlify?** → Use Railway anyway (Netlify functions broken, Railway more reliable)

**"Do I want the webhook separate from IVOR API?"**

- **No preference?** → Use Railway (fewer moving parts)
- **Want separation?** → Still use Railway (Netlify unreliable, Vercel adds complexity)

**"What about cold starts?"**

- **Want instant response?** → Use Railway (no cold starts)
- **Don't mind 1-2 second delay on first request?** → Still use Railway (reliability more important)

**"What about Netlify's issues?"**

- **Existing Netlify functions broken?** → Railway is the ONLY reliable option

---

## My Strong Recommendation

**Use Railway (Option 1)** unless you have a specific reason not to.

The code is ready, it's simpler, faster, and easier to maintain. You can always move it later if needed, but for an MVP and likely for production, Railway + ivor-core is the best choice.

**Questions?** Everything is implemented and ready - just needs deployment!
