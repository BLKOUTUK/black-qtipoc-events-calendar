// Event image finder (Rob, 25 Oct 2026). Not a route: no default export, so server.ts's api/
// loader imports it without registering anything. It lives in api/ because the runner stage of
// the Dockerfile copies only server.ts and api/.
//
// For approved, upcoming events with no image, it reads the picture the organiser's own page
// shares for link previews (og:image, twitter:image, JSON-LD image), checks it is a real event
// picture, keeps a copy in the public event-images bucket and records it in
// event_image_candidates as 'pending'. Nothing reaches a public page until someone approves it
// in Comms /admin/events (api/image-candidates.ts).
import crypto from 'crypto';
import { imageSize } from 'image-size';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = 'event-images';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

// Pages whose preview image is never the event: login walls, forms, video thumbnails.
const SKIP_HOSTS = /(^|\.)(forms\.gle|docs\.google\.com|youtube\.com|youtu\.be|instagram\.com|facebook\.com|fb\.me|linktr\.ee|tiktok\.com|x\.com|twitter\.com)$/i;
const NOT_AN_EVENT_IMAGE = /(logo|favicon|placeholder|default|avatar|icon|sprite|blank|share-image|og-default)/i;

export type ScanOutcome = { eventId: string; title: string; result: string };

function rest(pathAndQuery: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

async function fetchLimited(url: string, maxBytes: number, accept: string): Promise<{ body: Buffer; type: string; finalUrl: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, redirect: 'follow', signal: controller.signal });
    if (!r.ok || !r.body) return null;
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of r.body as unknown as AsyncIterable<Uint8Array>) {
      size += chunk.length;
      if (size > maxBytes) return null;
      chunks.push(Buffer.from(chunk));
    }
    return { body: Buffer.concat(chunks), type: (r.headers.get('content-type') || '').toLowerCase(), finalUrl: r.url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Preview images a page declares, best first. */
export function previewImages(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  const meta = /<meta\s+[^>]*>/gi;
  for (const tag of html.match(meta) || []) {
    const key = (tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1]?.toLowerCase();
    const content = (tag.match(/content\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (content && key && ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'].includes(key)) found.push(content);
  }
  for (const block of html.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || []) {
    for (const m of block.matchAll(/"image"\s*:\s*(?:\[\s*)?(?:\{[^}]*?"url"\s*:\s*)?"([^"]+)"/g)) found.push(m[1]);
  }
  const resolved = found
    .map((u) => u.replace(/&amp;/g, '&').trim())
    .map((u) => { try { return new URL(u, pageUrl).toString(); } catch { return ''; } })
    .filter((u) => u.startsWith('https://') || u.startsWith('http://'));
  return [...new Set(resolved)];
}

function isHomepage(url: URL): boolean {
  return url.pathname.replace(/\/+$/, '') === '' && !url.search;
}

type Picked = { page: URL; original: string; body: Buffer; type: string; width: number; height: number };

/** Find and check the picture on an event's own page. A string is the reason there isn't one. */
export async function pickImage(eventUrl: string, seenElsewhere: Set<string>): Promise<Picked | string> {
  let page: URL;
  try { page = new URL(eventUrl); } catch { return 'skipped: listing link is not a URL'; }
  if (isHomepage(page)) return 'skipped: listing links to a homepage, not the event';
  if (SKIP_HOSTS.test(page.hostname)) return `skipped: ${page.hostname} pages don't carry an event image`;

  const html = await fetchLimited(page.toString(), 3_000_000, 'text/html,application/xhtml+xml');
  if (!html || !html.type.includes('html')) return 'no image: the organiser page did not load';
  const candidates = previewImages(html.body.toString('utf8'), html.finalUrl);
  if (!candidates.length) return 'no image: the page declares no preview picture';

  for (const original of candidates) {
    if (NOT_AN_EVENT_IMAGE.test(new URL(original).pathname)) continue;
    if (seenElsewhere.has(original)) continue; // the same picture on another event's page is the site's default
    const img = await fetchLimited(original, 8_000_000, 'image/*');
    if (!img || !/^image\/(jpeg|jpg|png|webp|gif)/.test(img.type)) continue;
    let dims: { width?: number; height?: number };
    try { dims = imageSize(new Uint8Array(img.body)); } catch { continue; }
    const { width = 0, height = 0 } = dims;
    if (width < 600 || height < 300) continue;
    const ratio = width / height;
    if (ratio < 0.5 || ratio > 2.5) continue;
    return { page, original, body: img.body, type: img.type, width, height };
  }
  return 'no image: nothing on the page passed the checks (size, shape, not a logo or site default)';
}

async function findFor(event: { id: string; title: string; url: string }, seenElsewhere: Set<string>): Promise<string> {
  const picked = await pickImage(event.url, seenElsewhere);
  if (typeof picked === 'string') return picked;
  const { page, original, width, height } = picked;
  const img = { body: picked.body, type: picked.type };
  const ext = img.type.includes('png') ? 'png' : img.type.includes('webp') ? 'webp' : img.type.includes('gif') ? 'gif' : 'jpg';
  const objectPath = `${event.id}/${crypto.createHash('sha1').update(original).digest('hex').slice(0, 16)}.${ext}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': img.type.split(';')[0], 'x-upsert': 'true' },
    body: new Uint8Array(img.body),
  });
  if (!up.ok) return `FAILED: storage upload ${up.status} ${await up.text()}`;
  const stored = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  const ins = await rest('event_image_candidates?on_conflict=event_id,original_url', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({ event_id: event.id, source_page: page.toString(), original_url: original, stored_url: stored, width, height }),
  });
  if (!ins.ok) return `FAILED: candidate insert ${ins.status} ${await ins.text()}`;
  return `found: ${width}×${height} from ${page.hostname}`;
}

/** One pass over approved, upcoming events that have no image and nothing waiting for a decision. */
export async function scanForEventImages(limit = 25): Promise<ScanOutcome[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('image finder: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
  const today = new Date().toISOString().slice(0, 10);
  const evRes = await rest(`events?select=id,title,url&status=in.(approved,published)&date=gte.${today}&or=(image_url.is.null,image_url.eq.)&url=not.is.null&order=date.asc&limit=200`);
  if (!evRes.ok) throw new Error(`image finder: events read ${evRes.status} ${await evRes.text()}`);
  const events = (await evRes.json()) as { id: string; title: string; url: string }[];

  // Events with a pending or approved candidate wait for that decision; a rejection lets the
  // event be looked at again (the unique key stops the same picture being offered twice).
  const candRes = await rest('event_image_candidates?select=event_id,original_url,status');
  if (!candRes.ok) throw new Error(`image finder: candidates read ${candRes.status} ${await candRes.text()}`);
  const cands = (await candRes.json()) as { event_id: string; original_url: string; status: string }[];
  const waiting = new Set(cands.filter((c) => c.status !== 'rejected').map((c) => c.event_id));
  const rejectedFor = new Map<string, Set<string>>();
  for (const c of cands.filter((x) => x.status === 'rejected')) {
    if (!rejectedFor.has(c.event_id)) rejectedFor.set(c.event_id, new Set());
    rejectedFor.get(c.event_id)!.add(c.original_url);
  }
  const usedByAnother = (eventId: string) => new Set(cands.filter((c) => c.event_id !== eventId).map((c) => c.original_url));

  const outcomes: ScanOutcome[] = [];
  for (const e of events.filter((x) => x.url && !waiting.has(x.id)).slice(0, limit)) {
    const seen = new Set([...usedByAnother(e.id), ...(rejectedFor.get(e.id) || [])]);
    let result: string;
    try { result = await findFor(e, seen); } catch (err) { result = `FAILED: ${(err as Error).message}`; }
    outcomes.push({ eventId: e.id, title: e.title, result });
  }
  return outcomes;
}
