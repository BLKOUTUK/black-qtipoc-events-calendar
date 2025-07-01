import { Handler } from '@netlify/functions';
import { XMLParser } from 'fast-xml-parser';

// Known QTIPOC+ organizations with RSS feeds
const RSS_SOURCES = [
  {
    name: 'UK Black Pride',
    url: 'https://www.ukblackpride.org.uk/feed/',
    organization_type: 'pride',
    location: 'London',
    tags: ['black', 'lgbtq', 'pride', 'community']
  },
  {
    name: 'Black Lives Matter UK',
    url: 'https://blacklivesmatter.uk/feed/',
    organization_type: 'activism',
    location: 'UK',
    tags: ['black', 'activism', 'justice', 'community']
  },
  {
    name: 'Stonewall UK',
    url: 'https://www.stonewall.org.uk/rss.xml',
    organization_type: 'lgbtq',
    location: 'UK',
    tags: ['lgbtq', 'equality', 'rights', 'advocacy']
  },
  {
    name: 'Gendered Intelligence',
    url: 'https://genderedintelligence.co.uk/feed',
    organization_type: 'trans',
    location: 'UK',
    tags: ['trans', 'transgender', 'education', 'support']
  },
  {
    name: 'Black Cultural Archives',
    url: 'https://blackculturalarchives.org/feed/',
    organization_type: 'cultural',
    location: 'London',
    tags: ['black', 'culture', 'history', 'arts', 'heritage']
  },
  {
    name: 'Kaleidoscope Trust',
    url: 'https://kaleidoscopetrust.com/feed/',
    organization_type: 'international_lgbtq',  
    location: 'UK',
    tags: ['lgbtq', 'international', 'human rights', 'advocacy']
  }
];

// Enhanced keyword system for RSS content analysis
const IDENTITY_KEYWORDS = [
  'black', 'african american', 'afro', 'afrocaribbean', 'african diaspora', 'melanin',
  'qtipoc', 'queer', 'trans', 'transgender', 'nonbinary', 'non-binary', 'genderqueer',
  'lgbtq', 'lgbtqia', 'lgbtqia+', 'gay', 'lesbian', 'bisexual', 'pansexual',
  'two spirit', 'gender fluid', 'intersex', 'asexual', 'aromantic'
];

const COMMUNITY_KEYWORDS = [
  'poc', 'bipoc', 'people of color', 'intersectional', 'community', 'collective', 
  'coalition', 'alliance', 'network', 'solidarity', 'unity', 'diaspora'
];

const VALUES_KEYWORDS = [
  'liberation', 'justice', 'social justice', 'racial justice', 'equality', 'equity',
  'healing', 'wellness', 'mental health', 'therapy', 'support group', 'safe space',
  'brave space', 'inclusive', 'diversity', 'belonging', 'empowerment', 'activism',
  'organizing', 'mutual aid', 'decolonizing', 'anti-racism', 'intersectionality'
];

const EVENT_INDICATORS = [
  'event', 'workshop', 'training', 'seminar', 'conference', 'summit', 'meetup',
  'celebration', 'festival', 'party', 'social', 'mixer', 'gathering',
  'art', 'creative', 'performance', 'music', 'poetry', 'spoken word',
  'book club', 'reading', 'discussion', 'panel', 'talk', 'lecture',
  'support group', 'therapy', 'counseling', 'wellness', 'healing circle',
  'protest', 'march', 'rally', 'demonstration', 'action', 'vigil',
  'date:', 'time:', 'venue:', 'location:', 'register:', 'tickets:', 'rsvp:'
];

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category?: string[];
  guid?: string;
}

interface ProcessedEvent {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  source: string;
  source_url: string;
  organizer_name: string;
  tags: string;
  status: string;
  price: string;
  image_url: string;
  scraped_date: string;
  relevance_score: number;
  is_event_likely: boolean;
}

function calculateRelevanceScore(item: RSSItem, source: any): number {
  const searchText = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;

  // Base score from source credibility
  score += 5;

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

  // Event indicator keywords
  EVENT_INDICATORS.forEach(keyword => {
    if (searchText.includes(keyword)) {
      score += 3;
    }
  });

  // Source-specific bonuses
  source.tags.forEach(tag => {
    if (searchText.includes(tag)) {
      score += 4;
    }
  });

  // Bonus for multiple keyword matches
  const allKeywords = [...IDENTITY_KEYWORDS, ...COMMUNITY_KEYWORDS, ...VALUES_KEYWORDS];
  const uniqueMatches = allKeywords.filter(keyword => searchText.includes(keyword)).length;
  if (uniqueMatches >= 3) score += 5;
  if (uniqueMatches >= 5) score += 10;

  // Date recency bonus (recent posts more likely to be events)
  const pubDate = new Date(item.pubDate);
  const now = new Date();
  const daysSincePub = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePub <= 7) score += 5;
  if (daysSincePub <= 30) score += 3;

  return score;
}

function isLikelyEvent(item: RSSItem): boolean {
  const searchText = `${item.title} ${item.description}`.toLowerCase();
  
  // Strong event indicators
  const strongEventWords = ['event', 'workshop', 'conference', 'festival', 'celebration', 'meetup', 'gathering'];
  const hasStrongEventWord = strongEventWords.some(word => searchText.includes(word));
  
  // Date/time patterns
  const hasDatePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i.test(searchText);
  const hasTimePattern = /\b(\d{1,2}:\d{2}|\d{1,2}(am|pm))\b/i.test(searchText);
  
  // Location indicators
  const hasLocationPattern = /\b(venue|location|address|at\s+\w+|in\s+\w+)\b/i.test(searchText);
  
  // Registration/ticket indicators
  const hasRegisterPattern = /\b(register|rsvp|tickets|book|sign up|join us)\b/i.test(searchText);
  
  // Score the likelihood
  let eventScore = 0;
  if (hasStrongEventWord) eventScore += 3;
  if (hasDatePattern) eventScore += 2;
  if (hasTimePattern) eventScore += 2;
  if (hasLocationPattern) eventScore += 1;
  if (hasRegisterPattern) eventScore += 1;
  
  return eventScore >= 2;
}

async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EventsCalendar/1.0 (Community Events Aggregator)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      trimValues: true
    });
    
    const result = parser.parse(xmlData);
    const items = result.rss?.channel?.item || result.feed?.entry || [];
    
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    console.error(`Failed to fetch RSS from ${url}:`, error.message);
    return [];
  }
}

async function appendToGoogleSheets(events: ProcessedEvent[], logData: any) {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!googleApiKey || !sheetId) {
      console.warn('Google Sheets logging not configured');
      return;
    }

    // Append events to Events sheet
    if (events.length > 0) {
      const eventsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Events:append?valueInputOption=RAW&key=${googleApiKey}`;
      const eventsValues = events.map(event => [
        event.id,
        event.name,
        event.description,
        event.event_date,
        event.location,
        event.source,
        event.source_url,
        event.organizer_name,
        event.tags,
        event.status,
        event.price,
        event.image_url,
        event.scraped_date
      ]);

      await fetch(eventsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: eventsValues })
      });
    }

    // Log to ScrapingLogs sheet
    const logUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/ScrapingLogs:append?valueInputOption=RAW&key=${googleApiKey}`;
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
    console.warn('Failed to log to Google Sheets:', error.message);
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
    let totalFound = 0;
    let totalRelevant = 0;
    let totalEvents = 0;
    let totalAdded = 0;
    const errors: string[] = [];
    const relevanceScores: number[] = [];
    const processedEvents: ProcessedEvent[] = [];
    const sourceResults: any[] = [];

    for (const source of RSS_SOURCES) {
      try {
        console.log(`Fetching RSS from ${source.name}...`);
        const items = await fetchRSSFeed(source.url);
        totalFound += items.length;
        
        let sourceRelevant = 0;
        let sourceEvents = 0;
        
        for (const item of items) {
          const relevanceScore = calculateRelevanceScore(item, source);
          const isEventLikely = isLikelyEvent(item);
          
          relevanceScores.push(relevanceScore);
          
          // Only process if it's both relevant and likely to be an event
          if (relevanceScore >= 15 && isEventLikely) {
            sourceRelevant++;
            totalRelevant++;
            
            if (isEventLikely) {
              sourceEvents++;
              totalEvents++;
              
              // Create processed event
              const processedEvent: ProcessedEvent = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: item.title,
                description: item.description || 'No description available',
                event_date: item.pubDate,
                location: source.location,
                source: 'rss_feed',
                source_url: item.link,
                organizer_name: source.name,
                tags: source.tags.join(', '),
                status: 'draft',
                price: 'See event page',
                image_url: '',
                scraped_date: new Date().toISOString(),
                relevance_score: relevanceScore,
                is_event_likely: isEventLikely
              };
              
              processedEvents.push(processedEvent);
              totalAdded++;
            }
          }
        }
        
        sourceResults.push({
          source: source.name,
          items_found: items.length,
          relevant_items: sourceRelevant,
          likely_events: sourceEvents,
          relevance_rate: items.length > 0 ? (sourceRelevant / items.length * 100).toFixed(1) + '%' : '0%'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push(`Error processing ${source.name}: ${error.message}`);
      }
    }

    // Calculate quality metrics
    const avgRelevanceScore = relevanceScores.length > 0 
      ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length 
      : 0;

    // Log the aggregation session
    const logData = {
      id: Date.now().toString(),
      source: 'rss_aggregation',
      events_found: totalFound,
      events_added: totalAdded,
      status: errors.length > 0 ? 'partial' : 'success',
      created_at: new Date().toISOString(),
      error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
    };

    await appendToGoogleSheets(processedEvents, logData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_items_found: totalFound,
        relevant_items: totalRelevant,
        likely_events: totalEvents,
        events_added: totalAdded,
        relevance_rate: totalFound > 0 ? (totalRelevant / totalFound * 100).toFixed(1) + '%' : '0%',
        event_rate: totalRelevant > 0 ? (totalEvents / totalRelevant * 100).toFixed(1) + '%' : '0%',
        avg_relevance_score: avgRelevanceScore.toFixed(1),
        sources_processed: RSS_SOURCES.length,
        source_breakdown: sourceResults,
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined
      })
    };

  } catch (error) {
    console.error('RSS aggregation error:', error);
    
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