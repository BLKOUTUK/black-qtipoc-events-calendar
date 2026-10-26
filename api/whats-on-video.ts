// The latest published "BLKOUT What's On" video, for the events homepage (Rob, 26 Oct 2026:
// "when published, this weekend's digest should be shared on the events page").
// aivor_event_digests is service-role only, so the page reads it through here. Only a video Rob
// approved and the publish run made public, and only for 8 days: an old week shows nothing.
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'Server misconfigured' });
  const since = new Date(Date.now() - 8 * 86400000).toISOString();
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/aivor_event_digests?select=week_label,video_id,video_url,published_at&privacy=eq.public&published_at=gte.${since}&order=published_at.desc&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  );
  if (!r.ok) return res.status(502).json({ error: `read failed ${r.status}` });
  const [video] = await r.json();
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({ video: video || null });
}
