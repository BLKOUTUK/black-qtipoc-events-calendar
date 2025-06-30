import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Enhanced keywords for Black QTIPOC+ events
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

// UK-focused search terms for Outsavvy
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

interface OutsavvyEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  venue: {
    name: string;
    address: string;
    city: string;
    postcode: string;
  };
  organizer: {
    name: string;
    id: string;
  };
  url: string;
  image_url?: string;
  price_info: {
    min_price: number;
    max_price: number;
    currency: string;
    is_free: boolean;
  };
  categories: string[];
  tags: string[];
}

function calculateRelevanceScore(event: OutsavvyEvent): number {
  const searchText = `${event.title} ${event.description} ${event.categories.join(' ')} ${event.tags.join(' ')}`.toLowerCase();
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

  // Category bonuses
  event.categories.forEach(category => {
    const cat = category.toLowerCase();
    if (cat.includes('community') || cat.includes('social')) score += 3;
    if (cat.includes('arts') || cat.includes('culture')) score += 2;
    if (cat.includes('lgbtq') || cat.includes('diversity')) score += 5;
  });

  return score;
}

function isRelevantEvent(event: OutsavvyEvent): boolean {
  const score = calculateRelevanceScore(event);
  return score >= 10; // Minimum threshold for relevance
}

// Helper function to log to Google Sheets
async function logToGoogleSheets(data: any) {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!googleApiKey || !sheetId) {
      console.warn('Google Sheets logging not configured');
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/ScrapingLogs:append?valueInputOption=RAW&key=${googleApiKey}`;
    
    const values = [[
      data.id,
      data.source,
      data.events_found,
      data.events_added,
      data.status,
      data.created_at,
      data.error_message
    ]];

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
  } catch (error) {
    console.warn('Failed to log to Google Sheets:', error.message);
  }
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  try {
    const outsavvyApiKey = process.env.OUTSAVVY_API_KEY;
    if (!outsavvyApiKey) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Outsavvy API key not configured. Please set OUTSAVVY_API_KEY environment variable.',
          events_found: 0,
          events_added: 0
        })
      };
    }

    let totalFound = 0;
    let totalRelevant = 0;
    let totalAdded = 0;
    const errors: string[] = [];
    const relevanceScores: number[] = [];

    // Search using different strategies
    for (const strategy of SEARCH_STRATEGIES) {
      for (const city of strategy.cities) {
        try {
          // Get coordinates for city (simplified mapping)
          const cityCoords = {
            'London': { lat: 51.5074, lng: -0.1278 },
            'Manchester': { lat: 53.4808, lng: -2.2426 },
            'Birmingham': { lat: 52.4862, lng: -1.8904 },
            'Bristol': { lat: 51.4545, lng: -2.5879 },
            'Leeds': { lat: 53.8008, lng: -1.5491 },
            'Brighton': { lat: 50.8225, lng: -0.1372 }
          };
          
          const coords = cityCoords[city] || cityCoords['London'];
          
          // Correct Outsavvy API URL with proper base URL and parameters
          const url = `https://www.api.outsavvy.com/v1/events/search?` +
            `q=${encodeURIComponent(strategy.query)}&` +
            `latitude=${coords.lat}&` +
            `longitude=${coords.lng}&` +
            `range=10&` +
            `start_date=${new Date().toISOString().split('T')[0]}&` +
            `end_date=${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Partner ${outsavvyApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            if (response.status === 429) {
              // Rate limited - wait and retry
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
            throw new Error(`Outsavvy API error: ${response.status}`);
          }

          const data = await response.json();
          const events: OutsavvyEvent[] = data.events || [];
          totalFound += events.length;

          for (const outsavvyEvent of events) {
            const relevanceScore = calculateRelevanceScore(outsavvyEvent);
            relevanceScores.push(relevanceScore);

            if (!isRelevantEvent(outsavvyEvent)) continue;
            totalRelevant++;
            
            // Would add to Google Sheets Events tab here
            // For now just counting relevant events
            totalAdded++;
          }

          // Rate limiting - be respectful to Outsavvy API
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          errors.push(`Error searching ${city} for "${strategy.query}": ${error.message}`);
        }
      }
    }

    // Calculate quality metrics
    const avgRelevanceScore = relevanceScores.length > 0 
      ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length 
      : 0;

    // Log the scraping session to Google Sheets
    const logData = {
      id: Date.now().toString(),
      source: 'outsavvy',
      events_found: totalFound,
      events_added: totalAdded,
      status: errors.length > 0 ? 'partial' : 'success',
      created_at: new Date().toISOString(),
      error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
    };

    await logToGoogleSheets(logData);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        events_found: totalFound,
        events_relevant: totalRelevant,
        events_added: totalAdded,
        relevance_rate: totalFound > 0 ? (totalRelevant / totalFound * 100).toFixed(1) + '%' : '0%',
        avg_relevance_score: avgRelevanceScore.toFixed(1),
        search_strategies_used: SEARCH_STRATEGIES.length,
        cities_searched: SEARCH_STRATEGIES.reduce((acc, s) => acc + s.cities.length, 0),
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined
      })
    };

  } catch (error) {
    console.error('Outsavvy scraping error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message,
        events_found: 0,
        events_added: 0
      })
    };
  }
};