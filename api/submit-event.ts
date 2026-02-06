// Server-side API for Chrome extension event submissions
// Uses service role key to bypass RLS
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('[submit-event] Config:', {
  hasUrl: \!\!SUPABASE_URL,
  hasServiceKey: \!\!SUPABASE_SERVICE_ROLE_KEY
});

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method \!== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (\!SUPABASE_URL || \!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[submit-event] Missing env vars');
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured'
    });
  }

  try {
    const data = req.body || {};
    console.log('[submit-event] Received:', data);

    const title = data.title || data.eventTitle || '';
    if (\!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const eventPayload = {
      title: title,
      description: data.description || data.eventDescription || '',
      date: data.date || data.eventDate || data.event_date || new Date().toISOString().split('T')[0],
      location: data.location || data.eventLocation || 'TBA',
      organizer: data.organizer || data.eventOrganizer || data.organizer_name || data.submitted_by || 'Unknown',
      source: data.source || 'chrome-extension',
      url: data.url || data.sourceUrl || data.source_url || '',
      cost: data.cost || data.eventCost || data.price || 'See link',
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log('[submit-event] Inserting:', eventPayload);

    const titleEncoded = encodeURIComponent(eventPayload.title);
    const checkUrl = SUPABASE_URL + '/rest/v1/events?title=ilike.' + titleEncoded + '&date=eq.' + eventPayload.date + '&select=id&limit=1';

    const checkResponse = await fetch(checkUrl, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing && existing.length > 0) {
        console.log('[submit-event] Duplicate found:', existing[0].id);
        return res.status(200).json({
          success: true,
          message: 'Event already exists',
          id: existing[0].id,
          duplicate: true
        });
      }
    }

    const insertResponse = await fetch(
      SUPABASE_URL + '/rest/v1/events',
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(eventPayload)
      }
    );

    if (\!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('[submit-event] Insert failed:', insertResponse.status, errorText);
      return res.status(500).json({
        success: false,
        error: 'Failed to insert event',
        debug: { status: insertResponse.status, error: errorText }
      });
    }

    const result = await insertResponse.json();
    const insertedEvent = Array.isArray(result) ? result[0] : result;

    console.log('[submit-event] Success:', insertedEvent.id);

    return res.status(200).json({
      success: true,
      message: 'Event submitted for moderation',
      id: insertedEvent.id
    });

  } catch (error: any) {
    console.error('[submit-event] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
