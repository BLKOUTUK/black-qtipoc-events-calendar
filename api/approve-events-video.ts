// Rob's sign-off for the weekly AIvor events video, "BLKOUT What's On" (Rob, 26 Oct 2026).
// The Thursday render (comms-blkout remotion-videos/scripts/events-video.mjs) uploads it unlisted
// and sends Rob a link here signed with the Supabase service key. GET shows a confirm button,
// so a link preview or an accidental open never approves; POST records the yes, and the hourly
// publish run from 18:00 makes the video public.
// 31 Oct 2026: also the Sunday BLKOUT News digest (?kind=news, aivor_digests), same flow.
// Rob's main route is now replying "approved" on Telegram; this link is the backup.
import type { Request, Response } from 'express';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function page(res: Response, status: number, heading: string, body: string) {
  res.status(status).type('html').send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>What's On sign-off</title>
<body style="background:#000;color:#f5f1e8;font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1.25rem;line-height:1.5">
<h1 style="color:#FFD700;font-size:1.5rem">${heading}</h1>${body}</body>`);
}

const KINDS: Record<string, { table: string; sig: string; name: string; when: string }> = {
  events: { table: 'aivor_event_digests', sig: 'events-video', name: "What's On", when: 'from 18:00 Thursday (or within the hour, if later)' },
  news: { table: 'aivor_digests', sig: 'news-video', name: 'BLKOUT News', when: 'within the hour' },
};
const kindOf = (req: Request) => KINDS[String(req.query.kind || 'events')] || null;

function verified(req: Request): string | null {
  const K = kindOf(req);
  if (!K) return null;
  const week = String(req.query.week || '');
  const exp = Number(req.query.exp || 0);
  const sig = String(req.query.sig || '');
  if (!/^\d{4}-W\d{2}$/.test(week) || !exp || !/^[0-9a-f]{64}$/.test(sig) || !SERVICE_KEY) return null;
  if (Date.now() / 1000 > exp) return null;
  const expected = crypto.createHmac('sha256', SERVICE_KEY).update(`${K.sig}:${week}:${exp}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? week : null;
}

function rest(pathAndQuery: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
  });
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();
  const week = verified(req);
  const K = kindOf(req);
  if (!week || !K) return page(res, 403, 'This link has expired or is not valid', '<p>Reply "approved" to the Telegram message instead, or ask for a fresh link by re-running this week\'s video.</p>');

  const r = await rest(`${K.table}?week_tag=eq.${week}&select=video_url,approved_at,published_at`);
  const [row] = r.ok ? ((await r.json()) as { video_url: string; approved_at: string | null; published_at: string | null }[]) : [];
  if (!row) return page(res, 404, `No video for ${week}`, '<p>Nothing was uploaded for this week.</p>');
  const watch = `<p><a style="color:#FFD700" href="${row.video_url}">Watch it on YouTube (unlisted)</a></p>`;

  if (row.published_at) return page(res, 200, `${week} is already public`, watch);
  if (req.method === 'GET') {
    if (row.approved_at) return page(res, 200, `${K.name} ${week} is approved`, `${watch}<p>It goes public ${K.when}.</p>`);
    const action = `/api/approve-events-video?${new URLSearchParams(req.query as Record<string, string>).toString()}`;
    return page(res, 200, `Publish ${K.name} ${week}?`, `${watch}<form method="post" action="${action}"><button style="background:#FFD700;color:#000;border:0;padding:.9rem 1.4rem;font-weight:700;font-size:1rem;border-radius:999px">Yes, publish it</button></form><p style="opacity:.7">It goes public ${K.when}.</p>`);
  }

  const upd = await rest(`${K.table}?week_tag=eq.${week}&approved_at=is.null`, { method: 'PATCH', body: JSON.stringify({ approved_at: new Date().toISOString() }) });
  if (!upd.ok) return page(res, 500, 'FAILED: the approval was not saved', '<p>Try the link again.</p>');
  console.log(`[approve-events-video] ${K.sig} ${week} approved`);
  return page(res, 200, `Approved: ${K.name} ${week}`, `${watch}<p>It goes public ${K.when}.</p>`);
}
