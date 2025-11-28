# BLKOUT Event Scraper

Event discovery service for Black LGBTQ+ community events in the UK.

## Overview

This scraper automatically discovers events from UK event platforms and submits them to the BLKOUT Supabase database for moderation. Events are filtered by:

- **UK location** - Only events in UK cities
- **Community relevance** - Black LGBTQ+ focused keywords get higher scores
- **Trust score** - Sources are weighted by reliability

## Sources

| Source | Type | Category | Trust Score |
|--------|------|----------|-------------|
| Eventbrite UK | API/Web | Community | 0.9 |
| OutSavvy | RSS | Community | 0.85 |
| Dice.fm | Web | Nightlife | 0.8 |
| Skiddle | API/Web | Nightlife | 0.85 |
| DesignMyNight | Web | Nightlife | 0.8 |
| Meetup UK | RSS | Community | 0.85 |

## Usage

### Install dependencies

```bash
cd scraper
npm install
```

### Run immediately

```bash
npm run scrape
# or
RUN_NOW=true node server.js
```

### Run as cron service

```bash
npm start
```

Scheduled runs:
- **Daily at 6 AM and 6 PM UTC** - Regular event discovery
- **Sundays at midnight** - Weekly deep scrape

## How It Works

1. **Scraping**: Fetches events from configured sources using RSS, APIs, or web scraping (JSON-LD extraction)

2. **Filtering**: Events are scored by:
   - Black LGBTQ+ keyword matches (high weight)
   - General LGBTQ+ terms (medium weight)
   - UK location confirmation (required)

3. **Submission**: Relevant events (score > 0.2) are submitted to Supabase `events` table with status `pending`

4. **Moderation**: A database trigger automatically routes new events to `moderation_queue` for community review

## Environment Variables

```env
SUPABASE_URL=https://bgjengudzfickgomjqmz.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Database Integration

Events are inserted into the `events` table with:
- `status: 'pending'` - Requires moderation approval
- `priority: 'high'` or `'medium'` - Based on relevance score
- `source: 'Eventbrite UK - LGBTQ+'` etc. - Platform name

The `events_to_moderation_queue` trigger automatically creates a corresponding entry in `moderation_queue`.

## Deployment Options

1. **Railway/Render** - Deploy as standalone Node.js service
2. **Vercel Cron** - Add to existing Vercel deployment with cron functions
3. **GitHub Actions** - Run as scheduled workflow
4. **Local cron** - Run on any server with crontab

## Adding New Sources

Edit `eventScrapingService.js` and add to the `sources` array:

```javascript
{
  id: 'new_source',
  name: 'New Source Name',
  type: 'rss' | 'api' | 'web',
  url: 'https://...',
  relevanceKeywords: ['black', 'queer', ...],
  trustScore: 0.8,
  category: 'community'
}
```

## Community Values

This scraper prioritizes:
- **Black LGBTQ+ specific events** over general LGBTQ+ events
- **Community/social events** over commercial nightlife
- **UK-based events** (London, Manchester, Birmingham, etc.)
- **Empowerment language** over trauma-focused content
