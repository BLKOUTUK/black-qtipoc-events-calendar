// Server-side API route for fetching pending events
// Uses service role key to bypass RLS — pending events are not readable via anon key
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[pending-events] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
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

  try {
    // Query pending events using service role key (bypasses RLS)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/events?status=in.(pending,reviewing,draft)&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[pending-events] Supabase error:', response.status, errorText);
      return res.status(500).json({ success: false, events: [], error: 'Database query failed' });
    }

    const rawEvents = await response.json();

    // Deduplicate by title+date (scrapers insert same event with different IDs)
    const events = Array.from(
      new Map((rawEvents || []).map((e: any) => [`${(e.title || '').toLowerCase().trim()}|${e.date || ''}`, e])).values()
    );

    return res.status(200).json({
      success: true,
      events,
      count: events.length,
      source: 'supabase-direct'
    });
  } catch (error: any) {
    console.error('[pending-events] Error:', error);
    return res.status(500).json({
      success: false,
      events: [],
      error: error.message || 'Internal server error'
    });
  }
}
