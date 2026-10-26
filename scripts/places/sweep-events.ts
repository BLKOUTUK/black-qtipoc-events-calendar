/**
 * Places → events sweep (Rob, 26 Oct 2026: "bring their events in — find what they're running
 * and list it, then show them").
 *
 * For each published Place with a website: read the site's own page, its events-looking pages
 * and any ticketing pages it links to (Eventbrite, OutSavvy, Skiddle, RA, DICE, Tickettailor),
 * and keep the upcoming events those pages declare in Event schema (JSON-LD). Nothing is
 * guessed from page text: no schema, no event.
 *
 *   npx tsx scripts/places/sweep-events.ts            report only → scripts/places/sweep-<date>.json
 *   npx tsx scripts/places/sweep-events.ts --write    also queue new events as 'pending' for
 *                                                     moderation in Comms (anon insert, as the scraper does)
 */
import { writeFileSync, readFileSync } from 'fs';
import { publishedPlaces } from '../../src/data/places';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const WRITE = process.argv.includes('--write');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const TODAY = new Date().toISOString().slice(0, 10);
const HORIZON = new Date(Date.now() + 366 * 86400000).toISOString().slice(0, 10);

const TICKET_LINK = /https?:\/\/(www\.)?(eventbrite\.(co\.uk|com)\/(o|e)\/|outsavvy\.com\/(organiser|event)\/|skiddle\.com\/(whats-on|e|promoters)\/|ra\.co\/(promoters|events|clubs)\/|dice\.fm\/(venue|event|partner)\/|(www\.)?tickettailor\.com\/events\/)[^"'\s<>#]+/gi;
const EVENTS_PATH = /\/(events?|whats-?on|calendar|programme|diary|gigs?|tickets?)(\/|$)/i;

type Found = { place: string; placeId: string; declaredOrganizer: string; title: string; date: string; start_time: string | null; end_date: string | null; end_time: string | null; location: string; organizer: string; url: string; description: string; cost: string; seenOn: string };

async function get(url: string): Promise<string | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: c.signal });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return null;
    return (await r.text()).slice(0, 4_000_000);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function jsonLdEvents(html: string): any[] {
  const out: any[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    const type = n['@type'];
    if ((typeof type === 'string' && /Event$/.test(type)) || (Array.isArray(type) && type.some((x: string) => /Event$/.test(x)))) out.push(n);
    if (n['@graph']) walk(n['@graph']);
    if (n.itemListElement) walk(n.itemListElement);
    if (n.item) walk(n.item);
    if (n.subEvent) walk(n.subEvent);
  };
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1].trim())); } catch { /* not JSON */ }
  }
  return out;
}

const clean = (s: unknown) => String(s ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

// Notices, not events.
const NOT_AN_EVENT = /\b(closed|closure|cancelled|canceled|postponed)\b/i;

/** A single-event page (an Eventbrite /e/, an /event/<slug>) also lists "related" events; only its own counts. */
const SINGLE_EVENT_PAGE = /\/(e|event)\/[^/]+/i;
const sameUrl = (a: string, b: string) => {
  const n = (u: string) => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/+$/, '').toLowerCase(); } catch { return u; } };
  return n(a) === n(b);
};

/** The words that make a place's name its own: "QTIPOC Writers Group" → "qtipoc writers group". */
const coreName = (name: string) => name.replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
// Checks the event's own words only, never the organiser name the sweep fills in for it.
const mentions = (f: { title: string; declaredOrganizer: string }, name: string) => {
  const core = coreName(name);
  return core.length >= 4 && coreName(`${f.title} ${f.declaredOrganizer}`).includes(core);
};

function place(loc: any): string {
  if (!loc) return '';
  if (Array.isArray(loc)) return place(loc[0]);
  if (typeof loc === 'string') return clean(loc);
  if (loc['@type'] === 'VirtualLocation') return 'Online';
  const a = loc.address;
  const addr = typeof a === 'string' ? a : a ? [a.streetAddress, a.addressLocality, a.postalCode].filter(Boolean).join(', ') : '';
  return clean([loc.name, addr].filter(Boolean).join(', '));
}

function price(offers: any): string {
  const o = Array.isArray(offers) ? offers : offers ? [offers] : [];
  const prices = o.map((x) => Number(x?.price ?? x?.lowPrice)).filter((n) => !Number.isNaN(n));
  if (!prices.length) return '';
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  if (hi === 0) return 'Free';
  return lo === hi ? `£${lo}` : `£${lo}–£${hi}`;
}

function toFound(e: any, p: { id: string; name: string }, seenOn: string): Found | null {
  const title = clean(e.name);
  const start = String(e.startDate || '');
  const date = start.slice(0, 10);
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < TODAY || date > HORIZON) return null;
  const end = String(e.endDate || '');
  const time = (s: string) => (/T\d{2}:\d{2}/.test(s) ? s.slice(11, 16) + ':00' : null);
  const url = typeof e.url === 'string' && /^https?:\/\//.test(e.url) ? e.url : seenOn;
  const org = Array.isArray(e.organizer) ? e.organizer[0] : e.organizer;
  return {
    place: p.name, placeId: p.id, declaredOrganizer: clean(org?.name), title, date, start_time: time(start),
    end_date: end && end.slice(0, 10) !== date ? end.slice(0, 10) : null, end_time: time(end),
    location: place(e.location), organizer: clean(org?.name) || p.name, url,
    description: clean(e.description).slice(0, 1200), cost: price(e.offers), seenOn,
  };
}

async function sweepPlace(p: { id: string; name: string; url?: string }, sharedHost: boolean): Promise<{ found: Found[]; pages: string[]; note: string }> {
  if (!p.url) return { found: [], pages: [], note: 'no website (Instagram only)' };
  const home = await get(p.url);
  if (!home) return { found: [], pages: [p.url], note: 'website did not load' };
  const base = new URL(p.url);
  const links = new Set<string>();
  for (const m of home.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(m[1].replace(/&amp;/g, '&'), base);
      if (u.hostname.replace(/^www\./, '') === base.hostname.replace(/^www\./, '') && EVENTS_PATH.test(u.pathname)) links.add(u.toString());
    } catch { /* bad href */ }
  }
  const sameSite = [...links].slice(0, 3);
  const ticketing = [...new Set((home.match(TICKET_LINK) || []).map((u) => u.replace(/&amp;/g, '&')))].slice(0, 6);
  const pages = [p.url, ...sameSite, ...ticketing];
  const found: Found[] = [];
  for (const [i, page] of pages.entries()) {
    const html = i === 0 ? home : await get(page);
    if (!html) continue;
    // An events page on the site can itself link out to ticket pages.
    if (i > 0 && i <= sameSite.length) {
      for (const t of (html.match(TICKET_LINK) || []).slice(0, 6)) if (!pages.includes(t)) pages.push(t.replace(/&amp;/g, '&'));
    }
    let events = jsonLdEvents(html);
    if (SINGLE_EVENT_PAGE.test(new URL(page).pathname)) {
      const own = events.filter((e) => typeof e.url === 'string' && sameUrl(e.url, page));
      events = own.length ? own : events.slice(0, 1);
    }
    for (const e of events) {
      const f = toFound(e, p, page);
      if (f && !NOT_AN_EVENT.test(f.title)) found.push(f);
    }
    if (pages.length > 16) break;
  }
  // A place whose link is a page on someone else's site (a host organisation, a single ticket
  // page), or whose site another place shares, only gets events that carry its own name.
  const ownSite = !sharedHost && base.pathname.replace(/\/+$/, '') === '';
  const theirs = ownSite ? found : found.filter((f) => mentions(f, p.name));
  const seen = new Set<string>();
  const unique = theirs.filter((f) => {
    const k = `${f.title.toLowerCase()}|${f.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { found: unique, pages, note: unique.length ? '' : 'no upcoming events declared on the pages read' };
}

async function alreadyListed(f: Found): Promise<boolean> {
  const q = `${SUPABASE_URL}/rest/v1/events?or=(url.eq.${encodeURIComponent(f.url)},and(title.ilike.${encodeURIComponent(f.title.replace(/[,()]/g, ' '))},date.eq.${f.date}))&select=id&limit=1`;
  const r = await fetch(q, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  if (!r.ok) throw new Error(`dedupe check failed ${r.status}`);
  return ((await r.json()) as unknown[]).length > 0;
}

const neverList = JSON.parse(readFileSync(new URL('./never-list.json', import.meta.url), 'utf8')).never as { match: string }[];
const banned = (s: string) => neverList.some((n) => s.toLowerCase().includes(n.match.toLowerCase()));

const places = publishedPlaces();
const hostCount = new Map<string, number>();
for (const p of places) {
  if (!p.url) continue;
  const h = new URL(p.url).hostname.replace(/^www\./, '');
  hostCount.set(h, (hostCount.get(h) || 0) + 1);
}
const report: { place: string; url?: string; note: string; events: (Found & { status: string })[] }[] = [];
for (const p of places) {
  const { found, note } = await sweepPlace(p, !!p.url && (hostCount.get(new URL(p.url).hostname.replace(/^www\./, '')) || 0) > 1);
  const events: (Found & { status: string })[] = [];
  for (const f of found) {
    let status = 'new';
    if (banned(`${f.title} ${f.organizer} ${f.location}`)) status = 'skipped: never-list';
    else if (await alreadyListed(f)) status = 'already listed';
    else if (WRITE) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          title: f.title, description: f.description || null, date: f.date, end_date: f.end_date, start_time: f.start_time, end_time: f.end_time,
          location: f.location || null, organizer: f.organizer, cost: f.cost || 'See link', url: f.url,
          source: 'places-sweep', source_platform: new URL(f.seenOn).hostname.replace(/^www\./, ''), discovery_method: 'places-sweep',
          status: 'pending', tags: [],
        }),
      });
      status = r.ok ? 'queued for moderation' : `FAILED: insert ${r.status} ${await r.text()}`;
    }
    events.push({ ...f, status });
  }
  report.push({ place: p.name, url: p.url, note, events });
  console.log(`${p.name.slice(0, 40).padEnd(40)} ${events.length ? events.map((e) => e.status).join(', ') : note}`);
}

const out = new URL(`./sweep-${TODAY}.json`, import.meta.url);
writeFileSync(out, JSON.stringify({ ran: new Date().toISOString(), write: WRITE, places: places.length, report }, null, 2));
const all = report.flatMap((r) => r.events);
console.log(`\n${places.length} places · ${report.filter((r) => r.events.length).length} with upcoming events · ${all.length} events · ${all.filter((e) => e.status === 'new' || e.status.startsWith('queued')).length} new · ${all.filter((e) => e.status === 'already listed').length} already listed`);
console.log(`report: ${out.pathname}`);
