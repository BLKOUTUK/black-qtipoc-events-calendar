import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Supabase configuration (same database as community platform)
const SUPABASE_URL = 'https://bgjengudzfickgomjqmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      error: 'Method not allowed',
      message: 'This endpoint only supports POST requests'
    });
  }

  try {
    const {
      title,
      date,
      time,
      location,
      description,
      url,
      tags = [],
      organizer,
      source = 'chrome-extension',
      sourceUrl,
      submittedBy = 'chrome-extension',
      moreInfoUrl
    } = req.body;

    // Validation
    if (!title || !date) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Title and date are required fields'
      });
    }

    // Format data for Supabase events table (match schema)
    const eventData = {
      title,
      date,
      start_time: time || null,
      location: location || 'TBD',
      description: description || '',
      url: url || moreInfoUrl || sourceUrl || '',
      tags: Array.isArray(tags) ? tags : [tags],
      organizer: organizer || null,
      source: source,
      status: 'pending', // Events need approval
      created_at: new Date().toISOString()
    };

    console.log('📤 Submitting event to Supabase:', eventData);

    // Submit to Supabase directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(eventData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Supabase submission failed:', response.status, responseData);
      return res.status(response.status).json({
        success: false,
        error: 'Submission failed',
        message: responseData.message || 'Failed to submit event to database',
        details: responseData
      });
    }

    console.log('✅ Event submitted successfully:', responseData);

    return res.status(201).json({
      success: true,
      message: 'Event submitted successfully and is pending approval',
      data: {
        id: responseData[0]?.id,
        title,
        date,
        status: 'pending'
      }
    });

  } catch (error: any) {
    console.error('Event submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
