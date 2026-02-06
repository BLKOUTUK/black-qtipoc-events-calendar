import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve extension downloads from public/extensions
app.use('/extensions', express.static(path.join(__dirname, 'public', 'extensions'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.zip')) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

// Serve static files from the 'dist' directory
// Hashed assets (JS/CSS) get long-term caching; HTML always revalidates
app.use(express.static(path.join(__dirname, 'dist'), {
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
  app.use((_req, res) => {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
