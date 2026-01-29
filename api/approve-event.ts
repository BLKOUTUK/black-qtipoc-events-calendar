import type { Request, Response } from 'express';
import twitterService from '../lib/twitterService';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password'
};

// Supabase configuration
const SUPABASE_URL = 'https://bgjengudzfickgomjqmz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYxMjc2NywiZXhwIjoyMDcxMTg4NzY3fQ.syRvR268kK8MmxEeBm7cBRjj-37sOM3PCR9oWUlaghw';

export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Check admin authentication
  const adminPassword = process.env.ADMIN_PASSWORD || 'blkout2024';
  const providedPassword = req.headers['x-admin-password'];

  if (providedPassword !== adminPassword) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    // Get the event details
    const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const events = await getResponse.json();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = events[0];

    // Update event status to approved
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('❌ Failed to approve event:', error);
      return res.status(updateResponse.status).json({
        success: false,
        error: 'Failed to approve event',
        details: error
      });
    }

    const updatedEvent = await updateResponse.json();

    console.log('✅ Event approved:', event.title);

    // Post to Twitter (non-blocking)
    twitterService.postEvent(event).catch(err => {
      console.error('Twitter posting failed (non-blocking):', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Event approved successfully and posted to Twitter',
      data: {
        id: eventId,
        title: event.title,
        status: 'approved',
        approvedAt: updatedEvent[0]?.approved_at
      }
    });

  } catch (error: any) {
    console.error('Event approval error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
