import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Canonical host (14 Sep 2026): events.blkoutuk.cloud answers this app too. Page requests on
// the alias 301 to the canonical host; /api stays reachable on every host because other apps
// call it there. GET/HEAD only — a 301 would turn a POST into a GET.
const CANONICAL_HOST = 'events.blkoutuk.com';
const HOST_ALIASES = new Set(['events.blkoutuk.cloud']);
app.use((req, res, next) => {
  const host = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
  if (HOST_ALIASES.has(host) && (req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api/')) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  next();
});

// Serve extension downloads from public/extensions
app.use('/extensions', express.static(path.join(__dirname, 'public', 'extensions'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.zip')) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

// Event schema (14 Sep 2026): the root and /gatherings are prerendered at build time, but the
// listings change daily, so the Event JSON-LD is added at request time from gatherings_live and
// cached for ten minutes. Any failure serves the prerendered file untouched and logs why.
import { createClient } from '@supabase/supabase-js';
const eventsDb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');
let eventLdCache: { at: number; json: string } | null = null;
async function eventJsonLd(): Promise<string> {
  if (eventLdCache && Date.now() - eventLdCache.at < 10 * 60 * 1000) return eventLdCache.json;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await eventsDb.from('gatherings_live')
    .select('id, title, slug, description, date, start_time, end_time, end_date, location, virtual_link, organizer, cost, url, image_url')
    .gte('date', today).order('date', { ascending: true }).limit(60);
  if (error) throw error;
  // Health-check and smoke-test rows must never reach a search engine (a live one is titled
  // "API health check", organizer/location "test", url example.com — 14 Sep 2026).
  const isTestRow = (e: { title?: string | null; location?: string | null; organizer?: string | null; url?: string | null }) =>
    /^test$/i.test(String(e.location || '').trim()) || /^test$/i.test(String(e.organizer || '').trim()) || /(^|\.)example\.com/i.test(String(e.url || '')) || /health check/i.test(String(e.title || ''));
  const rows = (data || []).filter((e) => e.title && e.date);
  const skipped = rows.filter(isTestRow).length;
  if (skipped) console.warn(`event schema: skipped ${skipped} test row(s)`);
  const items = rows.filter((e) => !isTestRow(e)).map((e, i) => {
    const start = `${e.date}${e.start_time ? `T${String(e.start_time).slice(0, 8)}` : ''}`;
    const end = e.end_date || e.end_time ? `${e.end_date || e.date}${e.end_time ? `T${String(e.end_time).slice(0, 8)}` : ''}` : undefined;
    const isVirtual = !!e.virtual_link && !e.location;
    const ev: Record<string, unknown> = {
      '@type': 'Event', name: e.title, startDate: start, ...(end ? { endDate: end } : {}),
      ...(e.description ? { description: String(e.description).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) } : {}),
      eventAttendanceMode: isVirtual ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: isVirtual ? { '@type': 'VirtualLocation', url: e.virtual_link } : { '@type': 'Place', name: e.location || 'To be announced', address: e.location || undefined },
      ...(e.organizer ? { organizer: { '@type': 'Organization', name: e.organizer } } : {}),
      url: `https://${CANONICAL_HOST}${eventPagePath({ id: e.id, title: e.title })}`, ...(e.image_url ? { image: e.image_url } : {}),
      ...(e.cost ? (/free/i.test(String(e.cost)) ? { isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', ...(e.url ? { url: e.url } : {}) } } : { offers: { '@type': 'Offer', description: String(e.cost), priceCurrency: 'GBP', ...(e.url ? { url: e.url } : {}) } }) : {}),
    };
    return { '@type': 'ListItem', position: i + 1, item: ev };
  });
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Gatherings for Black queer people in the UK', numberOfItems: items.length, itemListElement: items }).replace(/</g, '\\u003c');
  eventLdCache = { at: Date.now(), json };
  return json;
}
app.get(['/', '/gatherings'], async (req, res, next) => {
  try {
    const file = path.join(__dirname, 'dist', req.path === '/' ? 'index.html' : 'gatherings/index.html');
    if (!fs.existsSync(file)) return next();
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('name="prerendered"')) return next(); // not a prerendered build: leave the shell alone
    const json = await eventJsonLd();
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(html.replace('</head>', `<script type="application/ld+json">${json}</script>\n</head>`));
  } catch (error) {
    console.error('EVENT SCHEMA INJECTION FAILED — serving prerendered file untouched:', error);
    next();
  }
});

// Event pages (events redesign spec 02, Part A, 25 Oct 2026): /e/<id>/<slug> is the SPA's
// EventPage, served here with the event's own title, link preview and Event schema so a shared
// link and a search engine see the event, not the site's front door. Only gatherings_live rows
// get a page; anything else is a real 404. The slug is cosmetic: a stale one 301s to the current.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_COLUMNS = 'id, title, description, date, start_time, end_time, end_date, location, virtual_link, organizer, cost, url, image_url';
type LiveEvent = { id: string; title: string; description: string | null; date: string; start_time: string | null; end_time: string | null; end_date: string | null; location: string; virtual_link: string | null; organizer: string; cost: string | null; url: string; image_url: string | null };

// Same rule as src/lib/eventLink.ts — keep the two in step.
function eventSlug(title: string): string {
  return title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
}
function eventPagePath(e: { id: string; title: string }): string {
  const slug = eventSlug(e.title);
  return slug ? `/e/${e.id}/${slug}` : `/e/${e.id}`;
}
async function liveEvent(id: string): Promise<LiveEvent | null> {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await eventsDb.from('gatherings_live').select(EVENT_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as LiveEvent) || null;
}
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plainText = (s: string | null) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function eventPageHtml(shell: string, e: LiveEvent): string {
  const url = `https://${CANONICAL_HOST}${eventPagePath(e)}`;
  const day = new Date(`${e.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const summary = plainText(e.description).slice(0, 200) || `${e.organizer} · ${e.location}`;
  const description = `${day} · ${e.location}. ${summary}`.slice(0, 280);
  const title = `${e.title} · BLKOUT Events`;
  const image = e.image_url || `https://${CANONICAL_HOST}/pwa-512x512.png`;
  const start = `${e.date}${e.start_time ? `T${e.start_time.slice(0, 8)}` : ''}`;
  const end = e.end_date || e.end_time ? `${e.end_date || e.date}${e.end_time ? `T${e.end_time.slice(0, 8)}` : ''}` : undefined;
  const isVirtual = !!e.virtual_link || /^(zoom|online|virtual)\b/i.test(e.location.trim());
  const ld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Event', name: e.title, url, startDate: start, ...(end ? { endDate: end } : {}),
    ...(e.description ? { description: plainText(e.description).slice(0, 500) } : {}),
    eventAttendanceMode: isVirtual ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: isVirtual ? { '@type': 'VirtualLocation', url: e.virtual_link } : { '@type': 'Place', name: e.location, address: e.location },
    organizer: { '@type': 'Organization', name: e.organizer },
    ...(e.image_url ? { image: e.image_url } : {}),
    ...(e.cost && /free/i.test(e.cost) ? { isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', url: e.url } } : {}),
  }).replace(/</g, '\\u003c');
  const meta = (attr: string, key: string, value: string) => `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`;
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(title)}</title>`)
    .replace(/<meta\s+(name|property)="(description|og:[a-z:_]+|twitter:[a-z:_]+)"[^>]*>\s*/g, '');
  const head = [
    meta('name', 'description', description),
    `<link rel="canonical" href="${url}" />`,
    meta('property', 'og:type', 'website'), meta('property', 'og:url', url), meta('property', 'og:title', e.title),
    meta('property', 'og:description', description), meta('property', 'og:image', image),
    meta('name', 'twitter:card', 'summary_large_image'), meta('name', 'twitter:title', e.title),
    meta('name', 'twitter:description', description), meta('name', 'twitter:image', image),
    `<script type="application/ld+json">${ld}</script>`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${head}\n  </head>`);
  return html;
}
function shellHtml(): string | null {
  const dist = path.join(__dirname, 'dist');
  const shell = path.join(dist, fs.existsSync(path.join(dist, 'shell.html')) ? 'shell.html' : 'index.html');
  return fs.existsSync(shell) ? fs.readFileSync(shell, 'utf8') : null;
}

// Calendar file. Times are UK local (TZID Europe/London); an event with no start time is all-day.
const LONDON_VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/London',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0000', 'TZOFFSETTO:+0100', 'TZNAME:BST', 'DTSTART:19700329T010000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0000', 'TZNAME:GMT', 'DTSTART:19701025T020000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];
function eventIcs(e: LiveEvent): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const d = (date: string) => date.replace(/-/g, '');
  const t = (time: string) => time.slice(0, 8).replace(/:/g, '').padEnd(6, '0');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BLKOUT UK//BLKOUT Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  if (e.start_time) lines.push(...LONDON_VTIMEZONE);
  lines.push('BEGIN:VEVENT', `UID:${e.id}@events.blkoutuk.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
  if (e.start_time) {
    lines.push(`DTSTART;TZID=Europe/London:${d(e.date)}T${t(e.start_time)}`);
    if (e.end_time) lines.push(`DTEND;TZID=Europe/London:${d(e.end_date || e.date)}T${t(e.end_time)}`);
    else lines.push('DURATION:PT2H');
  } else {
    const last = new Date(`${e.end_date || e.date}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${d(e.date)}`, `DTEND;VALUE=DATE:${d(last.toISOString().slice(0, 10))}`);
  }
  const pageUrl = `https://${CANONICAL_HOST}${eventPagePath(e)}`;
  lines.push(`SUMMARY:${esc(e.title)}`, `LOCATION:${esc(e.location)}`, `DESCRIPTION:${esc(`${e.organizer}\n${pageUrl}`)}`, `URL:${pageUrl}`, 'END:VEVENT', 'END:VCALENDAR');
  // RFC 5545: fold lines over 75 octets
  return lines.map((l) => {
    const out: string[] = [];
    let rest = l;
    while (Buffer.byteLength(rest) > 75) {
      let cut = 75;
      while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
      out.push(rest.slice(0, cut));
      rest = ' ' + rest.slice(cut);
    }
    out.push(rest);
    return out.join('\r\n');
  }).join('\r\n') + '\r\n';
}

app.get('/e/:id/calendar.ics', async (req, res) => {
  try {
    const e = await liveEvent(req.params.id);
    if (!e) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${eventSlug(e.title) || 'event'}.ics"`);
    res.send(eventIcs(e));
  } catch (error) {
    console.error('EVENT ICS FAILED:', error);
    res.status(500).send('Calendar file unavailable');
  }
});

// Map position for an event page. Takes an event id, never free text, so it can't be used as an
// open geocoding proxy. UK postcode → postcodes.io; otherwise OpenStreetMap Nominatim (one
// request per event per day, identified per its usage policy). No position → the page shows
// Directions only.
const geoCache = new Map<string, { at: number; point: { lat: number; lon: number } | null }>();
async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  const postcode = location.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  if (postcode) {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode[1].replace(/\s+/g, ''))}`);
    if (r.ok) {
      const j = await r.json() as { result?: { latitude?: number; longitude?: number } };
      if (typeof j.result?.latitude === 'number' && typeof j.result?.longitude === 'number') return { lat: j.result.latitude, lon: j.result.longitude };
    }
  }
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`, {
    headers: { 'User-Agent': 'BLKOUT Events (https://events.blkoutuk.com; hello@blkoutuk.com)' },
  });
  if (!r.ok) return null;
  const hits = await r.json() as { lat: string; lon: string }[];
  return hits[0] ? { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon) } : null;
}
app.get('/api/event-location/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cached = geoCache.get(id);
    if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) {
      return cached.point ? res.json(cached.point) : res.status(404).json({ error: 'no position' });
    }
    const e = await liveEvent(id);
    if (!e) return res.status(404).json({ error: 'not found' });
    if (e.virtual_link || /^(zoom|online|virtual)\b/i.test(e.location.trim())) return res.status(404).json({ error: 'online event' });
    const point = await geocode(e.location);
    geoCache.set(id, { at: Date.now(), point });
    return point ? res.json(point) : res.status(404).json({ error: 'no position' });
  } catch (error) {
    console.error('EVENT LOCATION FAILED:', error);
    res.status(502).json({ error: 'lookup failed' });
  }
});

app.get(['/e/:id', '/e/:id/:slug'], async (req, res, next) => {
  try {
    const shell = shellHtml();
    if (!shell) return next();
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    const e = await liveEvent(req.params.id);
    if (!e) return res.status(404).send(shell);
    const canonical = eventPagePath(e);
    if (req.path.replace(/\/+$/, '') !== canonical) return res.redirect(301, canonical);
    res.send(eventPageHtml(shell, e));
  } catch (error) {
    console.error('EVENT PAGE META FAILED — serving the bare shell:', error);
    next();
  }
});

// Moderation lives on the Comms dashboard (Rob, 24 Oct 2026); the old /moderation page is retired.
app.get(['/moderation', '/moderation/'], (_req, res) => res.redirect(302, 'https://comms.blkoutuk.com/admin/events'));

// Serve static files from the 'dist' directory
// Hashed assets (JS/CSS) get long-term caching; HTML always revalidates
app.use(express.static(path.join(__dirname, 'dist'), {
  redirect: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML must never be cached — prevents stale JS bundle references after deploys
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes('/assets/')) {
      // Vite-hashed assets are immutable — cache aggressively
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Dynamically import and register API routes, then start server
const apiDir = path.join(__dirname, 'api');

async function startServer() {
  // Load all API routes first
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    // Support both .js and .ts files (tsx runs .ts directly)
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const routeName = file.slice(0, -3);
      try {
        const module = await import(path.join(apiDir, file));
        if (module.default) {
          app.all(`/api/${routeName}`, module.default);
          console.log(`✅ Registered route: /api/${routeName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load route /api/${routeName}:`, error);
      }
    }
  }
  console.log(`🚀 All API routes registered`);

  // SPA fallback: serve index.html for any request that doesn't match an API route or a static file
  // Prerendered routes (scripts/prerender.mjs) live at dist/<route>/index.html and the bare
  // shell at dist/shell.html. An extensionless GET gets its prerendered page if one exists,
  // otherwise the shell — never another route's prerendered content.
  const DIST = path.join(__dirname, 'dist');
  // Paths the SPA renders — keep in step with the <Route path> list in src/. Anything else still
  // gets the shell, but with a real 404 so search engines don't index made-up addresses
  // (SEO plan K2, 11 Oct 2026). Borough doors are files in dist and are served above.
  const SPA_ROUTES = new Set(['', 'add', 'gatherings', 'moderation', 'openings', 'openings/submit', 'places', 'quick-add', 'submit']);
  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const clean = path.normalize(req.path).replace(/\/+$/, '');
    const prerendered = path.join(DIST, clean, 'index.html');
    if (clean && prerendered.startsWith(DIST + path.sep) && !path.extname(clean) && fs.existsSync(prerendered)) {
      return res.sendFile(prerendered);
    }
    const route = clean.replace(/^\/+/, '');
    const known = SPA_ROUTES.has(route);
    if (!known && path.extname(clean)) return res.status(404).send('Not found');
    res.status(known ? 200 : 404).sendFile(path.join(DIST, fs.existsSync(path.join(DIST, 'shell.html')) ? 'shell.html' : 'index.html'));
  });

  // Start server AFTER all routes are registered
  app.listen(port, () => {
    console.log(`🏴‍☠️ Events Calendar server running on port ${port}`);
    console.log(`📅 API endpoints ready at /api/*`);
  });
}

// Weekly event scraping scheduler
// Runs every Sunday at 06:00 UTC (matches legacy scraper/server.js schedule)
function startScrapeScheduler() {
  const ONE_HOUR = 60 * 60 * 1000;

  function msUntilNextSunday6am(): number {
    const now = new Date();
    const next = new Date(now);
    // Set to next Sunday
    next.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7));
    next.setUTCHours(6, 0, 0, 0);
    // If we're already past Sunday 6am this week, wait for next Sunday
    if (next.getTime() <= now.getTime()) {
      next.setUTCDate(next.getUTCDate() + 7);
    }
    return next.getTime() - now.getTime();
  }

  async function triggerScrape() {
    try {
      console.log('⏰ Scheduled scrape starting...');
      const { runScraper } = await import('./api/scrape-events.js');
      const results = await runScraper();
      console.log(`⏰ Scheduled scrape complete: ${results.totalEvents} events, ${results.submittedToSupabase} submitted`);
    } catch (error) {
      console.error('⏰ Scheduled scrape failed:', error);
    }
  }

  // Schedule first run, then repeat weekly
  const msToNext = msUntilNextSunday6am();
  const nextRun = new Date(Date.now() + msToNext);
  console.log(`⏰ Event scraper scheduled: next run ${nextRun.toUTCString()}`);

  setTimeout(() => {
    triggerScrape();
    // Then every 7 days
    setInterval(triggerScrape, 7 * 24 * ONE_HOUR);
  }, msToNext);
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Start the scraper scheduler after server is up
startScrapeScheduler();
