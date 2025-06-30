import { Handler } from '@netlify/functions';

// Enhanced keyword system for Black QTIPOC+ events
const IDENTITY_KEYWORDS = [
  'black', 'african american', 'afro', 'afrocaribbean', 'african diaspora',
  'qtipoc', 'queer', 'trans', 'transgender', 'nonbinary', 'non-binary',
  'lgbtq', 'lgbtqia', 'lgbtqia+', 'gay', 'lesbian', 'bisexual', 'pansexual',
  'two spirit', 'gender fluid', 'genderqueer'
];

const COMMUNITY_KEYWORDS = [
  'poc', 'bipoc', 'people of color', 'melanin', 'intersectional',
  'community', 'collective', 'coalition', 'alliance', 'network'
];

const VALUES_KEYWORDS = [
  'liberation', 'justice', 'social justice', 'racial justice',
  'healing', 'wellness', 'mental health', 'therapy', 'support group',
  'safe space', 'brave space', 'inclusive', 'diversity', 'equity',
  'belonging', 'empowerment', 'activism', 'organizing', 'mutual aid'
];

const EVENT_TYPE_KEYWORDS = [
  'workshop', 'training', 'seminar', 'conference', 'summit',
  'celebration', 'festival', 'party', 'social', 'mixer',
  'art', 'creative', 'performance', 'music', 'poetry', 'spoken word',
  'book club', 'reading', 'discussion', 'panel', 'talk',
  'support group', 'therapy', 'counseling', 'wellness',
  'protest', 'march', 'rally', 'demonstration', 'action'
];

const ALL_KEYWORDS = [
  ...IDENTITY_KEYWORDS,
  ...COMMUNITY_KEYWORDS,
  ...VALUES_KEYWORDS,
  ...EVENT_TYPE_KEYWORDS
];

// Known QTIPOC+ organizations on Eventbrite (their organization IDs)
const QTIPOC_ORGANIZATIONS = [
  { id: '210048439247', name: 'BlackOutUK' }, // We know this one works
  // Add more as we discover them
];

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description: { text: string };
  start: { utc: string; local: string };
  end: { utc: string; local: string };
  venue?: {
    name: string;
    address: {
      address_1?: string;
      city: string;
      region: string;
      country: string;
    };
  };
  online_event?: boolean;
  organizer: { name: string; id: string };
  url: string;
  logo?: { url: string };
  ticket_availability?: { is_free: boolean };
  ticket_classes?: Array<{ cost: { display: string } }>;
  category?: { name: string };
  subcategory?: { name: string };
}

function calculateRelevanceScore(event: EventbriteEvent): number {
  const searchText = `${event.name.text} ${event.description.text}`.toLowerCase();
  let score = 0;

  // Identity keywords get highest weight
  IDENTITY_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) {
      score += 10;
    }
  });

  // Community keywords get medium-high weight
  COMMUNITY_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) {
      score += 7;
    }
  });

  // Values keywords get medium weight
  VALUES_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) {
      score += 5;
    }
  });

  // Event type keywords get lower weight
  EVENT_TYPE_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) {
      score += 2;
    }
  });

  // Bonus points for multiple keyword matches
  const uniqueMatches = ALL_KEYWORDS.filter(keyword => searchText.includes(keyword)).length;
  if (uniqueMatches >= 3) score += 5;
  if (uniqueMatches >= 5) score += 10;

  return score;
}

function isRelevantEvent(event: EventbriteEvent): boolean {
  const score = calculateRelevanceScore(event);
  return score >= 10; // Minimum threshold for relevance
}

async function appendToGoogleSheet(events: any[], logData: any) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.warn('Google Sheets credentials not configured');
    return;
  }

  try {
    // Append events to Events sheet
    if (events.length > 0) {
      const eventsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Events:append?valueInputOption=RAW&key=${API_KEY}`;
      const eventsValues = events.map(event => [
        event.id,
        event.name,
        event.description,
        event.start?.utc || event.event_date,
        event.venue?.address?.address_1 + ', ' + event.venue?.address?.city || event.location,
        'eventbrite',
        event.url || event.source_url,
        event.organizer?.name || event.organizer_name,
        event.tags?.join(', ') || '',
        'draft',
        event.ticket_availability?.minimum_ticket_price?.display || event.price || '',
        event.logo?.url || event.image_url || '',
        new Date().toISOString()
      ]);

      await fetch(eventsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: eventsValues })
      });
    }

    // Log to ScrapingLogs sheet
    const logUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/ScrapingLogs:append?valueInputOption=RAW&key=${API_KEY}`;
    const logValues = [[
      logData.id,
      logData.source,
      logData.events_found,
      logData.events_added,
      logData.status,
      logData.created_at,
      logData.error_message || ''
    ]];

    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: logValues })
    });

    console.log('Successfully wrote to Google Sheets:', {
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
    const eventbriteToken = process.env.EVENTBRITE_API_TOKEN;
    if (!eventbriteToken) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Eventbrite API token not configured',
          events_found: 0,
          events_added: 0
        })
      };
    }

    let totalFound = 0;
    let totalAdded = 0;
    let totalRelevant = 0;
    const errors: string[] = [];
    const relevanceScores: number[] = [];
    const discoveredEvents: any[] = [];

    for (const org of QTIPOC_ORGANIZATIONS) {
      try {
        const url = `https://www.eventbriteapi.com/v3/organizations/${org.id}/events/?` +
          `status=live,started,ended&` +
          `order_by=start_asc&` +
          `expand=organizer,venue,category,subcategory,ticket_availability`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${eventbriteToken}`,
            'Content-Type': 'application/json'
          }
        });
          if (!response.ok) {
            if (response.status === 429) {
              // Rate limited - wait and retry
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
            throw new Error(`Eventbrite API error: ${response.status} for ${org.name}`);
          }

          const data = await response.json();
          const events: EventbriteEvent[] = data.events || [];
          totalFound += events.length;

          for (const eventData of events) {
            const relevanceScore = calculateRelevanceScore(eventData);
            relevanceScores.push(relevanceScore);

            if (!isRelevantEvent(eventData)) continue;
            totalRelevant++;

            // Format event for Google Sheets
            const formattedEvent = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: eventData.name.text,
              description: eventData.description.text || 'No description available',
              event_date: eventData.start.utc,
              location: eventData.online_event 
                ? 'Online Event' 
                : eventData.venue 
                  ? `${eventData.venue.name}, ${eventData.venue.address.city}, ${eventData.venue.address.region}`
                  : 'Location TBD',
              source: 'eventbrite',
              source_url: eventData.url,
              organizer_name: eventData.organizer.name,
              tags: ALL_KEYWORDS.filter(keyword => 
                `${eventData.name.text} ${eventData.description.text}`.toLowerCase().includes(keyword)
              ).join(', '),
              status: 'draft',
              price: eventData.ticket_availability?.is_free 
                ? 'Free' 
                : eventData.ticket_classes?.length 
                  ? eventData.ticket_classes.map(tc => tc.cost.display).join(', ')
                  : 'See event page',
              image_url: eventData.logo?.url || '',
              scraped_date: new Date().toISOString()
            };

            discoveredEvents.push(formattedEvent);
            totalAdded++;
          }

        // Rate limiting - be respectful to Eventbrite API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push(`Error fetching events from ${org.name}: ${error.message}`);
      }
    }

    // Calculate quality metrics
    const avgRelevanceScore = relevanceScores.length > 0 
      ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length 
      : 0;

    // Log the scraping session
    const logData = {
      id: Date.now().toString(),
      source: 'eventbrite',
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
        events_relevant: totalRelevant,
        events_added: totalAdded,
        relevance_rate: totalFound > 0 ? (totalRelevant / totalFound * 100).toFixed(1) + '%' : '0%',
        avg_relevance_score: avgRelevanceScore.toFixed(1),
        organizations_checked: QTIPOC_ORGANIZATIONS.length,
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined
      })
    };

  } catch (error) {
    console.error('Scraping error:', error);
    
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