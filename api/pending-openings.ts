// Server-side API route for fetching pending openings — moderator-only.
// Uses service role key to read (openings has no anon grant — reads go through
// openings_live for the public; this route is the moderation queue).
// Requires a valid Supabase session bearer token, verified against auth/v1/user.
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[pending-openings] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

async function verifyModerator(authHeader: string | undefined): Promise<{ email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (!user || !user.id) return null;
    return { email: user.email || user.id };
  } catch (error) {
    console.error('[pending-openings] Token verification error:', error);
    return null;
  }
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ success: false, openings: [], error: 'Server misconfigured' });
  }

  const moderator = await verifyModerator(req.headers.authorization);
  if (!moderator) {
    return res.status(401).json({ success: false, openings: [], error: 'Sign in required' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/openings?status=eq.pending&order=submitted_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[pending-openings] Supabase error:', response.status, errorText);
      return res.status(500).json({ success: false, openings: [], error: 'Database query failed' });
    }

    const rawOpenings = await response.json();

    // found_by_contact must never leave the server — strip it from every row.
    const openings = (rawOpenings || []).map((row: any) => {
      const stripped = { ...row };
      delete stripped.found_by_contact;
      return stripped;
    });

    return res.status(200).json({
      success: true,
      openings,
      count: openings.length
    });
  } catch (error: any) {
    console.error('[pending-openings] Error:', error);
    return res.status(500).json({
      success: false,
      openings: [],
      error: error.message || 'Internal server error'
    });
  }
}
