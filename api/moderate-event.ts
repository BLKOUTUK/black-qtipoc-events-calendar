// Server-side API route for approving/rejecting events
// Uses service role key to bypass RLS
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxMjc2NywiZXhwIjoyMDcxMTg4NzY3fQ.syRvR268kK8MmxEeBm7cBRjj-37sOM3PCR9oWUlaghw';

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

  try {
    const { eventId, action, reason } = req.body || {};

    if (!eventId || !action) {
      return res.status(400).json({ success: false, error: 'Missing eventId or action' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be approve or reject' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'archived';

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(reason ? { rejection_reason: reason } : {})
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[moderate-event] Supabase error:`, response.status, errorText);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    console.log(`[moderate-event] Event ${eventId} ${action}d → status: ${newStatus}`);
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
