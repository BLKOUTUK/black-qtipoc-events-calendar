// Server-side API route for fetching moderation stats
// Uses service role key to bypass RLS — stats across all statuses need admin access
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[moderation-stats] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
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
    // Fetch title, date, and status — needed for deduplication
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=title,date,status`,
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
      console.error('[moderation-stats] Supabase error:', response.status, errorText);
      return res.status(500).json({
        success: false,
        stats: { pending: 0, approved: 0, rejected: 0, total: 0 },
        error: 'Database query failed'
      });
    }

    const rawEvents = await response.json();

    // Deduplicate by title+date (same logic as pending-events.ts)
    const events = Array.from(
      new Map((rawEvents || []).map((e: any) => [
        `${(e.title || '').toLowerCase().trim()}|${e.date || ''}`,
        e
      ])).values()
    );

    const stats = events.reduce((acc: any, event: any) => {
      if (event.status === 'draft' || event.status === 'reviewing' || event.status === 'pending') {
        acc.pending++;
      } else if (event.status === 'approved' || event.status === 'published') {
        acc.approved++;
      } else if (event.status === 'archived' || event.status === 'cancelled') {
        acc.rejected++;
      }
      acc.total++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, total: 0 });

    return res.status(200).json({
      success: true,
      stats,
      source: 'supabase-direct'
    });
  } catch (error: any) {
    console.error('[moderation-stats] Error:', error);
    return res.status(500).json({
      success: false,
      stats: { pending: 0, approved: 0, rejected: 0, total: 0 },
      error: error.message || 'Internal server error'
    });
  }
}
