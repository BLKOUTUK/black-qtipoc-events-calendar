# BLKOUT Events Calendar - Architecture Document

**Last updated:** February 2, 2026
**Deployment:** Coolify (Docker) at `events.blkoutuk.cloud`
**Repository:** BLKOUTUK/black-qtipoc-events-calendar

---

## System Overview

The BLKOUT Events Calendar is a community-curated events platform for Black LGBTQ+ communities in the UK. It combines automated multi-source scraping, community submissions via a Chrome extension, AI-powered moderation, and a React frontend.

```
                    ┌─────────────────────────┐
                    │   Chrome Extension      │
                    │   (Content Curator)     │
                    └────────┬────────────────┘
                             │ POST /api/submit-event
                             │ OR direct Supabase insert
                             ▼
┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  Automated   │───▶│    Supabase      │◀───│  React Frontend    │
│  Scraper     │    │  (events table)  │    │  (Vite + Tailwind) │
│  (Weekly)    │    └──────────────────┘    └────────────────────┘
└──────────────┘             │
                             ▼
                    ┌──────────────────┐
                    │  Moderation      │
                    │  Pipeline        │
                    │  (API routes)    │
                    └──────────────────┘
```

---

## Infrastructure

### Deployment
- **Platform:** Coolify on Hostinger UK VPS
- **Container:** Docker (node:22-alpine)
- **Runtime:** tsx (TypeScript execution without build step for server)
- **Frontend build:** Vite (built during Docker build stage)
- **Auto-deploy:** Push to `main` triggers Coolify rebuild

### Dockerfile Architecture
```
Builder stage:
  npm install → COPY . . → npm run build (Vite)

Runner stage:
  npm install --production
  COPY dist/         (built frontend)
  COPY server.ts     (Express server)
  COPY api/          (API routes)
  CMD ["tsx", "server.ts"]
```

The scraper directory (`scraper/`) and Netlify functions (`netlify/functions/`) are NOT copied to the production image. All scraping logic is in `api/scrape-events.ts`.

---

## Data Flow

### 1. Event Sources

| Source | Method | Frequency | Trust Level |
|--------|--------|-----------|-------------|
| QX Magazine Events | JSON-LD structured data scraping | Weekly | Trusted (auto-approve) |
| QX Magazine Feed | RSS feed parsing | Weekly | Trusted (auto-approve) |
| DIVA Magazine Events | JSON-LD structured data scraping | Weekly | Trusted (auto-approve) |
| Consortium LGBT+ | iCal/ICS feed parsing | Weekly | Trusted (auto-approve) |
| Eventbrite (JSON-LD) | Web scraping with search terms | Weekly | Trusted (auto-approve) |
| Eventbrite API | Official API for known orgs | Weekly | Trusted (auto-approve) |
| Outsavvy API | Partner API with geo search | Weekly | Trusted (auto-approve) |
| Time Out London | JSON-LD structured data scraping | Weekly | Trusted (auto-approve) |
| Chrome Extension | Manual community submissions | On demand | Pending (needs review) |

### 2. Scraping Pipeline (`api/scrape-events.ts`)

```
Source websites/APIs
        │
        ▼
┌─────────────────────────┐
│  Scraper Orchestrator    │
│  - scrapeJSONLDSource()  │  ← QX, DIVA, Eventbrite search, Time Out
│  - scrapeRSSFeed()       │  ← QX RSS
│  - scrapeICalSource()    │  ← Consortium LGBT+
│  - scrapeEventbriteAPI() │  ← BlackOutUK org events
│  - scrapeOutsavvyAPI()   │  ← UK city-based LGBTQ+ searches
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Relevance Filtering     │
│  - Black LGBTQ+ keywords │
│  - UK location check     │
│  - Score threshold >0.2  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Deduplication           │
│  - Title + date matching │
│  - URL-based dedup       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Supabase Insert         │
│  - Duplicate check first │
│  - Trust-based status    │
│  - Priority from score   │
└─────────────────────────┘
```

### 3. Scheduling

The scraper runs on a weekly schedule (Sunday 06:00 UTC), managed by `setInterval` in `server.ts`. No external cron or task scheduler is needed.

Manual trigger: `POST /api/scrape-events` with `Authorization: Bearer <SCRAPER_SECRET>`.

Status check: `GET /api/scrape-events` returns source configuration and API status.

---

## API Routes

All routes are auto-registered by Express from the `api/` directory.

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/scrape-events` | POST | SCRAPER_SECRET | Trigger manual scraping run |
| `/api/scrape-events` | GET | None | Check scraper status/config |
| `/api/submit-event` | POST | None | Chrome extension event submission |
| `/api/calendar` | GET | None | iCal feed of approved events |
| `/api/pending-events` | GET | None | List events awaiting moderation |
| `/api/approve-event` | POST | None | Approve a pending event |
| `/api/moderate-event` | POST | None | Moderate (approve/reject) event |
| `/api/moderate-content` | POST | None | AI-powered content moderation |
| `/api/moderation-stats` | GET | None | Moderation pipeline statistics |
| `/api/generate-recurring-instances` | POST | None | Generate recurring event instances |

---

## Moderation Pipeline

Events enter the system with a status based on their source:

```
Trusted sources (QX, DIVA, Consortium, Eventbrite, Outsavvy)
  → status: 'approved' (auto-published)

Community submissions (Chrome extension)
  → Liberation validation check
    → High liberation score + no concerns → 'published' (auto-approve)
    → Low score or concerns → 'pending' (moderation queue)

Manual review sources (n8n, research agent)
  → status: 'pending' (always goes to queue)
```

### Liberation Validation

The `submit-event.ts` endpoint runs a liberation alignment check:
- Scores content against liberation indicators (Black queer, safe space, mutual aid, etc.)
- Checks for anti-oppression concerns (corporate diversity washing, fetishization)
- Returns: `auto-approve`, `review-quick`, or `review-deep`

---

## Chrome Extension

**Directory:** `src/extension/`
**Manifest:** V3 (service worker)
**Version:** 1.1.1

### Supported Sites
- Event platforms: Eventbrite, Meetup, Outsavvy, DICE, Skiddle, DesignMyNight
- News sources: Guardian, BBC, Independent, PinkNews, gal-dem, Attitude, Dazed
- Social: Facebook Events, Instagram

### How It Works
1. Content scripts detect event/article data on supported sites
2. User reviews extracted data in the popup
3. Submission goes to Supabase `events` table (source: `chrome-extension`, status: `pending`)
4. Events appear in the moderation queue for review

### Loading the Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src/extension/` directory

---

## Frontend Services

| Service | Purpose |
|---------|---------|
| `eventService.ts` | Primary event data fetcher (Supabase → frontend) |
| `supabaseEventService.ts` | Direct Supabase event queries |
| `supabaseApiService.ts` | Generic Supabase API wrapper |
| `localEventService.ts` | Fallback local event data |
| `googleSheetsService.ts` | Legacy Google Sheets reader (deprecated) |
| `googleCalendarService.ts` | Google Calendar integration |
| `eventModerationService.ts` | Moderation UI service |
| `EventsLiberationService.ts` | Liberation scoring for frontend |
| `featuredContentService.ts` | Featured/highlighted events |
| `enhancedDiscoveryEngine.ts` | Event discovery and recommendation |
| `jinaAIService.ts` | AI-powered content analysis |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `EVENTBRITE_API_TOKEN` | No | Eventbrite API token for org-level scraping |
| `OUTSAVVY_API_KEY` | No | Outsavvy Partner API key |
| `SCRAPER_SECRET` | No | Auth secret for manual scrape trigger |
| `IVOR_API_URL` | No | IVOR AI assistant URL (default: https://ivor.blkoutuk.cloud) |
| `GOOGLE_SHEET_ID` | No | Legacy Google Sheets ID |
| `GOOGLE_API_KEY` | No | Legacy Google API key |

---

## Database Schema (Supabase)

### `events` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Event title (NOT NULL) |
| `description` | text | Event description (NOT NULL) |
| `date` | date | Event start date |
| `end_date` | date | Event end date |
| `start_time` | text | Start time (HH:MM) |
| `end_time` | text | End time (HH:MM) |
| `location` | text | Venue/location |
| `organizer` | text | Event organizer |
| `cost` | text | Price or "Free" |
| `url` | text | Source/ticket URL |
| `source` | text | Where the event came from |
| `tags` | text[] | Array of topic tags |
| `status` | text | approved, pending, draft, rejected |
| `priority` | text | high, medium, low |
| `created_at` | timestamptz | Record creation time |

---

## Migration History

| Date | Change |
|------|--------|
| 2024-09 | Initial build with Google Sheets backend |
| 2024-11 | Added Supabase, Chrome extension, Netlify functions |
| 2025-01 | Added moderation pipeline, liberation validation |
| 2025-06 | Migrated from Netlify to Coolify (Docker) |
| 2026-02 | Consolidated scraping into single API route, added weekly scheduling |

### Legacy Components (still in repo, not deployed)

- `scraper/` — Standalone scraper service with cron server (replaced by `api/scrape-events.ts`)
- `netlify/functions/` — Netlify serverless functions (don't run on Coolify)
- `src/extension/google-sheets.js` — Google Sheets integration (events now go to Supabase)

---

## Known Limitations

1. **Time Out London** — JSON-LD scraping may return limited results; Time Out's event pages are heavily JavaScript-rendered. A non-Puppeteer approach has inherent limitations.
2. **Eventbrite JSON-LD search** — Depends on Eventbrite rendering JSON-LD in their search results HTML. May break if they change their frontend.
3. **Outsavvy API** — Requires a Partner API key. Without it, Outsavvy events won't be scraped.
4. **No retry/backoff** — If a scraping run fails, it waits until the next weekly schedule. Manual re-trigger available via API.
5. **Chrome extension icons** — Generated from community-platform events extension assets. May need branding update.
