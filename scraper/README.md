# BLKOUT Event Scraper

Event discovery service for Black LGBTQ+ community events in the UK.

## Overview

This scraper automatically discovers events from **scene-oriented periodicals and civil society organisations** - sources with higher-density, more relevant LGBTQ+ event listings than generic ticketing platforms.

Events are filtered by:
- **UK location** - Only events in UK cities
- **Community relevance** - Black LGBTQ+ focused keywords get higher scores
- **Trust score** - Sources are weighted by reliability

## Sources

| Source | Type | Category | Trust Score |
|--------|------|----------|-------------|
| QX Magazine Events | JSON-LD | Nightlife | 0.95 |
| QX Magazine Feed | RSS | Nightlife | 0.9 |
| DIVA Magazine Events | JSON-LD | Community | 0.95 |
| Consortium LGBT+ | iCal | Community | 0.95 |
| Eventbrite (Black LGBTQ+) | JSON-LD | Community | 0.85 |

**Note**: Generic ticketing platforms (Dice.fm, Skiddle, DesignMyNight) have been removed - too few relevant events to justify scraping. Manual searches on OutSavvy and Eventbrite are still recommended. Instagram/Facebook require alternative approaches.

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
- **Sundays at 6 AM UTC** - Weekly scrape (scene publications don't update frequently)

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
