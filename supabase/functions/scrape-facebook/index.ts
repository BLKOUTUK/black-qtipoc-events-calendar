import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Known Black QTIPOC+ organizations and pages (these would be real page IDs)
const KNOWN_QTIPOC_PAGES = [
  // Example page IDs - in production, these would be real Facebook page IDs
  // of organizations like:
  // - Black Lives Matter chapters
  // - Local QTIPOC+ community centers
  // - Black queer arts organizations
  // - Trans advocacy groups
  // - Intersectional justice organizations
  
  // Format: { id: 'facebook_page_id', name: 'Organization Name', type: 'organization_type' }
  { id: 'example_page_1', name: 'Black QTIPOC+ Community Center', type: 'community_center' },
  { id: 'example_page_2', name: 'Queer People of Color Collective', type: 'advocacy' },
  { id: 'example_page_3', name: 'Black Trans Liberation', type: 'advocacy' },
  { id: 'example_page_4', name: 'Intersectional Arts Collective', type: 'arts' },
  { id: 'example_page_5', name: 'Black Queer Wellness', type: 'wellness' }
];

// Keywords for additional filtering
const RELEVANT_KEYWORDS = [
  'black', 'african american', 'afro', 'qtipoc', 'queer', 'trans', 'transgender',
  'lgbtq', 'lgbtqia', 'pride', 'intersectional', 'poc', 'bipoc', 'melanin',
  'community', 'liberation', 'justice', 'healing', 'wellness', 'safe space',
  'inclusive', 'diversity', 'equity', 'belonging', 'empowerment'
];

interface FacebookEvent {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time?: string;
  place?: {
    name: string;
    location: {
      city: string;
      state: string;
      street?: string;
      zip?: string;
    };
  };
  cover?: {
    source: string;
  };
  owner: {
    name: string;
    id: string;
  };
  ticket_uri?: string;
  is_online?: boolean;
  attending_count?: number;
  interested_count?: number;
}

function isRelevantEvent(event: FacebookEvent): boolean {
  const searchText = `${event.name} ${event.description || ''}`.toLowerCase();
  return RELEVANT_KEYWORDS.some(keyword => searchText.includes(keyword));
}

function extractTags(event: FacebookEvent): string[] {
  const text = `${event.name} ${event.description || ''}`.toLowerCase();
  const foundKeywords = RELEVANT_KEYWORDS.filter(keyword => text.includes(keyword));
  
  const tags = [...foundKeywords];
  if (text.includes('workshop') || text.includes('training')) tags.push('workshop');
  if (text.includes('art') || text.includes('creative')) tags.push('arts');
  if (text.includes('music') || text.includes('concert')) tags.push('music');
  if (text.includes('health') || text.includes('wellness')) tags.push('wellness');
  if (text.includes('social') || text.includes('networking')) tags.push('social');
  if (text.includes('support') || text.includes('group')) tags.push('support');
  
  return [...new Set(tags)];
}

function formatLocation(event: FacebookEvent): any {
  if (event.is_online) {
    return { type: 'online', name: 'Online Event' };
  }
  
  if (!event.place) return { type: 'tbd', name: 'Location TBD' };
  
  const { name, location } = event.place;
  return {
    type: 'physical',
    name: name,
    address: location.street || '',
    city: location.city,
    state: location.state,
    zip: location.zip || '',
    formatted: `${name}, ${location.city}, ${location.state}`
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const facebookToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    if (!facebookToken) {
      // Return success but with note about configuration
      return new Response(
        JSON.stringify({
          success: true,
          events_found: 0,
          events_added: 0,
          note: 'Facebook API token not configured. To enable Facebook event scraping, add FACEBOOK_ACCESS_TOKEN to your environment variables.',
          setup_instructions: {
            step1: 'Go to https://developers.facebook.com/',
            step2: 'Create a Facebook App',
            step3: 'Request permissions for public events (requires app review)',
            step4: 'Add known QTIPOC+ organization page IDs to the scraper',
            step5: 'Set FACEBOOK_ACCESS_TOKEN environment variable'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let totalFound = 0;
    let totalAdded = 0;
    const errors: string[] = [];

    // Search events from known QTIPOC+ organizations
    for (const page of KNOWN_QTIPOC_PAGES) {
      try {
        // Get events from this page
        const url = `https://graph.facebook.com/v18.0/${page.id}/events?` +
          `access_token=${facebookToken}&` +
          `fields=id,name,description,start_time,end_time,place,cover,owner,ticket_uri,is_online,attending_count,interested_count&` +
          `since=${Math.floor(Date.now() / 1000)}&` +
          `until=${Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 403) {
            errors.push(`Access denied for page ${page.name}. May need additional permissions.`);
            continue;
          }
          throw new Error(`Facebook API error: ${response.status}`);
        }

        const data = await response.json();
        const events: FacebookEvent[] = data.data || [];
        totalFound += events.length;

        for (const event of events) {
          // Apply relevance filtering
          if (!isRelevantEvent(event)) continue;

          const eventUrl = `https://facebook.com/events/${event.id}`;

          // Check if event already exists
          const { data: existingEvent } = await supabaseClient
            .from('events')
            .select('id')
            .eq('source_url', eventUrl)
            .single();

          if (existingEvent) continue;

          // Create or find organizer contact
          let organizerId = null;
          try {
            const { data: existingContact } = await supabaseClient
              .from('contacts')
              .select('id')
              .eq('name', event.owner.name)
              .single();

            if (existingContact) {
              organizerId = existingContact.id;
            } else {
              const { data: newContact } = await supabaseClient
                .from('contacts')
                .insert({
                  name: event.owner.name,
                  email: `${event.owner.name.toLowerCase().replace(/\s+/g, '.')}@facebook.com`,
                  organisation: page.name
                })
                .select()
                .single();

              if (newContact) organizerId = newContact.id;
            }
          } catch (contactError) {
            console.warn('Contact creation failed:', contactError);
          }

          // Insert new event
          const { error } = await supabaseClient
            .from('events')
            .insert({
              name: event.name,
              description: event.description || 'No description available',
              event_date: event.start_time,
              location: formatLocation(event),
              source: 'facebook',
              source_url: eventUrl,
              organizer_id: organizerId,
              organizer_name: event.owner.name,
              tags: extractTags(event),
              status: 'draft', // All scraped events need review
              image_url: event.cover?.source,
              price: event.ticket_uri ? 'See event page' : 'Free',
              target_audience: ['black', 'qtipoc', 'community'],
              attendee_count: (event.attending_count || 0) + (event.interested_count || 0)
            });

          if (!error) {
            totalAdded++;
          } else {
            errors.push(`Failed to insert event ${event.name}: ${error.message}`);
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        errors.push(`Error scraping page ${page.name}: ${error.message}`);
      }
    }

    // Log the scraping session
    await supabaseClient
      .from('scraping_logs')
      .insert({
        source: 'facebook',
        events_found: totalFound,
        events_added: totalAdded,
        status: errors.length > 0 ? 'partial' : 'success',
        error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
      });

    return new Response(
      JSON.stringify({
        success: true,
        events_found: totalFound,
        events_added: totalAdded,
        pages_scraped: KNOWN_QTIPOC_PAGES.length,
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined,
        note: totalFound === 0 ? 'No events found. Consider adding more known QTIPOC+ organization page IDs.' : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Facebook scraping error:', error);
    
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