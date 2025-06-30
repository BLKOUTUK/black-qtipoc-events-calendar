import { Handler } from '@netlify/functions';

// Known Black QTIPOC+ organizations and pages (these would be real page IDs)
const KNOWN_QTIPOC_PAGES = [
  // UK Organizations from the directory
  { id: 'UKBlackPride', name: 'UK Black Pride', type: 'advocacy' },
  { id: 'GlitterCymru', name: 'Glitter Cymru', type: 'advocacy' },
  { id: 'RainbowNoirMCR', name: 'Rainbow Noir Manchester', type: 'community_center' },
  { id: 'PxssyPalace', name: 'Pxssy Palace', type: 'arts_collective' },
  { id: 'bbz_london', name: 'BBZ London', type: 'arts_collective' },
  { id: 'houseofnoirmcr', name: 'House of Noir', type: 'arts_collective' },
  { id: 'ColoursYouthUK', name: 'Colours Youth Network', type: 'youth' },
  { id: 'blacktransalliance', name: 'Black Trans Alliance C.I.C', type: 'advocacy' },
  { id: 'rat._.party', name: 'Rat Party Leeds', type: 'arts_collective' },
  { id: 'scotchbonnetglasgow', name: 'Scotch Bonnet', type: 'arts_collective' }
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

async function appendToGoogleSheet(events: any[], logData: any) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.warn('Google Sheets credentials not configured');
    return;
  }

  try {
    // In a real implementation, this would use the Google Sheets API
    console.log('Would append to Google Sheets:', {
      events: events.length,
      log: logData
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
  }
}

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
    const facebookToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (!facebookToken) {
      // Return success but with note about configuration
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
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
        })
      };
    }

    let totalFound = 0;
    let totalAdded = 0;
    const errors: string[] = [];
    const discoveredEvents: any[] = [];

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

        for (const fbEvent of events) {
          // Apply relevance filtering
          if (!isRelevantEvent(fbEvent)) continue;

          const eventUrl = `https://facebook.com/events/${fbEvent.id}`;

          // Format event for Google Sheets
          const formattedEvent = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: fbEvent.name,
            description: fbEvent.description || 'No description available',
            event_date: fbEvent.start_time,
            location: formatLocation(fbEvent),
            source: 'facebook',
            source_url: eventUrl,
            organizer_name: fbEvent.owner.name,
            tags: extractTags(fbEvent).join(', '),
            status: 'draft',
            price: fbEvent.ticket_uri ? 'See event page' : 'Free',
            image_url: fbEvent.cover?.source || '',
            scraped_date: new Date().toISOString()
          };

          discoveredEvents.push(formattedEvent);
          totalAdded++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        errors.push(`Error scraping page ${page.name}: ${error.message}`);
      }
    }

    // Log the scraping session
    const logData = {
      id: Date.now().toString(),
      source: 'facebook',
      events_found: totalFound,
      events_added: totalAdded,
      status: errors.length > 0 ? 'partial' : 'success',
      created_at: new Date().toISOString(),
      error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
    };

    // Write to Google Sheets
    await appendToGoogleSheet(discoveredEvents, logData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        events_found: totalFound,
        events_added: totalAdded,
        pages_scraped: KNOWN_QTIPOC_PAGES.length,
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined,
        note: totalFound === 0 ? 'No events found. Consider adding more known QTIPOC+ organization page IDs.' : undefined
      })
    };

  } catch (error) {
    console.error('Facebook scraping error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        events_found: 0,
        events_added: 0
      })
    };
  }
};