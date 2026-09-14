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
    .select('title, slug, description, date, start_time, end_time, end_date, location, virtual_link, organizer, cost, url, image_url')
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
      ...(e.url ? { url: e.url } : {}), ...(e.image_url ? { image: e.image_url } : {}),
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
  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const clean = path.normalize(req.path).replace(/\/+$/, '');
    const prerendered = path.join(DIST, clean, 'index.html');
    if (clean && prerendered.startsWith(DIST + path.sep) && !path.extname(clean) && fs.existsSync(prerendered)) {
      return res.sendFile(prerendered);
    }
    res.sendFile(path.join(DIST, fs.existsSync(path.join(DIST, 'shell.html')) ? 'shell.html' : 'index.html'));
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
