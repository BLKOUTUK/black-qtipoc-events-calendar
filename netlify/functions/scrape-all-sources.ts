import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const results = {
      eventbrite: { success: false, events_added: 0, error: null },
      facebook: { success: false, events_added: 0, error: null },
      total_events_added: 0
    };

    const baseUrl = process.env.URL || 'http://localhost:8888';

    // Call Eventbrite scraper
    try {
      const eventbriteResponse = await fetch(`${baseUrl}/.netlify/functions/scrape-eventbrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (eventbriteResponse.ok) {
        const eventbriteData = await eventbriteResponse.json();
        results.eventbrite.success = eventbriteData.success;
        results.eventbrite.events_added = eventbriteData.events_added || 0;
        results.total_events_added += results.eventbrite.events_added;
      } else {
        results.eventbrite.error = `HTTP ${eventbriteResponse.status}`;
      }
    } catch (error) {
      results.eventbrite.error = error.message;
    }

    // Call Facebook scraper
    try {
      const facebookResponse = await fetch(`${baseUrl}/.netlify/functions/scrape-facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (facebookResponse.ok) {
        const facebookData = await facebookResponse.json();
        results.facebook.success = facebookData.success;
        results.facebook.events_added = facebookData.events_added || 0;
        results.total_events_added += results.facebook.events_added;
      } else {
        results.facebook.error = `HTTP ${facebookResponse.status}`;
      }
    } catch (error) {
      results.facebook.error = error.message;
    }

    // Log the combined scraping session to Google Sheets
    const logData = {
      id: Date.now().toString(),
      source: 'all_sources',
      events_found: 0, // This would need to be calculated from individual scrapers
      events_added: results.total_events_added,
      status: results.total_events_added > 0 ? 'success' : 'partial',
      created_at: new Date().toISOString(),
      error_message: [results.eventbrite.error, results.facebook.error].filter(Boolean).join('; ') || null
    };

    console.log('Would log to Google Sheets:', logData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        results,
        message: `Scraping completed. Added ${results.total_events_added} new events.`
      })
    };

  } catch (error) {
    console.error('Combined scraping error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};