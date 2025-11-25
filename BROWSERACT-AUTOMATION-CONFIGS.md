# BrowserAct Automation Configurations

Complete setup guide for automating BLKOUT events and news discovery using BrowserAct.

## Overview

These configurations enable BrowserAct to automatically scrape 5+ sources daily and send discovered content to IVOR for AI moderation.

**Expected Results**: 10-15 relevant events per day, 96% reduction in manual curation time.

---

## Webhook Configuration

**Endpoint**: `https://blkout-events-calendar.netlify.app/.netlify/functions/browseract-receiver`

**Authentication**: Add custom header in BrowserAct:
```
X-BrowserAct-Token: YOUR_BROWSERACT_SECRET_TOKEN
```

**Method**: POST

**Schedule**: Daily at 9:00 AM GMT

---

## Automation 1: LGBT Foundation Manchester Events

### Source Details
- **URL**: `https://lgbt.foundation/events`
- **Content Type**: Events
- **Expected Results**: 5-10 events per week
- **Update Frequency**: Daily

### BrowserAct Natural Language Instructions

```
Navigate to https://lgbt.foundation/events

Wait for the events list to load completely.

For each event on the page:
1. Extract the event title
2. Extract the event date and time
3. Extract the location/venue
4. Extract the description (full text)
5. Extract the event URL (link to event details)
6. Extract any tags or categories
7. Extract price/cost information if available
8. Extract the organizer name (usually "LGBT Foundation" or specific program)

Filter for events that mention:
- "Black" OR "QTIPOC" OR "POC" OR "people of colour" OR "African" OR "Caribbean"
- OR are explicitly tagged as relevant to Black communities

Return results as JSON array with this structure:
{
  "type": "event",
  "title": "...",
  "description": "...",
  "event_date": "YYYY-MM-DD",
  "event_time": "HH:MM",
  "location": "...",
  "organizer_name": "LGBT Foundation Manchester",
  "source_url": "...",
  "tags": ["black", "lgbtq", ...],
  "price": "Free" or "£X",
  "image_url": "..." (if available)
}

Send results to webhook: https://blkout-events-calendar.netlify.app/.netlify/functions/browseract-receiver
```

### Alternative Simplified Prompt
```
Go to https://lgbt.foundation/events
Scrape all events that mention "Black", "QTIPOC", "POC", "African", or "Caribbean"
Extract: title, date, time, location, description, URL, price
Send to webhook as JSON
```

---

## Automation 2: Galop LGBTQ+ Anti-Violence Charity Events

### Source Details
- **URL**: `https://galop.org.uk/get-involved/events/`
- **Content Type**: Events
- **Expected Results**: 2-5 events per month
- **Update Frequency**: Weekly

### BrowserAct Instructions

```
Navigate to https://galop.org.uk/get-involved/events/

Wait for events to load.

For each event:
1. Extract event title
2. Extract date and time
3. Extract location (online or physical)
4. Extract full description
5. Extract event page URL
6. Extract any accessibility information
7. Note if specifically for Black/POC LGBTQ+ communities

Return as JSON with this structure:
{
  "type": "event",
  "title": "...",
  "description": "...",
  "event_date": "YYYY-MM-DD",
  "location": "...",
  "organizer_name": "Galop",
  "source_url": "...",
  "tags": ["lgbtq", "safety", ...],
  "price": "Free",
  "accessibility": "..."
}

Send to webhook.
```

---

## Automation 3: Instagram - @queerblackjoy

### Source Details
- **URL**: `https://www.instagram.com/queerblackjoy/`
- **Content Type**: Events + News
- **Expected Results**: 3-5 posts per week
- **Update Frequency**: Daily
- **Note**: Requires Instagram login credentials

### BrowserAct Instructions

```
Login to Instagram with provided credentials.

Navigate to https://www.instagram.com/queerblackjoy/

Scroll through recent posts (last 7 days).

For each post that mentions events, workshops, gatherings, or news:
1. Extract the full caption text
2. Extract post date
3. Extract any event details from caption (date, time, location)
4. Extract image URL
5. Extract post URL
6. Identify if it's an "event" or "news" post

Parse event details from caption:
- Look for dates (format varies: "22nd Nov", "November 22", "22/11/2024")
- Look for times ("6pm", "18:00", "6-9pm")
- Look for locations ("Manchester", "online", "London", specific venues)
- Look for links to eventbrite/ticketing

Return as JSON:
{
  "type": "event" or "news",
  "title": "First sentence of caption or event name",
  "description": "Full caption text",
  "event_date": "YYYY-MM-DD" (if event),
  "event_time": "HH:MM" (if specified),
  "location": "..." (if specified),
  "organizer_name": "Queer Black Joy",
  "source_url": "Instagram post URL",
  "tags": ["black", "queer", ...],
  "image_url": "...",
  "price": "..." (if mentioned)
}

Send to webhook.
```

### Important Notes
- Instagram's anti-scraping is aggressive - use "human-like" scrolling
- Rate limit: max 20 posts per scrape
- Use mobile Instagram URL if desktop fails: `https://www.instagram.com/p/[post_id]/`

---

## Automation 4: Instagram - @ukblackpride

### Source Details
- **URL**: `https://www.instagram.com/ukblackpride/`
- **Content Type**: Events + News
- **Expected Results**: 5-10 posts per week
- **Update Frequency**: Daily

### BrowserAct Instructions

```
Login to Instagram.

Navigate to https://www.instagram.com/ukblackpride/

Scroll through recent posts (last 7 days).

Extract posts mentioning:
- Events, festivals, gatherings, meetups
- Community news, announcements
- Partnership/collaboration announcements

For each relevant post:
1. Extract full caption
2. Extract post date
3. Parse event details from caption
4. Extract image/video URL
5. Extract post link

Return as JSON (same structure as queerblackjoy automation).

Special attention to:
- UK Black Pride festival dates (usually August)
- Community partner events
- Educational workshops
- Fundraising events

Send to webhook.
```

---

## Automation 5: Facebook Events - "Black LGBTQ London"

### Source Details
- **URL**: `https://www.facebook.com/events/search?q=black%20lgbtq%20london`
- **Content Type**: Events
- **Expected Results**: 10-20 events per week
- **Update Frequency**: Daily
- **Note**: Requires Facebook login

### BrowserAct Instructions

```
Login to Facebook with provided credentials.

Navigate to: https://www.facebook.com/events/search?q=black%20lgbtq%20london

Filter by:
- Date: "This week" and "This month"
- Location: "London" (then also try "Manchester", "Birmingham")

For each event in results:
1. Click into event details
2. Extract event title
3. Extract date and time
4. Extract location/venue (full address if available)
5. Extract organizer name
6. Extract description (full text)
7. Extract event URL
8. Extract ticket/registration URL if available
9. Extract cover photo URL
10. Check "Going" count for popularity signal

Filter criteria:
- Must mention: "Black" OR "African" OR "Caribbean" OR "QTIPOC" OR "POC"
- AND mention: "LGBTQ" OR "queer" OR "trans" OR "gay" OR "lesbian"
- OR hosted by known Black LGBTQ+ organizations

Return as JSON:
{
  "type": "event",
  "title": "...",
  "description": "...",
  "event_date": "YYYY-MM-DD",
  "event_time": "HH:MM",
  "location": "...",
  "organizer_name": "...",
  "source_url": "Facebook event URL",
  "tags": ["black", "lgbtq", "london", ...],
  "price": "...",
  "image_url": "...",
  "attendance_interest": number of people interested/going
}

Send to webhook.

IMPORTANT: Respect rate limits - max 30 events per scrape.
```

### Alternative Search Queries

Run these as separate automations or rotate weekly:

1. `"Black Trans" OR "Black Non-Binary" events London`
2. `"QTIPOC" events UK`
3. `"Black Queer" community London`
4. `"Afro-Queer" OR "Afro-LGBTQ" events`
5. `"UK Black Pride" related events`

---

## Automation 6: Meetup.com (Optional)

### Source Details
- **URL**: `https://www.meetup.com/find/?keywords=black%20lgbtq&location=gb--london`
- **Content Type**: Events
- **Expected Results**: 5-10 events per month

### BrowserAct Instructions

```
Navigate to Meetup search for "Black LGBTQ" in London, UK.

For each meetup group and event:
1. Extract event title
2. Extract date and time
3. Extract location
4. Extract description
5. Extract organizer/group name
6. Extract member count (trust signal)
7. Extract event URL

Filter for:
- Active groups (>50 members)
- Events in next 3 months
- Groups explicitly for Black LGBTQ+ people

Return as JSON and send to webhook.
```

---

## Automation 7: Eventbrite Discovery (Optional)

### Source Details
- **URL**: `https://www.eventbrite.co.uk/d/united-kingdom--london/black-lgbtq/`
- **Content Type**: Events
- **Expected Results**: 15-25 events per month

### BrowserAct Instructions

```
Navigate to Eventbrite search for "Black LGBTQ" in London.

Sort by: "Date" (soonest first)

For each event:
1. Extract title, date, time, location
2. Extract organizer name
3. Extract description
4. Extract ticket price
5. Extract event URL
6. Extract cover image

Return as JSON and send to webhook.
```

---

## Error Handling & Fallbacks

Each automation should include:

```javascript
// Retry logic
If scraping fails:
  - Wait 5 minutes
  - Retry up to 3 times
  - If still fails, send error notification

// Validation
Before sending to webhook:
  - Verify required fields present (title, date, source_url)
  - Remove duplicate events (check URL)
  - Validate date format (YYYY-MM-DD)

// Rate limiting
- Max 100 events per automation per day
- Delay 2-3 seconds between page loads
- Use human-like scrolling patterns
```

---

## Testing Checklist

Before going live:

1. **Test webhook endpoint**:
   ```bash
   curl -X POST https://blkout-events-calendar.netlify.app/.netlify/functions/browseract-receiver \
     -H "Content-Type: application/json" \
     -H "X-BrowserAct-Token: YOUR_TOKEN" \
     -d '{"events":[{"type":"event","title":"Test Event","description":"Test","source_url":"https://test.com"}]}'
   ```

2. **Verify IVOR API responding**: Visit `https://ivor-core.railway.app/api/moderate/test`

3. **Check Google Sheets**: Ensure Events_PendingReview and Events_Published tabs exist

4. **Run each automation manually** with BrowserAct UI before scheduling

5. **Verify IVOR confidence scores** make sense (should be 70%+ for clearly relevant events)

---

## Monitoring & Maintenance

### Daily Checks (5 minutes)
- Review Google Sheets "Events_PendingReview" tab
- Quick scan of auto-approved events for false positives
- Check BrowserAct run logs for errors

### Weekly Reviews (15 minutes)
- Analyze IVOR accuracy: compare AI decisions vs curator decisions
- Adjust automation queries if too many irrelevant results
- Add new sources as discovered

### Monthly Optimization
- Review which sources provide highest quality events
- Adjust BrowserAct schedules based on source update patterns
- Fine-tune IVOR prompts if needed

---

## Expected Performance Metrics

After 2 weeks of operation:

| Metric | Target | Current (Manual) |
|--------|--------|------------------|
| Events discovered per week | 50-70 | 20-30 |
| Curator time per week | 1 hour | 19 hours |
| Auto-approved rate | 70-80% | 0% |
| False positive rate | <10% | N/A |
| Time saved per month | 72 hours | - |
| Cost saved per month | £1,800 | - |

---

## Troubleshooting

### Issue: No events being scraped
**Solution**: Check if source website changed structure. Update BrowserAct selectors.

### Issue: All events going to deep review
**Solution**: IVOR confidence too low. Check if event descriptions include enough context. May need to adjust IVOR prompt.

### Issue: Too many irrelevant events
**Solution**: Add more specific keywords to BrowserAct filters. Example: Change "Black" to "Black AND (LGBTQ OR queer OR trans)"

### Issue: Duplicate events
**Solution**: BrowserAct should deduplicate by URL before sending. Check webhook receiver logic.

### Issue: Instagram scraping failing
**Solution**: Instagram has aggressive anti-bot measures. Use BrowserAct's "stealth mode" and reduce frequency to every 2-3 days.

---

## Next Steps

1. ✅ Copy BrowserAct automations from this document
2. ⏳ Set up each automation in BrowserAct UI (one at a time)
3. ⏳ Add webhook URL and authentication header
4. ⏳ Test each automation manually
5. ⏳ Schedule daily runs (stagger times to avoid rate limits)
6. ⏳ Monitor results for first week
7. ⏳ Iterate and optimize based on performance

---

**Questions?** Reference the main integration document: `BROWSERACT-IVOR-INTEGRATION.md`

**Support**: BrowserAct documentation: https://www.browseract.com/blog/category/help-center
