#!/usr/bin/env node

/**
 * Real Events Scraper for BLKOUT Community
 * Scrapes actual current events from Eventbrite and other sources
 */

const fetch = require('node-fetch');
const http = require('http');
const url = require('url');

// Load environment variables
require('dotenv').config();

// Real scraped events storage
let cachedEvents = [];
let lastScrapeTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Eventbrite API configuration
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_TOKEN;
const EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3';

// Keywords for relevance scoring
const IDENTITY_KEYWORDS = [
  'black', 'african', 'afro', 'caribbean', 'diaspora',
  'qtipoc', 'queer', 'trans', 'transgender', 'gay', 'lesbian', 'bisexual',
  'lgbtq', 'lgbtqia', 'pride', 'rainbow'
];

const COMMUNITY_KEYWORDS = [
  'poc', 'bipoc', 'people of color', 'melanin', 'intersectional',
  'community', 'collective', 'network', 'alliance'
];

const VALUES_KEYWORDS = [
  'liberation', 'justice', 'activism', 'organizing', 'empowerment',
  'healing', 'wellness', 'support', 'safe space', 'inclusive',
  'diversity', 'equity', 'belonging', 'mutual aid'
];

// Calculate relevance score
function calculateRelevanceScore(event) {
  const text = `${event.name?.text || ''} ${event.description?.text || ''}`.toLowerCase();
  let score = 0;
  
  // Identity keywords get highest weight
  IDENTITY_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) score += 10;
  });
  
  // Community keywords get medium weight  
  COMMUNITY_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) score += 7;
  });
  
  // Values keywords get lower weight
  VALUES_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) score += 5;
  });
  
  return score;
}

// Format event for API response
function formatEvent(event) {
  const relevanceScore = calculateRelevanceScore(event);
  
  return {
    id: event.id,
    title: event.name?.text || 'Untitled Event',
    description: event.description?.text || 'No description available',
    start_time: event.start?.utc,
    end_time: event.end?.utc,
    location: event.online_event 
      ? 'Online Event'
      : event.venue?.name || 'Location TBD',
    address: event.venue?.address ? 
      `${event.venue.address.address_1 || ''}, ${event.venue.address.city || ''}${event.venue.address.postal_code ? ', ' + event.venue.address.postal_code : ''}`.trim() :
      'Address TBD',
    organizer: event.organizer?.name || 'Unknown Organizer',
    registration_url: event.url,
    tags: extractTags(event),
    is_free: event.is_free || false,
    price: event.ticket_availability?.minimum_ticket_price?.display || (event.is_free ? 'Free' : 'See event page'),
    relevance_score: relevanceScore / 100 // Normalize to 0-1 range
  };
}

// Extract relevant tags from event
function extractTags(event) {
  const text = `${event.name?.text || ''} ${event.description?.text || ''}`.toLowerCase();
  const tags = [];
  
  // Add category if available
  if (event.category?.name) {
    tags.push(event.category.name.toLowerCase());
  }
  
  // Add location-based tags
  if (event.venue?.address?.city) {
    tags.push(event.venue.address.city.toLowerCase());
  }
  
  // Add relevant keywords as tags
  const allKeywords = [...IDENTITY_KEYWORDS, ...COMMUNITY_KEYWORDS, ...VALUES_KEYWORDS];
  allKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return [...new Set(tags)]; // Remove duplicates
}

// Search Eventbrite for events
async function searchEventbrite(query, location = 'London') {
  if (!EVENTBRITE_TOKEN) {
    console.log('❌ No Eventbrite API token configured');
    return [];
  }
  
  try {
    const searchUrl = `${EVENTBRITE_BASE_URL}/events/search/?` +
      `q=${encodeURIComponent(query)}&` +
      `location.address=${encodeURIComponent(location)}&` +
      `location.within=25km&` +
      `start_date.range_start=${new Date().toISOString()}&` +
      `start_date.range_end=${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()}&` +
      `expand=organizer,venue,category,subcategory,ticket_availability&` +
      `page_size=50`;
    
    console.log(`🔍 Searching Eventbrite for: "${query}" in ${location}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    console.log(`✅ Found ${events.length} events for "${query}"`);
    return events;
    
  } catch (error) {
    console.error(`❌ Error searching Eventbrite for "${query}":`, error.message);
    return [];
  }
}

// Get events from known QTIPOC+ organizations
async function getOrganizationEvents() {
  const organizations = [
    { id: '210048439247', name: 'BlackOutUK' },
    // Add more organization IDs as discovered
  ];
  
  const allEvents = [];
  
  for (const org of organizations) {
    try {
      const eventsUrl = `${EVENTBRITE_BASE_URL}/organizations/${org.id}/events/?` +
        `status=live&` +
        `order_by=start_asc&` +
        `expand=organizer,venue,category,subcategory,ticket_availability`;
      
      console.log(`🏢 Getting events from ${org.name}`);
      
      const response = await fetch(eventsUrl, {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const events = data.events || [];
        allEvents.push(...events);
        console.log(`✅ Found ${events.length} events from ${org.name}`);
      } else {
        console.log(`❌ Failed to get events from ${org.name}: ${response.status}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error getting events from ${org.name}:`, error.message);
    }
  }
  
  return allEvents;
}

// Scrape events from all sources
async function scrapeEvents() {
  console.log('🚀 Starting real event scraping...');
  
  const allEvents = [];
  
  // Search terms for relevant events
  const searchTerms = [
    'black queer',
    'black gay',
    'black lgbt',
    'black trans',
    'qtipoc',
    'black pride',
    'african diaspora lgbt',
    'black liberation',
    'intersectional',
    'people of color lgbt'
  ];
  
  // Search Eventbrite with various terms
  for (const term of searchTerms) {
    const events = await searchEventbrite(term);
    allEvents.push(...events);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Get events from known organizations
  const orgEvents = await getOrganizationEvents();
  allEvents.push(...orgEvents);
  
  // Remove duplicates and filter for relevance
  const uniqueEvents = [];
  const seenIds = new Set();
  
  for (const event of allEvents) {
    if (!seenIds.has(event.id)) {
      seenIds.add(event.id);
      const relevanceScore = calculateRelevanceScore(event);
      
      // Only include events with relevance score > 10
      if (relevanceScore > 10) {
        uniqueEvents.push(event);
      }
    }
  }
  
  // Sort by relevance score
  uniqueEvents.sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a));
  
  console.log(`🎯 Found ${uniqueEvents.length} relevant events after filtering`);
  
  return uniqueEvents.map(formatEvent);
}

// Get cached events or scrape new ones
async function getEvents() {
  const now = Date.now();
  
  if (cachedEvents.length === 0 || (now - lastScrapeTime) > CACHE_DURATION) {
    console.log('🔄 Cache expired or empty, scraping new events...');
    cachedEvents = await scrapeEvents();
    lastScrapeTime = now;
  } else {
    console.log('✅ Using cached events');
  }
  
  return cachedEvents;
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    if (path === '/api/events' || path === '/api/events/upcoming') {
      const events = await getEvents();
      const limit = parseInt(parsedUrl.query.limit) || 20;
      const limitedEvents = events.slice(0, limit);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        events: limitedEvents,
        count: limitedEvents.length,
        total: events.length,
        last_updated: new Date(lastScrapeTime).toISOString()
      }));
      
    } else if (path === '/api/events/search') {
      const events = await getEvents();
      const query = parsedUrl.query.q?.toLowerCase() || '';
      const limit = parseInt(parsedUrl.query.limit) || 20;
      
      const searchResults = events.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      ).slice(0, limit);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        events: searchResults,
        count: searchResults.length,
        query: query
      }));
      
    } else if (path === '/api/events/refresh') {
      // Force refresh
      cachedEvents = [];
      lastScrapeTime = 0;
      const events = await getEvents();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        events_found: events.length,
        message: 'Events refreshed successfully'
      }));
      
    } else if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'BLKOUT Real Events API',
        events_cached: cachedEvents.length,
        last_scrape: new Date(lastScrapeTime).toISOString(),
        cache_expires: new Date(lastScrapeTime + CACHE_DURATION).toISOString()
      }));
      
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Start server
const port = 9001;
server.listen(port, () => {
  console.log(`🗓️  BLKOUT Real Events API`);
  console.log(`🌐 Running on: http://localhost:${port}`);
  console.log(`📖 Endpoints:`);
  console.log(`   GET /api/events             - All scraped events`);
  console.log(`   GET /api/events/upcoming    - Upcoming events`);
  console.log(`   GET /api/events/search      - Search events`);
  console.log(`   GET /api/events/refresh     - Force refresh cache`);
  console.log(`   GET /health                 - Health check`);
  console.log(`🎯 Ready to serve real scraped events!`);
  
  // Initial scrape
  console.log('🔄 Performing initial event scrape...');
  getEvents().then(events => {
    console.log(`✅ Initial scrape complete: ${events.length} events loaded`);
  });
});