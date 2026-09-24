#!/usr/bin/env node
/**
 * Build-time prerender for a Vite SPA.
 *
 * After `vite build`, serves dist/ on a local port, opens every route listed in
 * prerender.routes.json in headless Chromium, waits for the app to mount and its
 * network to go quiet, and writes the rendered document to dist/<route>/index.html
 * with the route's own <title>, <meta name="description"> and <link rel="canonical">.
 *
 * The untouched shell is kept as dist/shell.html for the server's SPA fallback, so
 * deep links that are not prerendered still get the bare shell, never another
 * route's content.
 *
 * Fails loud: a route that renders fewer than MIN_TEXT characters of body text
 * (i.e. the app never mounted) aborts the build rather than shipping a shell that
 * looks prerendered.
 *
 * Runs in the Docker builder stage: needs PUPPETEER_EXECUTABLE_PATH (alpine:
 * /usr/bin/chromium-browser) and the puppeteer-core devDependency.
 * Canonical copy: ~/blkout/projects/ai-visibility/tools/prerender.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const DIST = resolve(process.argv[2] || 'dist');
const CONFIG = JSON.parse(readFileSync(resolve(process.argv[3] || 'prerender.routes.json'), 'utf8'));
const MIN_TEXT = 200;
const SETTLE_MS = Number(process.env.PRERENDER_SETTLE_MS || 2500);
const IDLE_MS = Number(process.env.PRERENDER_IDLE_MS || 1000);      // quiet-network window after mount
const IDLE_TIMEOUT_MS = Number(process.env.PRERENDER_IDLE_TIMEOUT_MS || 8000);
const NAV_TIMEOUT_MS = Number(process.env.PRERENDER_NAV_TIMEOUT_MS || 45000);
const EXECUTABLE = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' };

// Minimal static server with SPA fallback. Same-origin /api calls 404 — pages must
// tolerate that (they do: those calls are analytics, health or authenticated writes).
function serveDist() {
  const shell = readFileSync(join(DIST, 'shell.html'));
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let p = decodeURIComponent(url.pathname);
    let file = join(DIST, p);
    if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      return res.end(readFileSync(file));
    }
    if (p.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end('{}'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(shell);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

function setHead(html, { title, description, canonical, prerenderedAt, jsonld }) {
  let out = html;
  // <title>
  if (/<title>[\s\S]*?<\/title>/i.test(out)) out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  else out = out.replace(/<head[^>]*>/i, (m) => `${m}\n<title>${esc(title)}</title>`);
  // description
  const descTag = `<meta name="description" content="${esc(description)}">`;
  if (/<meta\s+name="description"[^>]*>/i.test(out)) out = out.replace(/<meta\s+name="description"[^>]*>/i, descTag);
  else out = out.replace(/<\/title>/i, (m) => `${m}\n${descTag}`);
  // canonical (replace any existing)
  out = out.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  out = out.replace(/<\/title>/i, (m) => `${m}\n<link rel="canonical" href="${esc(canonical)}">`);
  // og:title / og:description / og:url follow the page
  out = out.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${esc(title)}" />`);
  out = out.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${esc(description)}" />`);
  out = out.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${esc(canonical)}" />`);
  // identity stamp so verification can assert "this is the prerendered file", not just a 200
  out = out.replace(/<\/title>/i, (m) => `${m}\n<meta name="prerendered" content="${prerenderedAt}">`);
  // structured data: a route's `jsonld` (object or array) becomes one JSON-LD block; any stale block
  // captured from the page with the same @type set is left alone (pages rarely carry their own).
  if (jsonld) {
    const json = JSON.stringify(jsonld).replace(/</g, '\\u003c');
    out = out.replace(/<\/head>/i, (m) => `<script type="application/ld+json">${json}</script>\n${m}`);
  }
  return out;
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) throw new Error(`no ${DIST}/index.html — run vite build first`);
  // Keep the bare shell for the SPA fallback. Idempotent: never overwrite an existing shell with a prerendered index.
  if (!existsSync(join(DIST, 'shell.html'))) copyFileSync(join(DIST, 'index.html'), join(DIST, 'shell.html'));

  const server = await serveDist();
  const port = server.address().port;
  const origin = CONFIG.origin.replace(/\/$/, '');
  const prerenderedAt = new Date().toISOString();
  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE,
    headless: true,
    // Software WebGL (SwiftShader) so pages with three.js / canvas scenes still mount without a GPU.
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });

  const failures = [];
  try {
    // Warm-up: the first navigation pays for bundle, fonts and the first data round-trip.
    // Throw it away so the first real route is not captured cold.
    {
      const warm = await browser.newPage();
      await warm.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0', timeout: NAV_TIMEOUT_MS }).catch(() => {});
      await new Promise((r) => setTimeout(r, SETTLE_MS));
      await warm.close();
    }
    for (const route of CONFIG.routes) {
      const path = route.path.startsWith('/') ? route.path : `/${route.path}`;
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) BLKOUT-prerender/1.0 Chrome/120');
      let navErr = '';
      const pageLog = [];
      page.on('pageerror', (e) => pageLog.push(`pageerror: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') pageLog.push(`console.${m.type()}: ${m.text()}`); });
      page.on('requestfailed', (r) => pageLog.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`));
      try {
        await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'networkidle0', timeout: NAV_TIMEOUT_MS });
      } catch (e) { navErr = e.message; }
      // Wait for the app to mount: #root has children and the body carries real text.
      try {
        await page.waitForFunction(
          (min) => { const r = document.getElementById('root'); return !!r && r.children.length > 0 && (document.body.innerText || '').trim().length >= min; },
          { timeout: 15000 }, MIN_TEXT,
        );
      } catch { /* measured below */ }
      // Data effects start after mount, so wait for the network to go quiet again, then settle.
      await page.waitForNetworkIdle({ idleTime: IDLE_MS, timeout: IDLE_TIMEOUT_MS }).catch(() => {});
      await new Promise((r) => setTimeout(r, SETTLE_MS));
      // Overlay chrome that must not lead the crawlable text (install prompts, toasts): CONFIG.strip selectors.
      if (Array.isArray(CONFIG.strip) && CONFIG.strip.length) {
        await page.evaluate((sels) => sels.forEach((sel) => document.querySelectorAll(sel).forEach((el) => el.remove())), CONFIG.strip);
      }
      // Media fallback text ("Your browser does not support the video tag") is for browsers without
      // <video>/<audio>; it must not lead the crawlable text. Drop the text nodes, keep the elements.
      await page.evaluate(() => {
        document.querySelectorAll('video, audio').forEach((el) => {
          [...el.childNodes].forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
        });
      });
      const text = await page.evaluate(() => (document.body.innerText || '').trim());
      let html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
      await page.close();

      if (text.length < MIN_TEXT) {
        failures.push(`${path}: rendered ${text.length} chars of text (min ${MIN_TEXT})${navErr ? ` — nav: ${navErr}` : ''}`);
        console.error(`FAIL ${path}: ${text.length} chars`);
        for (const line of pageLog.slice(0, 12)) console.error(`     ${line.slice(0, 300)}`);
        continue;
      }
      html = setHead(html, {
        title: route.title,
        description: route.description,
        canonical: `${origin}${route.canonical || path}`,
        prerenderedAt,
        jsonld: route.jsonld,
      });
      const outDir = path === '/' ? DIST : join(DIST, path.replace(/^\//, ''));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'index.html'), html);
      console.log(`ok   ${path}  ${text.length} chars${navErr ? '  (nav timed out, captured what rendered)' : ''}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (failures.length) {
    console.error(`\nPRERENDER FAILED for ${failures.length} route(s):\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`\nprerendered ${CONFIG.routes.length} routes into ${DIST}; shell kept at dist/shell.html`);
}

main().catch((e) => { console.error('PRERENDER FAILED:', e); process.exit(1); });
