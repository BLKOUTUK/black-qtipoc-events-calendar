import type { Request, Response } from 'express';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Supabase configuration (same database as community platform)
const SUPABASE_URL = 'https://bgjengudzfickgomjqmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0';

// IVOR Liberation API configuration
const IVOR_API_BASE = process.env.IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

/**
 * Liberation validation for event submissions
 * Enforces creator sovereignty and anti-oppression checks
 */
async function validateEventLiberation(event: {
  title: string;
  description: string;
  organizer?: string;
}): Promise<{
  passed: boolean;
  recommendation: 'auto-approve' | 'review-quick' | 'review-deep';
  liberationScore: number;
  concerns: string[];
}> {
  const contentText = `${event.title} ${event.description}`.toLowerCase();

  // Liberation alignment indicators
  const liberationIndicators = [
    'black queer', 'black trans', 'qtipoc', 'lgbtq', 'pride',
    'community', 'healing', 'safe space', 'mutual aid', 'liberation'
  ];

  const alignmentCount = liberationIndicators.filter(ind => contentText.includes(ind)).length;
  const liberationScore = Math.min(1, alignmentCount / 4);

  // Anti-oppression checks
  const concerns: string[] = [];
  const problematicPatterns = [
    { pattern: /corporate.*diversity|diversity.*training.*company/i, concern: 'Corporate diversity focus' },
    { pattern: /fetish|exotic/i, concern: 'Potential fetishization' }
  ];

  for (const { pattern, concern } of problematicPatterns) {
    if (pattern.test(contentText)) concerns.push(concern);
  }

  // Determine recommendation
  let recommendation: 'auto-approve' | 'review-quick' | 'review-deep' = 'review-quick';
  if (liberationScore >= 0.5 && concerns.length === 0) {
    recommendation = 'auto-approve';
  } else if (concerns.length > 0) {
    recommendation = 'review-deep';
  }

  return {
    passed: concerns.length === 0,
    recommendation,
    liberationScore,
    concerns
  };
}

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

    // Liberation validation - enforce community values
    const liberationCheck = await validateEventLiberation({
      title,
      description: description || '',
      organizer
    });

    console.log('🏴‍☠️ Liberation validation:', liberationCheck);

    // Format data for Supabase events table (match schema)
    // Ensure required NOT NULL fields have values
    // Apply liberation validation results to event status
    const eventData = {
      title: title || 'Untitled Event',
      date: date,
      start_time: time || null,
      end_time: null,
      end_date: req.body.end_date || null,
      location: location || 'TBD',
      description: description || 'No description provided', // NOT NULL constraint
      url: url || moreInfoUrl || sourceUrl || req.body.event_url || '',
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      organizer: organizer || 'Community',
      source: source || 'chrome-extension',
      // Liberation-aware status: auto-approve high-confidence liberation events
      status: liberationCheck.recommendation === 'auto-approve' ? 'published' : 'pending',
      created_at: new Date().toISOString(),
      // Liberation metadata
      liberation_score: liberationCheck.liberationScore,
      moderation_recommendation: liberationCheck.recommendation,
      liberation_concerns: liberationCheck.concerns
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
      message: liberationCheck.recommendation === 'auto-approve'
        ? 'Event auto-approved (liberation-compliant community event)'
        : 'Event submitted successfully and is pending approval',
      data: {
        id: responseData[0]?.id,
        title,
        date,
        status: eventData.status,
        liberation: {
          score: liberationCheck.liberationScore,
          recommendation: liberationCheck.recommendation,
          autoApproved: liberationCheck.recommendation === 'auto-approve'
        }
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
