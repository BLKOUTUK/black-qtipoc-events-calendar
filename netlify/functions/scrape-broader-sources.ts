import { Handler } from '@netlify/functions';
import puppeteer from 'puppeteer';

// Broader LGBTQ+ and Black cultural event sources
const SCRAPING_SOURCES = [
  {
    name: 'Time Out London - LGBT Events',
    url: 'https://www.timeout.com/london/lgbt',
    type: 'timeout_lgbt',
    location: 'London',
    selectors: {
      eventCards: '.feature-item, [data-testid="event-card"], .listing-item',
      title: 'h3, h2, .listing-title, [data-testid="title"]',
      date: '.date, .listing-date, [data-testid="date"], time',
      location: '.venue, .location, [data-testid="venue"]',
      link: 'a[href*="/events/"], a[href*="/things-to-do/"]',
      description: '.description, .listing-description, p'
    }
  },
  {
    name: 'Resident Advisor - London',
    url: 'https://ra.co/events/uk/london',
    type: 'resident_advisor',
    location: 'London',
    selectors: {
      eventCards: '[data-testid="event-item"], .event-item, .listing',
      title: 'h3, h2, .event-title, [data-testid="event-title"]',
      date: '.date, .event-date, [data-testid="date"]',
      location: '.venue, .event-venue, [data-testid="venue"]',
      link: 'a[href*="/events/"]',
      description: '.description, .event-description'
    }
  },
  {
    name: 'Southbank Centre',
    url: 'https://www.southbankcentre.co.uk/whats-on',
    type: 'southbank_centre',
    location: 'London',
    selectors: {
      eventCards: '.event-card, .listing-item, [data-component="event-card"]',
      title: 'h3, h2, .event-title',
      date: '.date, .event-date, time',
      location: '.venue, .location',
      link: 'a[href*="/whats-on/"]',
      description: '.description, .event-description, p'
    }
  },
  {
    name: 'Rich Mix London',
    url: 'https://richmix.org.uk/events/',
    type: 'rich_mix',
    location: 'London', 
    selectors: {
      eventCards: '.event-item, .listing-item, .event-card',
      title: 'h3, h2, .event-title',
      date: '.date, .event-date, time',
      location: '.venue, .location',
      link: 'a[href*="/events/"]',
      description: '.description, .event-description'
    }
  },
  {
    name: 'Black History Month Events',
    url: 'https://www.blackhistorymonth.org.uk/events/',
    type: 'bhm_events',
    location: 'UK',
    selectors: {
      eventCards: '.event, .event-item, .listing',
      title: 'h3, h2, .event-title, .title',
      date: '.date, .event-date, time',
      location: '.location, .venue',
      link: 'a[href*="/event"], a[href*="/events/"]',
      description: '.description, .content, p'
    }
  }
];

// Enhanced QTIPOC+ keyword matching for web scraping
const IDENTITY_KEYWORDS = [
  'black', 'african', 'caribbean', 'afro', 'melanin', 'diaspora',
  'qtipoc', 'queer', 'trans', 'transgender', 'nonbinary', 'non-binary',
  'lgbtq', 'lgbtqia', 'gay', 'lesbian', 'bisexual', 'pansexual',
  'intersex', 'asexual', 'aromantic', 'two spirit', 'genderqueer'
];

const COMMUNITY_KEYWORDS = [
  'poc', 'bipoc', 'people of color', 'intersectional', 'community',
  'collective', 'coalition', 'alliance', 'solidarity', 'inclusive'
];

const VALUES_KEYWORDS = [
  'liberation', 'justice', 'equality', 'activism', 'empowerment',
  'safe space', 'brave space', 'healing', 'wellness', 'support',
  'diversity', 'belonging', 'anti-racism', 'decolonizing'
];

const CULTURAL_KEYWORDS = [
  'afrobeats', 'reggae', 'dancehall', 'hip hop', 'r&b', 'soul',
  'african', 'caribbean', 'black british', 'spoken word', 'poetry',
  'art', 'culture', 'heritage', 'history', 'celebration'
];

const ALL_KEYWORDS = [
  ...IDENTITY_KEYWORDS,
  ...COMMUNITY_KEYWORDS, 
  ...VALUES_KEYWORDS,
  ...CULTURAL_KEYWORDS
];

interface ScrapedEvent {
  title: string;
  description: string;
  date: string;
  location: string;
  url: string;
  source: string;
  rawHTML?: string;
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
}

function calculateRelevanceScore(event: ScrapedEvent): number {
  const searchText = `${event.title} ${event.description}`.toLowerCase();
  let score = 0;

  // Identity keywords get highest weight
  IDENTITY_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) score += 10;
  });

  // Community keywords get medium-high weight
  COMMUNITY_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) score += 7;
  });

  // Values keywords get medium weight
  VALUES_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) score += 5;
  });

  // Cultural keywords get medium weight
  CULTURAL_KEYWORDS.forEach(keyword => {
    if (searchText.includes(keyword)) score += 4;
  });

  // Bonus for multiple keyword matches
  const uniqueMatches = ALL_KEYWORDS.filter(keyword => searchText.includes(keyword)).length;
  if (uniqueMatches >= 2) score += 5;
  if (uniqueMatches >= 4) score += 10;
  if (uniqueMatches >= 6) score += 15;

  // Date relevance (future events score higher)
  const eventDate = new Date(event.date);
  const now = new Date();
  if (eventDate > now) score += 5;
  
  return score;
}

function isRelevantEvent(event: ScrapedEvent): boolean {
  const score = calculateRelevanceScore(event);
  return score >= 12; // Minimum threshold for broader sources
}

async function scrapeSource(source: any, browser: any): Promise<ScrapedEvent[]> {
  const page = await browser.newPage();
  const events: ScrapedEvent[] = [];
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`Scraping ${source.name}...`);
    await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);

    const scrapedEvents = await page.evaluate((selectors) => {
      const results = [];
      
      // Try to find event cards
      let eventCards = [];
      for (const selector of selectors.eventCards.split(', ')) {
        eventCards = document.querySelectorAll(selector.trim());
        if (eventCards.length > 0) {
          console.log(`Found ${eventCards.length} events with selector: ${selector}`);
          break;
        }
      }

      if (eventCards.length === 0) {
        // Fallback: look for any links that might be events
        const possibleEvents = document.querySelectorAll('a[href*="event"], a[href*="show"], a[href*="whats-on"]');
        console.log(`Fallback: Found ${possibleEvents.length} possible event links`);
        
        possibleEvents.forEach((link, index) => {
          if (index < 10) { // Limit for performance
            const parent = link.closest('div, article, section, li');
            if (parent) {
              results.push({
                title: link.textContent?.trim() || parent.querySelector('h1, h2, h3, h4')?.textContent?.trim() || 'Unknown Event',
                description: parent.querySelector('p, .description, .summary')?.textContent?.trim() || '',
                date: parent.querySelector('time, .date')?.textContent?.trim() || '',
                location: parent.querySelector('.venue, .location')?.textContent?.trim() || '',
                url: link.href,
                rawHTML: parent.innerHTML.substring(0, 300)
              });
            }
          }
        });
        
        return results;
      }

      // Extract data from found event cards
      eventCards.forEach((card, index) => {
        if (index >= 20) return; // Limit to 20 events per source
        
        try {
          const event = {
            title: '',
            description: '',
            date: '',
            location: '',
            url: '',
            rawHTML: card.innerHTML.substring(0, 300)
          };

          // Extract title
          for (const titleSelector of selectors.title.split(', ')) {
            const titleEl = card.querySelector(titleSelector.trim());
            if (titleEl && titleEl.textContent?.trim()) {
              event.title = titleEl.textContent.trim();
              break;
            }
          }

          // Extract date
          for (const dateSelector of selectors.date.split(', ')) {
            const dateEl = card.querySelector(dateSelector.trim());
            if (dateEl && dateEl.textContent?.trim()) {
              event.date = dateEl.textContent.trim();
              break;
            }
          }

          // Extract location
          for (const locationSelector of selectors.location.split(', ')) {
            const locationEl = card.querySelector(locationSelector.trim());
            if (locationEl && locationEl.textContent?.trim()) {
              event.location = locationEl.textContent.trim();
              break;
            }
          }

          // Extract URL
          for (const linkSelector of selectors.link.split(', ')) {
            const linkEl = card.querySelector(linkSelector.trim());
            if (linkEl && linkEl.href) {
              event.url = linkEl.href;
              break;
            }
          }

          // Extract description
          for (const descSelector of selectors.description.split(', ')) {
            const descEl = card.querySelector(descSelector.trim());
            if (descEl && descEl.textContent?.trim()) {
              event.description = descEl.textContent.trim();
              break;
            }
          }

          if (event.title) {
            results.push(event);
          }
        } catch (error) {
          console.log(`Error extracting event ${index}:`, error.message);
        }
      });

      return results;
    }, source.selectors);

    // Add source information to events
    scrapedEvents.forEach(event => {
      event.source = source.name;
      if (!event.location) event.location = source.location;
      if (!event.url) event.url = source.url;
    });

    events.push(...scrapedEvents);
    console.log(`✅ Scraped ${scrapedEvents.length} events from ${source.name}`);

  } catch (error) {
    console.error(`❌ Error scraping ${source.name}:`, error.message);
  } finally {
    await page.close();
  }

  return events;
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

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    let totalFound = 0;
    let totalRelevant = 0;
    let totalAdded = 0;
    const errors: string[] = [];
    const relevanceScores: number[] = [];
    const processedEvents: ProcessedEvent[] = [];
    const sourceResults: any[] = [];

    for (const source of SCRAPING_SOURCES) {
      try {
        const scrapedEvents = await scrapeSource(source, browser);
        totalFound += scrapedEvents.length;
        
        let sourceRelevant = 0;
        
        for (const scrapedEvent of scrapedEvents) {
          const relevanceScore = calculateRelevanceScore(scrapedEvent);
          relevanceScores.push(relevanceScore);

          if (isRelevantEvent(scrapedEvent)) {
            sourceRelevant++;
            totalRelevant++;

            // Create processed event
            const processedEvent: ProcessedEvent = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: scrapedEvent.title,
              description: scrapedEvent.description || 'No description available',
              event_date: scrapedEvent.date || new Date().toISOString(),
              location: scrapedEvent.location || source.location,
              source: 'web_scraping',
              source_url: scrapedEvent.url,
              organizer_name: source.name,
              tags: ALL_KEYWORDS.filter(keyword => 
                `${scrapedEvent.title} ${scrapedEvent.description}`.toLowerCase().includes(keyword)
              ).join(', '),
              status: 'draft',
              price: 'See event page',
              image_url: '',
              scraped_date: new Date().toISOString(),
              relevance_score: relevanceScore
            };

            processedEvents.push(processedEvent);
            totalAdded++;
          }
        }

        sourceResults.push({
          source: source.name,
          events_found: scrapedEvents.length,
          relevant_events: sourceRelevant,
          relevance_rate: scrapedEvents.length > 0 ? (sourceRelevant / scrapedEvents.length * 100).toFixed(1) + '%' : '0%'
        });

        // Rate limiting between sources
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        errors.push(`Error scraping ${source.name}: ${error.message}`);
      }
    }

    // Calculate quality metrics
    const avgRelevanceScore = relevanceScores.length > 0 
      ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length 
      : 0;

    // Log the scraping session
    const logData = {
      id: Date.now().toString(),
      source: 'web_scraping_broader',
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
        events_found: totalFound,
        events_relevant: totalRelevant,
        events_added: totalAdded,
        relevance_rate: totalFound > 0 ? (totalRelevant / totalFound * 100).toFixed(1) + '%' : '0%',
        avg_relevance_score: avgRelevanceScore.toFixed(1),
        sources_scraped: SCRAPING_SOURCES.length,
        source_breakdown: sourceResults,
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined
      })
    };

  } catch (error) {
    console.error('Web scraping error:', error);
    
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};