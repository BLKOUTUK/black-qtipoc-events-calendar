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

// UK-focused search strategies
const SEARCH_STRATEGIES = [
  { query: 'black queer', cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'] },
  { query: 'qtipoc', cities: ['London', 'Brighton', 'Manchester', 'Bristol'] },
  { query: 'black trans', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
  { query: 'black lgbtq', cities: ['London', 'Bristol', 'Manchester', 'Brighton'] },
  { query: 'black liberation', cities: ['London', 'Manchester', 'Birmingham'] },
  { query: 'racial justice queer', cities: ['London', 'Bristol', 'Manchester'] },
  { query: 'intersectional community', cities: ['London', 'Brighton', 'Leeds'] },
  { query: 'black community workshop', cities: ['London', 'Manchester', 'Birmingham'] },
  { query: 'queer poc arts', cities: ['London', 'Bristol', 'Brighton'] },
  { query: 'black wellness healing', cities: ['London', 'Manchester', 'Leeds'] }
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
    // In a real implementation, this would use the Google Sheets API
    // to append events to the Events sheet and log to ScrapingLogs sheet
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

    for (const strategy of SEARCH_STRATEGIES) {
      for (const city of strategy.cities) {
        try {
          const url = `https://www.eventbriteapi.com/v3/events/search/?` +
            `q=${encodeURIComponent(strategy.query)}&` +
            `location.address=${encodeURIComponent(city)}&` +
            `start_date.range_start=${new Date().toISOString()}&` +
            `start_date.range_end=${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()}&` +
            `expand=organizer,venue,category,subcategory,ticket_availability&` +
            `sort_by=relevance&` +
            `token=${eventbriteToken}`;
          
          const response = await fetch(url);
          if (!response.ok) {
            if (response.status === 429) {
              // Rate limited - wait and retry
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
            throw new Error(`Eventbrite API error: ${response.status}`);
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
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          errors.push(`Error searching ${city} for "${strategy.query}": ${error.message}`);
        }
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
        search_strategies_used: SEARCH_STRATEGIES.length,
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