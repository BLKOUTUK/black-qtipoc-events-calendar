import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      eventbrite: { success: false, events_added: 0, error: null },
      facebook: { success: false, events_added: 0, error: null },
      total_events_added: 0
    };

    // Call Eventbrite scraper
    try {
      const eventbriteResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-eventbrite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        }
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
      const facebookResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-facebook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        }
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

    // Log the combined scraping session
    await supabaseClient
      .from('scraping_logs')
      .insert({
        source: 'all_sources',
        events_found: 0, // This would need to be calculated from individual scrapers
        events_added: results.total_events_added,
        status: results.total_events_added > 0 ? 'success' : 'partial',
        error_message: [results.eventbrite.error, results.facebook.error].filter(Boolean).join('; ') || null
      });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Scraping completed. Added ${results.total_events_added} new events.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Combined scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});