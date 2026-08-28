// Server-side API for opening submissions (jobs, commissions, residencies, bursaries,
// funds, calls, panels, training, research) — the "things to go after" stream.
// Uses service role key to bypass RLS. Same pattern as submit-event.ts.
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Must match the CHECK constraints in supabase/migrations/20260828_openings.sql
const ALLOWED_KINDS = ['job', 'commission', 'residency', 'bursary', 'fund', 'call', 'panel', 'training', 'research', 'other'];
const ALLOWED_BEATS = ['arts-film', 'writing-publishing', 'jobs-training', 'money', 'study-research', 'community-organising'];

console.log('[submit-opening] Config:', {
  hasUrl: Boolean(SUPABASE_URL),
  hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY)
});

function isValidDeadline(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !isNaN(d.getTime());
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
    console.error('[submit-opening] Missing env vars');
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured'
    });
  }

  try {
    const data = req.body || {};
    console.log('[submit-opening] Received:', { ...data, found_by_contact: data.found_by_contact ? '[redacted]' : undefined });

    // Honeypot — a real visitor never fills the hidden 'website' field.
    // Accept quietly, never insert.
    if (data.website && String(data.website).trim() !== '') {
      console.log('[submit-opening] Honeypot triggered — not inserting');
      return res.status(200).json({ success: true, id: null });
    }

    const title = String(data.title || '').trim();
    const organisation = String(data.organisation || data.organization || '').trim();
    const url = String(data.url || data.link || '').trim();
    const summary = String(data.summary || data.description || '').trim();
    const found_by = String(data.found_by || data.name || '').trim();
    const found_by_contact = String(data.found_by_contact || data.contact || '').trim();

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!organisation) {
      return res.status(400).json({ success: false, error: 'Organisation is required' });
    }
    if (!url) {
      return res.status(400).json({ success: false, error: 'Link is required' });
    }
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ success: false, error: 'Link must start with http:// or https://' });
    }
    if (!summary) {
      return res.status(400).json({ success: false, error: 'A short summary is required' });
    }
    if (summary.length > 280) {
      return res.status(400).json({ success: false, error: 'Summary must be 280 characters or fewer' });
    }
    if (!found_by) {
      return res.status(400).json({ success: false, error: 'Your name is required' });
    }
    if (!found_by_contact) {
      return res.status(400).json({ success: false, error: 'A way to reach you is required' });
    }

    const kind = String(data.kind || 'other').trim();
    if (!ALLOWED_KINDS.includes(kind)) {
      return res.status(400).json({ success: false, error: `kind must be one of: ${ALLOWED_KINDS.join(', ')}` });
    }

    const beat = String(data.beat || '').trim();
    if (!beat || !ALLOWED_BEATS.includes(beat)) {
      return res.status(400).json({ success: false, error: `beat must be one of: ${ALLOWED_BEATS.join(', ')}` });
    }

    const rolling = data.rolling === true || data.rolling === 'true';
    let deadline: string | null = null;
    const rawDeadline = data.deadline || data.closes;
    if (!rolling && rawDeadline) {
      const deadlineStr = String(rawDeadline).trim();
      if (!isValidDeadline(deadlineStr)) {
        return res.status(400).json({ success: false, error: 'Deadline must be a valid YYYY-MM-DD date' });
      }
      deadline = deadlineStr;
    }

    // Dedupe on URL — a listing already pending or approved doesn't need a second row.
    const urlEncoded = encodeURIComponent(url);
    const checkUrl = `${SUPABASE_URL}/rest/v1/openings?url=eq.${urlEncoded}&status=in.(pending,approved)&select=id&limit=1`;

    const checkResponse = await fetch(checkUrl, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing && existing.length > 0) {
        console.log('[submit-opening] Duplicate found:', existing[0].id);
        return res.status(200).json({
          success: true,
          duplicate: true,
          id: existing[0].id
        });
      }
    }

    const openingPayload = {
      title,
      organisation,
      kind,
      beat,
      summary,
      open_to: String(data.open_to || '').trim() || null,
      pay: String(data.pay || '').trim() || null,
      location: String(data.location || '').trim() || null,
      url,
      deadline,
      found_by,
      found_by_contact,
      status: 'pending',
      source: 'form'
    };

    console.log('[submit-opening] Inserting:', { ...openingPayload, found_by_contact: '[redacted]' });

    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/openings`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(openingPayload)
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('[submit-opening] Insert failed:', insertResponse.status, errorText);
      return res.status(500).json({
        success: false,
        error: 'Failed to insert opening',
        debug: { status: insertResponse.status, error: errorText }
      });
    }

    const result = await insertResponse.json();
    const inserted = Array.isArray(result) ? result[0] : result;

    console.log('[submit-opening] Success:', inserted.id);

    return res.status(200).json({
      success: true,
      id: inserted.id
    });

  } catch (error: any) {
    console.error('[submit-opening] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
