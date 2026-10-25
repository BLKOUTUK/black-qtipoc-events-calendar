// Event image approvals for Comms /admin/events (Rob, 25 Oct 2026) — moderator-only, same
// session check as moderate-opening.ts.
//   GET                          pending images with their event
//   POST { action: 'scan' }      look for images now (also runs nightly from server.ts)
//   POST { id, action: 'approve' | 'reject' }
// Approving sets events.image_url to our stored copy; until then nothing is public.
import type { Request, Response } from 'express';
import { scanForEventImages } from './image-finder';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

async function verifyModerator(authHeader: string | undefined): Promise<{ email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (!user || !user.id) return null;
    return { email: user.email || user.id };
  } catch (error) {
    console.error('[image-candidates] Token verification error:', error);
    return null;
  }
}

function rest(pathAndQuery: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ success: false, error: 'Server misconfigured' });
  }
  const moderator = await verifyModerator(req.headers.authorization);
  if (!moderator) return res.status(401).json({ success: false, error: 'Sign in required' });

  try {
    if (req.method === 'GET') {
      const r = await rest('event_image_candidates?status=eq.pending&select=id,event_id,source_page,stored_url,width,height,found_at,events(title,date,organizer,url)&order=found_at.asc');
      if (!r.ok) return res.status(500).json({ success: false, error: `read failed ${r.status}` });
      const candidates = await r.json();
      return res.status(200).json({ success: true, candidates, count: candidates.length });
    }

    const { id, action } = req.body || {};
    if (action === 'scan') {
      const outcomes = await scanForEventImages();
      console.log(`[image-candidates] scan by ${moderator.email}:`, outcomes.map((o) => `${o.title} → ${o.result}`).join(' | '));
      return res.status(200).json({ success: true, outcomes, found: outcomes.filter((o) => o.result.startsWith('found')).length });
    }
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Need id and action approve or reject (or action scan)' });
    }

    const decided = await rest(`event_image_candidates?id=eq.${encodeURIComponent(id)}&status=eq.pending`, {
      method: 'PATCH',
      body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected', decided_at: new Date().toISOString(), decided_by: moderator.email }),
    });
    if (!decided.ok) return res.status(500).json({ success: false, error: `update failed ${decided.status}` });
    const rows = (await decided.json()) as { event_id: string; stored_url: string }[];
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found, or already decided' });

    if (action === 'approve') {
      const ev = await rest(`events?id=eq.${rows[0].event_id}`, { method: 'PATCH', body: JSON.stringify({ image_url: rows[0].stored_url }) });
      const evRows = ev.ok ? ((await ev.json()) as unknown[]) : [];
      if (!ev.ok || evRows.length !== 1) {
        // Put the candidate back so the decision can be retried rather than silently lost.
        await rest(`event_image_candidates?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'pending', decided_at: null, decided_by: null }) });
        return res.status(500).json({ success: false, error: 'FAILED: event image not set; the image is back in the queue' });
      }
    }
    console.log(`[image-candidates] ${id} ${action}d by ${moderator.email}`);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[image-candidates] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
