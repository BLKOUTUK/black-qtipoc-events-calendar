import type { Request, Response } from '@netlify/functions';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST
  if (req.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
        message: 'This endpoint only supports POST requests'
      })
    };
  }

  try {
    const body = JSON.parse(req.body || '{}');
    const {
      title,
      date,
      time,
      location,
      description,
      url,
      tags = [],
      organizer,
      capacity,
      cost,
      registrationRequired = false,
      virtualLink,
      submittedBy = 'chrome-extension'
    } = body;

    // Validation
    if (!title || !date) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: 'Title and date are required fields'
        })
      };
    }

    // Submit to Google Sheets (events calendar uses Google Sheets backend)
    const sheetUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.EVENTS_SUBMISSION_WEBHOOK;

    if (!sheetUrl) {
      console.error('Google Sheets webhook URL not configured');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Server configuration error',
          message: 'Event submission endpoint not configured'
        })
      };
    }

    // Format data for Google Sheets
    const eventData = {
      timestamp: new Date().toISOString(),
      title,
      date,
      time: time || '',
      location: location || 'TBD',
      description: description || '',
      url: url || '',
      tags: Array.isArray(tags) ? tags.join(', ') : tags,
      organizer: organizer || 'Community Member',
      capacity: capacity || '',
      cost: cost || 'Free',
      registrationRequired: registrationRequired ? 'Yes' : 'No',
      virtualLink: virtualLink || '',
      submittedBy,
      status: 'pending' // Events need approval
    };

    // Submit to Google Sheets via webhook
    const response = await fetch(sheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      console.error('Google Sheets submission failed:', response.status);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Submission failed',
          message: 'Failed to submit event to Google Sheets'
        })
      };
    }

    console.log('✅ Event submitted successfully:', { title, date });

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Event submitted successfully and is pending approval',
        data: {
          title,
          date,
          status: 'pending'
        }
      })
    };

  } catch (error: any) {
    console.error('Event submission error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      })
    };
  }
};
