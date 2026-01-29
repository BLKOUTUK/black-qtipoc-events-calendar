// Server-side API route for fetching pending events
// Uses service role key to bypass RLS — pending events are not readable via anon key
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxMjc2NywiZXhwIjoyMDcxMTg4NzY3fQ.syRvR268kK8MmxEeBm7cBRjj-37sOM3PCR9oWUlaghw';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const events = await response.json();

    return res.status(200).json({
      success: true,
      events: events || [],
      count: events?.length || 0,
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
