// One-time cleanup to strip Outsavvy boilerplate from existing events
// Uses service role key to bypass RLS
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Same patterns as in scrape-events.ts
function stripOutsavvyBoilerplate(text: string): string {
  if (!text) return '';

  const boilerplatePatterns = [
    /Track your loved events in your profile or on the OutSavvy App[\s\S]*?Available on the App Store[\s\S]*?Avai[a-z]*/gi,
    /Store your tickets securely on the app[\s\S]*?Get app notifications when tickets go on sale[^.]*\.?/gi,
    /Browse and buy tickets on the go[^.]*\.?/gi,
    /Available on the App Store[\s\S]*$/gi,
    /Download the OutSavvy app[^.]*\.?/gi,
    /Get the OutSavvy app[^.]*\.?/gi,
    /Track your loved events[^.]*\.?/gi,
    /Get notified when tickets go on sale[^.]*\.?/gi,
  ];

  let cleaned = text;
  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
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
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  try {
    // Fetch all events with descriptions containing Outsavvy boilerplate
    const fetchResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=id,description&or=(description.ilike.%25OutSavvy%25,description.ilike.%25App%20Store%25,description.ilike.%25Track%20your%20loved%20events%25)`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!fetchResponse.ok) {
      const error = await fetchResponse.text();
      return res.status(500).json({ success: false, error: `Failed to fetch events: ${error}` });
    }

    const events = await fetchResponse.json();
    console.log(`[cleanup-boilerplate] Found ${events.length} events with potential boilerplate`);

    if (!events || events.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No events with boilerplate found',
        updated: 0
      });
    }

    let updated = 0;
    let unchanged = 0;

    for (const event of events) {
      const original = event.description || '';
      const cleaned = stripOutsavvyBoilerplate(original);

      // Skip if no change
      if (cleaned === original) {
        unchanged++;
        continue;
      }

      // Update the event
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${event.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            description: cleaned,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (updateResponse.ok) {
        updated++;
        console.log(`[cleanup-boilerplate] Cleaned event ${event.id}`);
      } else {
        console.error(`[cleanup-boilerplate] Failed to update ${event.id}`);
      }
    }

    console.log(`[cleanup-boilerplate] Done: ${updated} updated, ${unchanged} unchanged`);

    return res.status(200).json({
      success: true,
      message: `Cleaned boilerplate from ${updated} events`,
      updated,
      unchanged,
      total: events.length
    });

  } catch (error: any) {
    console.error('[cleanup-boilerplate] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
