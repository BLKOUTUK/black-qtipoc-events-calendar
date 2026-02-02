import type { Request, Response } from 'express';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// ================================================================
// Configuration
// ================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const EVENTBRITE_API_TOKEN = process.env.EVENTBRITE_API_TOKEN || '';
const OUTSAVVY_API_KEY = process.env.OUTSAVVY_API_KEY || '';
const SCRAPER_SECRET = process.env.SCRAPER_SECRET || '';

// ================================================================
// Source classification for moderation routing
// ================================================================

const TRUSTED_SOURCES = [
  'DIVA Magazine Events',
  'Eventbrite UK - LGBTQ+',
  'qxmagazine.com',
  'ukblackpride.org.uk',
  'QX Magazine Events',
  'QX Magazine Feed',
  'stonewall.org.uk',
  'Consortium LGBT+',
  'community-submission',
  'Eventbrite API - BlackOutUK',
  'Outsavvy API',
  'Time Out London',
];

function getStatusForSource(sourceName: string): string {
  return TRUSTED_SOURCES.includes(sourceName) ? 'approved' : 'pending';
}

// ================================================================
// Scraping sources
// ================================================================

interface ScrapingSource {
  id: string;
  name: string;
  type: 'jsonld' | 'rss' | 'ical' | 'api';
  url?: string;
  baseUrl?: string;
  searchTerms?: string[];
  trustScore: number;
  category: string;
}

const SCENE_SOURCES: ScrapingSource[] = [
  {
    id: 'qx_magazine_events',
    name: 'QX Magazine Events',
    type: 'jsonld',
    url: 'https://www.qxmagazine.com/events/',
    trustScore: 0.95,
    category: 'nightlife',
  },
  {
    id: 'qx_magazine_rss',
    name: 'QX Magazine Feed',
    type: 'rss',
    url: 'https://www.qxmagazine.com/feed/',
    trustScore: 0.9,
    category: 'nightlife',
  },
  {
    id: 'diva_magazine_events',
    name: 'DIVA Magazine Events',
    type: 'jsonld',
    url: 'https://www.diva-magazine.com/events/',
    trustScore: 0.95,
    category: 'community',
  },
  {
    id: 'consortium_lgbt',
    name: 'Consortium LGBT+',
    type: 'ical',
    url: 'https://www.consortium.lgbt/?post_type=tribe_events&ical=1&eventDisplay=list',
    trustScore: 0.95,
    category: 'community',
  },
  {
    id: 'eventbrite_uk_black_lgbtq',
    name: 'Eventbrite UK - LGBTQ+',
    type: 'jsonld',
    baseUrl: 'https://www.eventbrite.com/d/united-kingdom/lgbtq/',
    searchTerms: ['black lgbtq', 'black queer', 'qtipoc', 'uk black pride', 'black gay'],
    trustScore: 0.85,
    category: 'community',
  },
  {
    id: 'timeout_london_lgbtq',
    name: 'Time Out London',
    type: 'jsonld',
    url: 'https://www.timeout.com/london/lgbtq',
    trustScore: 0.8,
    category: 'community',
  },
];

// Eventbrite API org IDs for known QTIPOC+ organizations
const EVENTBRITE_ORGS = [
  { id: '210048439247', name: 'BlackOutUK' },
];

// Outsavvy search strategies
const OUTSAVVY_SEARCHES = [
  { query: 'black queer', cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'] },
  { query: 'qtipoc', cities: ['London', 'Brighton', 'Manchester', 'Bristol'] },
  { query: 'black trans', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
  { query: 'black lgbtq', cities: ['London', 'Bristol', 'Manchester', 'Brighton'] },
  { query: 'black liberation', cities: ['London', 'Manchester', 'Birmingham'] },
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  London: { lat: 51.5074, lng: -0.1278 },
  Manchester: { lat: 53.4808, lng: -2.2426 },
  Birmingham: { lat: 52.4862, lng: -1.8904 },
  Bristol: { lat: 51.4545, lng: -2.5879 },
  Leeds: { lat: 53.8008, lng: -1.5491 },
  Brighton: { lat: 50.8225, lng: -0.1372 },
};

// ================================================================
// Keywords for relevance scoring
// ================================================================

const BLACK_LGBTQ_KEYWORDS = [
  'black lgbtq', 'black queer', 'black trans', 'black gay', 'black lesbian',
  'qtipoc', 'queer people of color', 'black pride', 'intersectional',
  'african lgbtq', 'caribbean lgbtq', 'diaspora', 'melanin',
  'uk black pride', 'blkout', 'black lgbt', 'bame lgbtq', 'poc queer',
  'black queer community', 'black trans community', 'black joy',
  'black excellence', 'black liberation', 'black empowerment',
];

const UK_LOCATIONS = [
  'london', 'manchester', 'birmingham', 'bristol', 'leeds', 'brighton',
  'nottingham', 'liverpool', 'sheffield', 'cardiff', 'edinburgh', 'glasgow',
  'newcastle', 'leicester', 'oxford', 'cambridge', 'southampton',
  'uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain',
];

const EVENT_CATEGORIES: Record<string, string[]> = {
  social: ['meetup', 'social', 'networking', 'brunch', 'dinner', 'picnic'],
  nightlife: ['club', 'party', 'night', 'dance', 'dj', 'rave'],
  culture: ['art', 'exhibition', 'film', 'theatre', 'performance', 'poetry', 'reading'],
  wellness: ['yoga', 'meditation', 'wellness', 'health', 'support', 'therapy', 'mental health'],
  activism: ['protest', 'march', 'rally', 'workshop', 'training', 'organizing'],
  celebration: ['pride', 'celebration', 'festival', 'carnival', 'anniversary'],
};

// ================================================================
// Utility functions
// ================================================================

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateEventId(sourceId: string, identifier: string): string {
  return `${sourceId}_${Date.now()}_${simpleHash(identifier)}`;
}

function parseEventDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function extractTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toTimeString().slice(0, 5);
  } catch {
    return null;
  }
}

function parseICalDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    if (dateStr.includes('T')) {
      const datePart = dateStr.split('T')[0];
      return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
    }
    return null;
  } catch {
    return null;
  }
}

function calculateRelevanceScore(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;

  BLACK_LGBTQ_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) score += 0.35;
  });

  const lgbtqTerms = ['lgbtq', 'queer', 'trans', 'gay', 'lesbian', 'pride', 'equality', 'rainbow'];
  lgbtqTerms.forEach(term => {
    if (text.includes(term)) score += 0.1;
  });

  const blackTerms = ['black', 'african', 'caribbean', 'diaspora', 'poc', 'bipoc', 'bame'];
  blackTerms.forEach(term => {
    if (text.includes(term)) score += 0.1;
  });

  const communityTerms = ['community', 'meetup', 'social', 'networking', 'support'];
  communityTerms.forEach(term => {
    if (text.includes(term)) score += 0.05;
  });

  return Math.min(score, 1.0);
}

function isUKEvent(event: ScrapedEvent): boolean {
  const locationText = `${event.location || ''} ${event.description || ''}`.toLowerCase();
  return UK_LOCATIONS.some(loc => locationText.includes(loc));
}

function categorizeEvent(title: string, description: string, defaultCategory: string): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [category, keywords] of Object.entries(EVENT_CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) return category;
  }
  return defaultCategory || 'community';
}

function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tagKeywords = [
    'lgbtq', 'queer', 'trans', 'gay', 'lesbian', 'bisexual', 'pride',
    'black', 'african', 'caribbean', 'diaspora', 'poc', 'bipoc',
    'community', 'social', 'networking', 'party', 'club', 'dance',
    'art', 'culture', 'film', 'theatre', 'performance', 'poetry',
    'wellness', 'health', 'mental health', 'support', 'activism',
    'workshop', 'talk', 'discussion', 'brunch', 'dinner',
  ];
  const tags: string[] = [];
  tagKeywords.forEach(keyword => {
    if (text.includes(keyword)) tags.push(keyword);
  });
  return [...new Set(tags)];
}

function extractLocation(title: string, description: string): string {
  const text = `${title} ${description}`;
  for (const city of UK_LOCATIONS.slice(0, 15)) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) return city.charAt(0).toUpperCase() + city.slice(1);
  }
  return 'UK';
}

function parseLocation(location: any): string {
  if (!location) return 'TBD';
  if (typeof location === 'string') return location;
  if (location.name) {
    const parts = [location.name];
    if (location.address?.addressLocality) parts.push(location.address.addressLocality);
    return parts.join(', ');
  }
  if (location.address) {
    return location.address.streetAddress || location.address.addressLocality || 'TBD';
  }
  return 'TBD';
}

function parsePrice(offers: any): string {
  if (!offers) return 'See link';
  const offerList = Array.isArray(offers) ? offers : [offers];
  for (const offer of offerList) {
    if (offer.price === 0 || offer.price === '0') return 'Free';
    if (offer.price) return `£${offer.price}`;
  }
  return 'See link';
}

function extractCost(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('free') || text.includes('no charge') || text.includes('complimentary')) return 'Free';
  const priceMatch = text.match(/£(\d+(?:\.\d{2})?)/i);
  if (priceMatch) return `£${priceMatch[1]}`;
  return 'See link';
}

// ================================================================
// Types
// ================================================================

interface ScrapedEvent {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  sourceId: string;
  date: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location: string;
  organizer: string;
  cost: string;
  tags: string[];
  category: string;
  relevanceScore: number;
  trustScore: number;
  status: string;
  priority: string;
  scrapedAt: string;
}

interface ScrapeResults {
  totalEvents: number;
  successfulSources: number;
  failedSources: number;
  submittedToSupabase: number;
  duplicatesSkipped: number;
  errors: Array<{ source: string; error: string }>;
  sourceBreakdown: Array<{ source: string; found: number; relevant: number }>;
  timestamp: string;
}

// ================================================================
// Scraping methods
// ================================================================

function extractStructuredData(html: string): any[] {
  const events: any[] = [];
  try {
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Event' || item['@type']?.includes?.('Event')) {
            events.push(item);
          }
          if (item.itemListElement) {
            for (const listItem of item.itemListElement) {
              if (listItem.item?.['@type'] === 'Event') events.push(listItem.item);
            }
          }
        }
      } catch { /* skip invalid JSON */ }
    }
  } catch (error: any) {
    console.error('Error extracting structured data:', error.message);
  }
  return events;
}

function parseStructuredEvent(data: any, source: ScrapingSource): ScrapedEvent | null {
  try {
    const title = data.name || '';
    const description = data.description || '';
    if (!title) return null;

    return {
      id: generateEventId(source.id, data.url || title),
      title: cleanText(title),
      description: cleanText(description),
      url: data.url || '',
      source: source.name,
      sourceId: source.id,
      date: parseEventDate(data.startDate),
      end_date: data.endDate ? parseEventDate(data.endDate) : null,
      start_time: extractTime(data.startDate),
      end_time: data.endDate ? extractTime(data.endDate) : null,
      location: parseLocation(data.location),
      organizer: data.organizer?.name || source.name,
      cost: parsePrice(data.offers),
      tags: extractTags(title, description),
      category: categorizeEvent(title, description, source.category),
      relevanceScore: calculateRelevanceScore(title, description),
      trustScore: source.trustScore,
      status: getStatusForSource(source.name),
      priority: 'medium',
      scrapedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error parsing structured event:', error.message);
    return null;
  }
}

async function scrapeJSONLDSource(source: ScrapingSource): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  const urls = source.searchTerms
    ? source.searchTerms.map(term => `${source.baseUrl}?q=${encodeURIComponent(term)}`)
    : [source.url!];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        timeout: 20000,
      });

      const structuredData = extractStructuredData(response.data);
      console.log(`  Found ${structuredData.length} JSON-LD events from ${url}`);

      for (const eventData of structuredData) {
        const event = parseStructuredEvent(eventData, source);
        if (event) events.push(event);
      }

      if (urls.length > 1) await delay(2000);
    } catch (error: any) {
      console.error(`  Error fetching ${url}:`, error.message);
    }
  }
  return events;
}

async function scrapeRSSFeed(source: ScrapingSource): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  try {
    const response = await axios.get(source.url!, {
      headers: {
        'User-Agent': 'BLKOUT-EventBot/1.0 (https://blkout.org; community@blkoutuk.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      timeout: 15000,
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const itemList = Array.isArray(items) ? items : [items];

    for (const item of itemList) {
      const title = cleanText(item.title || '');
      const description = cleanText(item.description || item.summary || item.content || '');
      const link = item.link?.['@_href'] || item.link || '';
      if (!title) continue;

      events.push({
        id: generateEventId(source.id, link || title),
        title,
        description,
        url: link,
        source: source.name,
        sourceId: source.id,
        date: parseEventDate(item.pubDate || item.published || item.updated),
        location: extractLocation(title, description),
        organizer: source.name,
        cost: extractCost(title, description),
        tags: extractTags(title, description),
        category: categorizeEvent(title, description, source.category),
        relevanceScore: calculateRelevanceScore(title, description),
        trustScore: source.trustScore,
        status: getStatusForSource(source.name),
        priority: 'medium',
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error(`Error scraping RSS ${source.name}:`, error.message);
  }
  return events;
}

async function scrapeICalSource(source: ScrapingSource): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    const response = await axios.get(source.url!, {
      headers: {
        'User-Agent': 'BLKOUT-EventBot/1.0 (https://blkout.org; community@blkoutuk.com)',
        'Accept': 'text/calendar, application/calendar+xml',
      },
      timeout: 15000,
    });

    const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    let match;

    while ((match = veventRegex.exec(response.data)) !== null) {
      const vevent = match[1];
      const getValue = (field: string): string | null => {
        const regex = new RegExp(`^${field}[^:]*:(.*)$`, 'mi');
        const m = vevent.match(regex);
        return m ? m[1].trim() : null;
      };

      const title = getValue('SUMMARY');
      if (!title) continue;

      const desc = getValue('DESCRIPTION') || '';
      events.push({
        id: generateEventId(source.id, getValue('UID') || title),
        title: cleanICalText(title),
        description: cleanICalText(desc),
        url: getValue('URL') || '',
        source: source.name,
        sourceId: source.id,
        date: parseICalDate(getValue('DTSTART')),
        end_date: parseICalDate(getValue('DTEND')),
        location: cleanICalText(getValue('LOCATION') || 'TBD'),
        organizer: getValue('ORGANIZER') || source.name,
        cost: 'See link',
        tags: extractTags(title, desc),
        category: categorizeEvent(title, desc, source.category),
        relevanceScore: calculateRelevanceScore(title, desc),
        trustScore: source.trustScore,
        status: getStatusForSource(source.name),
        priority: 'medium',
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error(`Error scraping iCal ${source.name}:`, error.message);
  }
  return events;
}

// ================================================================
// Eventbrite API scraper (for known QTIPOC+ organizations)
// ================================================================

async function scrapeEventbriteAPI(): Promise<ScrapedEvent[]> {
  if (!EVENTBRITE_API_TOKEN) {
    console.log('  Eventbrite API token not configured, skipping API scraping');
    return [];
  }

  const events: ScrapedEvent[] = [];

  for (const org of EVENTBRITE_ORGS) {
    try {
      const url = `https://www.eventbriteapi.com/v3/organizations/${org.id}/events/?` +
        `status=live,started&order_by=start_asc&expand=organizer,venue,ticket_availability`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`  Eventbrite rate limited for ${org.name}, skipping`);
          continue;
        }
        throw new Error(`Eventbrite API ${response.status} for ${org.name}`);
      }

      const data = await response.json();
      const apiEvents = data.events || [];

      for (const ev of apiEvents) {
        const title = ev.name?.text || '';
        // Eventbrite removed `description` from Event objects (March 2021).
        // Use `summary` as fallback. Full description requires separate API call
        // to /v3/events/:id/description/ which we skip to stay within rate limits.
        const description = ev.description?.text || ev.summary?.text || ev.summary || '';
        if (!title) continue;

        const location = ev.online_event
          ? 'Online Event'
          : ev.venue
            ? `${ev.venue.name}, ${ev.venue.address?.city || ''}`
            : 'TBD';

        events.push({
          id: generateEventId('eventbrite_api', ev.url || title),
          title: cleanText(title),
          description: cleanText(description),
          url: ev.url || '',
          source: `Eventbrite API - ${org.name}`,
          sourceId: 'eventbrite_api',
          date: parseEventDate(ev.start?.utc),
          end_date: ev.end?.utc ? parseEventDate(ev.end.utc) : null,
          start_time: extractTime(ev.start?.utc),
          end_time: ev.end?.utc ? extractTime(ev.end.utc) : null,
          location,
          organizer: ev.organizer?.name || org.name,
          cost: ev.ticket_availability?.is_free ? 'Free' : 'See link',
          tags: extractTags(title, description),
          category: categorizeEvent(title, description, 'community'),
          relevanceScore: calculateRelevanceScore(title, description),
          trustScore: 0.95,
          status: getStatusForSource(`Eventbrite API - ${org.name}`),
          priority: 'high',
          scrapedAt: new Date().toISOString(),
        });
      }

      console.log(`  Eventbrite API (${org.name}): ${apiEvents.length} events found`);
      await delay(1000);
    } catch (error: any) {
      console.error(`  Eventbrite API error (${org.name}):`, error.message);
    }
  }

  return events;
}

// ================================================================
// Outsavvy API scraper
// ================================================================

async function scrapeOutsavvyAPI(): Promise<ScrapedEvent[]> {
  if (!OUTSAVVY_API_KEY) {
    console.log('  Outsavvy API key not configured, skipping');
    return [];
  }

  const events: ScrapedEvent[] = [];
  const seenIds = new Set<string>();

  for (const strategy of OUTSAVVY_SEARCHES) {
    for (const city of strategy.cities) {
      try {
        const coords = CITY_COORDS[city] || CITY_COORDS['London'];
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const url = `https://api.outsavvy.com/v1/events/search?` +
          `q=${encodeURIComponent(strategy.query)}&` +
          `latitude=${coords.lat}&longitude=${coords.lng}&range=10&` +
          `start_date=${startDate}&end_date=${endDate}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Partner ${OUTSAVVY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            await delay(5000);
            continue;
          }
          continue; // Skip silently on other errors
        }

        const data = await response.json();
        const apiEvents = data.events || [];

        for (const ev of apiEvents) {
          if (seenIds.has(ev.id)) continue;
          seenIds.add(ev.id);

          const title = ev.title || '';
          const description = ev.description || '';
          const location = ev.venue
            ? `${ev.venue.name}, ${ev.venue.city}`
            : 'TBD';

          events.push({
            id: generateEventId('outsavvy_api', ev.url || ev.id || title),
            title: cleanText(title),
            description: cleanText(description),
            url: ev.url || '',
            source: 'Outsavvy API',
            sourceId: 'outsavvy_api',
            date: parseEventDate(ev.start_date),
            end_date: ev.end_date ? parseEventDate(ev.end_date) : null,
            location,
            organizer: ev.organizer?.name || 'Outsavvy',
            cost: ev.price_info?.is_free ? 'Free' : ev.price_info?.min_price ? `£${ev.price_info.min_price}` : 'See link',
            tags: extractTags(title, description),
            category: categorizeEvent(title, description, 'community'),
            relevanceScore: calculateRelevanceScore(title, description),
            trustScore: 0.8,
            status: getStatusForSource('Outsavvy API'),
            priority: 'medium',
            scrapedAt: new Date().toISOString(),
          });
        }

        await delay(1000);
      } catch (error: any) {
        // Silently continue on individual search failures
      }
    }
  }

  console.log(`  Outsavvy API: ${events.length} events found`);
  return events;
}

// ================================================================
// Deduplication & filtering
// ================================================================

function removeDuplicates(events: ScrapedEvent[]): ScrapedEvent[] {
  const seen = new Map<string, boolean>();
  const unique: ScrapedEvent[] = [];

  for (const event of events) {
    const key = `${event.title.toLowerCase().trim().replace(/\s+/g, ' ')}_${event.date}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(event);
    }
  }
  return unique;
}

function sortByDate(events: ScrapedEvent[]): ScrapedEvent[] {
  return events.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

// ================================================================
// Supabase submission
// ================================================================

async function submitEventsToSupabase(events: ScrapedEvent[]): Promise<{ success: number; skipped: number; failed: number }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase credentials not configured');
    return { success: 0, skipped: 0, failed: 0 };
  }

  const results = { success: 0, skipped: 0, failed: 0 };

  for (const event of events) {
    try {
      // Check for duplicates by URL or title+date
      const checkUrl = event.url
        ? `${SUPABASE_URL}/rest/v1/events?or=(url.eq.${encodeURIComponent(event.url)},and(title.ilike.${encodeURIComponent(event.title)},date.eq.${event.date}))&select=id&limit=1`
        : `${SUPABASE_URL}/rest/v1/events?title.ilike=${encodeURIComponent(event.title)}&date=eq.${event.date}&select=id&limit=1`;

      const checkResponse = await fetch(checkUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (checkResponse.ok) {
        const existing = await checkResponse.json();
        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }
      }

      // Insert event
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          date: event.date,
          end_date: event.end_date,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          organizer: event.organizer,
          cost: event.cost,
          url: event.url,
          source: event.source,
          tags: event.tags,
          status: event.status,
          priority: event.relevanceScore > 0.5 ? 'high' : 'medium',
        }),
      });

      if (!insertResponse.ok) {
        const errorBody = await insertResponse.text();
        console.error(`  Failed to insert "${event.title}": ${insertResponse.status} ${errorBody}`);
        results.failed++;
      } else {
        results.success++;
      }
    } catch (error: any) {
      results.failed++;
      console.error(`  Error submitting "${event.title}":`, error.message);
    }
  }

  return results;
}

// ================================================================
// Main scraping orchestrator
// ================================================================

async function runScraper(): Promise<ScrapeResults> {
  console.log('🎉 Starting comprehensive event scraping for Black LGBTQ+ community');
  console.log(`  Time: ${new Date().toISOString()}`);

  const results: ScrapeResults = {
    totalEvents: 0,
    successfulSources: 0,
    failedSources: 0,
    submittedToSupabase: 0,
    duplicatesSkipped: 0,
    errors: [],
    sourceBreakdown: [],
    timestamp: new Date().toISOString(),
  };

  let allEvents: ScrapedEvent[] = [];

  // 1. Scrape scene-oriented periodicals and civil society sources
  for (const source of SCENE_SOURCES) {
    try {
      console.log(`📅 Scraping ${source.name}...`);
      let events: ScrapedEvent[] = [];

      switch (source.type) {
        case 'rss':
          events = await scrapeRSSFeed(source);
          break;
        case 'jsonld':
          events = await scrapeJSONLDSource(source);
          break;
        case 'ical':
          events = await scrapeICalSource(source);
          break;
      }

      // Filter for UK and minimum relevance
      const relevant = events.filter(e => isUKEvent(e) || e.relevanceScore > 0.2);

      results.sourceBreakdown.push({ source: source.name, found: events.length, relevant: relevant.length });
      allEvents.push(...relevant);

      if (relevant.length > 0) {
        results.successfulSources++;
        console.log(`  ✅ ${source.name}: ${relevant.length} relevant (${events.length} total)`);
      } else {
        console.log(`  ⚠️ ${source.name}: 0 relevant events`);
      }

      await delay(3000);
    } catch (error: any) {
      results.failedSources++;
      results.errors.push({ source: source.name, error: error.message });
      console.error(`  ❌ ${source.name}: ${error.message}`);
    }
  }

  // 2. Eventbrite API (known QTIPOC+ organizations)
  try {
    console.log('📅 Scraping Eventbrite API (known organizations)...');
    const ebEvents = await scrapeEventbriteAPI();
    if (ebEvents.length > 0) {
      allEvents.push(...ebEvents);
      results.successfulSources++;
      results.sourceBreakdown.push({ source: 'Eventbrite API', found: ebEvents.length, relevant: ebEvents.length });
    }
  } catch (error: any) {
    results.errors.push({ source: 'Eventbrite API', error: error.message });
  }

  // 3. Outsavvy API
  try {
    console.log('📅 Scraping Outsavvy API...');
    const osEvents = await scrapeOutsavvyAPI();
    const relevant = osEvents.filter(e => e.relevanceScore > 0.2);
    if (relevant.length > 0) {
      allEvents.push(...relevant);
      results.successfulSources++;
      results.sourceBreakdown.push({ source: 'Outsavvy API', found: osEvents.length, relevant: relevant.length });
    }
  } catch (error: any) {
    results.errors.push({ source: 'Outsavvy API', error: error.message });
  }

  // Deduplicate and sort
  allEvents = removeDuplicates(allEvents);
  allEvents = sortByDate(allEvents);
  results.totalEvents = allEvents.length;

  console.log(`🎯 Scraping complete: ${results.totalEvents} unique events from ${results.successfulSources} sources`);

  // Submit to Supabase
  if (allEvents.length > 0) {
    console.log(`📤 Submitting ${allEvents.length} events to Supabase...`);
    const submission = await submitEventsToSupabase(allEvents);
    results.submittedToSupabase = submission.success;
    results.duplicatesSkipped = submission.skipped;
    console.log(`  ✅ Submitted: ${submission.success}, Skipped duplicates: ${submission.skipped}, Failed: ${submission.failed}`);
  }

  return results;
}

// Export the scraper function for use by the scheduler
export { runScraper };

// ================================================================
// API Handler
// ================================================================

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth: require secret for POST (manual trigger), allow GET for status only
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace('Bearer ', '') || req.body?.secret;

    if (SCRAPER_SECRET && providedSecret !== SCRAPER_SECRET) {
      return res.status(401).json({ error: 'Unauthorized. Provide SCRAPER_SECRET.' });
    }

    try {
      const results = await runScraper();
      return res.status(200).json({ success: true, ...results });
    } catch (error: any) {
      console.error('Scraper error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'GET') {
    // GET returns source configuration and status (no scraping)
    return res.status(200).json({
      status: 'ready',
      sources: SCENE_SOURCES.map(s => ({ name: s.name, type: s.type, category: s.category })),
      eventbriteAPI: EVENTBRITE_API_TOKEN ? 'configured' : 'not configured',
      outsavvyAPI: OUTSAVVY_API_KEY ? 'configured' : 'not configured',
      supabase: SUPABASE_URL ? 'configured' : 'not configured',
      usage: 'POST /api/scrape-events with Authorization: Bearer <SCRAPER_SECRET> to trigger scraping',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
