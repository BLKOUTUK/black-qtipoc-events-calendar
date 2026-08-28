// Server-side API route for approving/rejecting openings — moderator-only.
// Requires a valid Supabase session bearer token, verified against auth/v1/user.
// The DB trigger (openings_gesture_on_approve, see supabase/migrations/20260828_openings.sql)
// creates the first_gestures row on approval — this route does NOT do it.
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('[moderate-opening] Config:', {
  hasUrl: Boolean(SUPABASE_URL),
  hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
  hasAnonKey: Boolean(SUPABASE_ANON_KEY)
});

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
    console.error('[moderate-opening] Token verification error:', error);
    return null;
  }
}

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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[moderate-opening] Missing env vars');
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  const moderator = await verifyModerator(req.headers.authorization);
  if (!moderator) {
    return res.status(401).json({ success: false, error: 'Sign in required' });
  }

  try {
    const { id, action, reason } = req.body || {};
    console.log('[moderate-opening] Request:', { id, action, reason, moderator: moderator.email });

    if (!id || !action) {
      return res.status(400).json({ success: false, error: 'Missing id or action' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be approve or reject' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updateBody: Record<string, unknown> = {
      status: newStatus,
      moderated_by: moderator.email,
      moderated_at: new Date().toISOString(),
    };
    if (reason) {
      updateBody.moderation_reason = reason;
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/openings?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[moderate-opening] Supabase error:', response.status, errorText);
      return res.status(500).json({
        success: false,
        error: 'Database update failed',
        debug: { status: response.status, error: errorText }
      });
    }

    const updatedRows = await response.json();
    console.log('[moderate-opening] Updated rows:', updatedRows.length);

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Opening ${id} not found or already in status ${newStatus}`
      });
    }

    const opening = { ...updatedRows[0] };
    delete opening.found_by_contact;
    console.log(`[moderate-opening] Opening ${id} ${action}d by ${moderator.email} -> status: ${newStatus}`);

    return res.status(200).json({
      success: true,
      opening
    });
  } catch (error: any) {
    console.error('[moderate-opening] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
