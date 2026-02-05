// Server-side API route for approving/rejecting events
// Uses service role key to bypass RLS
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Log config status at startup (mask key for security)
console.log('[moderate-event] Config:', {
  hasUrl: !!SUPABASE_URL,
  urlPrefix: SUPABASE_URL?.slice(0, 30) + '...',
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
  keyPrefix: SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...'
});

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check config before processing
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[moderate-event] Missing env vars - URL:', !!SUPABASE_URL, 'Key:', !!SUPABASE_SERVICE_ROLE_KEY);
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  try {
    const { eventId, action, reason } = req.body || {};
    console.log('[moderate-event] Request:', { eventId, action, reason });

    if (!eventId || !action) {
      return res.status(400).json({ success: false, error: 'Missing eventId or action' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be approve or reject' });
    }

    // Database CHECK constraint only allows: pending, approved, rejected, published, past
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[moderate-event] Supabase error:`, response.status, errorText);
      return res.status(500).json({
        success: false,
        message: 'Database update failed',
        debug: { status: response.status, error: errorText }
      });
    }

    // Check if any rows were actually updated
    const updatedRows = await response.json();
    console.log(`[moderate-event] Updated rows:`, updatedRows.length, updatedRows);

    if (!updatedRows || updatedRows.length === 0) {
      console.error(`[moderate-event] No rows updated for event ${eventId}`);
      return res.status(404).json({
        success: false,
        message: `Event ${eventId} not found or already in status ${newStatus}`
      });
    }

    console.log(`[moderate-event] Event ${eventId} ${action}ed → status: ${newStatus}`);
    return res.status(200).json({
      success: true,
      message: `Event ${action}d successfully`
    });
  } catch (error: any) {
    console.error('[moderate-event] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
