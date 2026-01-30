import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
// Narrow (Black-specific) + Broad (LGBTQ+ events the community attends)
const SEARCH_STRATEGIES = [
  // Black-specific searches (high relevance)
  { query: 'black queer', cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'] },
  { query: 'qtipoc', cities: ['London', 'Brighton', 'Manchester', 'Bristol'] },
  { query: 'black trans', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
  { query: 'black lgbtq', cities: ['London', 'Bristol', 'Manchester', 'Brighton'] },
  { query: 'black pride', cities: ['London', 'Manchester', 'Birmingham', 'Brighton'] },
  { query: 'black liberation', cities: ['London', 'Manchester', 'Birmingham'] },
  { query: 'racial justice queer', cities: ['London', 'Bristol', 'Manchester'] },
  { query: 'queer poc', cities: ['London', 'Manchester', 'Brighton', 'Bristol'] },
  // Broader LGBTQ+ searches (catch more events, filtered by relevance scoring)
  { query: 'queer', cities: ['London', 'Manchester', 'Birmingham', 'Brighton'] },
  { query: 'lgbtq', cities: ['London', 'Manchester', 'Bristol', 'Brighton'] },
  { query: 'drag', cities: ['London', 'Manchester', 'Brighton'] },
  { query: 'trans community', cities: ['London', 'Manchester', 'Brighton'] },
  { query: 'pride', cities: ['London', 'Manchester', 'Birmingham', 'Brighton', 'Bristol', 'Leeds'] },
  { query: 'queer club night', cities: ['London', 'Manchester', 'Brighton'] },
  { query: 'lgbtq history month', cities: ['London', 'Manchester', 'Birmingham', 'Bristol'] },
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

function extractTags(event: OutsavvyEvent): string[] {
  const text = `${event.title} ${event.description}`.toLowerCase();
  const foundKeywords = ALL_KEYWORDS.filter(keyword => text.includes(keyword));
  
  // Combine with existing tags and categories
  const tags = [...foundKeywords, ...event.tags, ...event.categories];
  
  // Add event type tags
  if (text.includes('workshop') || text.includes('training')) tags.push('workshop');
  if (text.includes('art') || text.includes('creative')) tags.push('arts');
  if (text.includes('music') || text.includes('concert')) tags.push('music');
  if (text.includes('health') || text.includes('wellness')) tags.push('wellness');
  if (text.includes('social') || text.includes('networking')) tags.push('social');
  if (text.includes('support') || text.includes('group')) tags.push('support');
  if (text.includes('celebration') || text.includes('party')) tags.push('celebration');
  
  return [...new Set(tags.map(tag => tag.toLowerCase()))];
}

function formatPrice(event: OutsavvyEvent): string {
  const { price_info } = event;
  if (price_info.is_free) return 'Free';
  
  if (price_info.min_price === price_info.max_price) {
    return `£${price_info.min_price}`;
  } else {
    return `£${price_info.min_price} - £${price_info.max_price}`;
  }
}

// Decode HTML entities in scraped text
function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code)))
    .replace(/&nbsp;/g, ' ');
}

// Scrape an OutSavvy event page for real description and location
// The API often returns boilerplate; the actual page has the real content
const BOILERPLATE_PATTERNS = [
  /track your loved events/i,
  /store your tickets securely/i,
  /outsavvy app/i,
  /get personalised event recommendations/i,
];

function isBoilerplate(text: string): boolean {
  if (!text || text.length < 20) return true;
  return BOILERPLATE_PATTERNS.some(p => p.test(text));
}

async function scrapeEventPage(url: string): Promise<{ description?: string; location?: string; organizer?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BLKOUT-Events-Bot/1.0; +https://events.blkoutuk.cloud)',
        'Accept': 'text/html'
      }
    });
    if (!res.ok) return {};
    const html = await res.text();
    const result: { description?: string; location?: string; organizer?: string } = {};

    // Try JSON-LD structured data first
    const jsonLdMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
          const ld = JSON.parse(jsonContent);
          const event = ld['@type'] === 'Event' ? ld : (Array.isArray(ld) ? ld.find((l: any) => l['@type'] === 'Event') : null);
          if (event) {
            if (event.description && !isBoilerplate(event.description)) {
              result.description = decodeHTMLEntities(event.description.replace(/<[^>]+>/g, '').trim().substring(0, 500));
            }
            if (event.location) {
              const loc = event.location;
              if (typeof loc === 'string') {
                result.location = decodeHTMLEntities(loc);
              } else if (loc.name) {
                const parts = [loc.name];
                if (loc.address) {
                  if (typeof loc.address === 'string') parts.push(loc.address);
                  else if (loc.address.streetAddress) {
                    parts.push(loc.address.streetAddress);
                    if (loc.address.addressLocality) parts.push(loc.address.addressLocality);
                    if (loc.address.postalCode) parts.push(loc.address.postalCode);
                  }
                }
                result.location = decodeHTMLEntities(parts.join(', '))
                  .replace(/^([^,]+), \1,/, '$1,'); // Remove doubled venue name
              }
            }
            if (event.organizer?.name) {
              result.organizer = decodeHTMLEntities(event.organizer.name);
            }
          }
        } catch { /* JSON parse failure, try next block */ }
      }
    }

    // Fallback: try Open Graph meta tags
    if (!result.description) {
      const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                     html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (ogDesc?.[1] && !isBoilerplate(ogDesc[1])) {
        result.description = decodeHTMLEntities(ogDesc[1]).substring(0, 500);
      }
    }

    return result;
  } catch {
    return {};
  }
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

    const outsavvyApiKey = Deno.env.get('OUTSAVVY_API_KEY');
    if (!outsavvyApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Outsavvy API key not configured. Please set OUTSAVVY_API_KEY environment variable.',
          events_found: 0,
          events_added: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let totalFound = 0;
    let totalAdded = 0;
    let totalRelevant = 0;
    let totalSkippedDuplicates = 0;
    const errors: string[] = [];
    const relevanceScores: number[] = [];
    // Track seen events within this run to prevent cross-query duplicates
    const seenEvents = new Set<string>();

    // City coordinates for geo-based search
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'London': { lat: 51.5074, lng: -0.1278 },
      'Manchester': { lat: 53.4808, lng: -2.2426 },
      'Birmingham': { lat: 52.4862, lng: -1.8904 },
      'Bristol': { lat: 51.4545, lng: -2.5879 },
      'Leeds': { lat: 53.8008, lng: -1.5491 },
      'Brighton': { lat: 50.8225, lng: -0.1372 },
    };

    // Search using different strategies
    for (const strategy of SEARCH_STRATEGIES) {
      for (const city of strategy.cities) {
        try {
          const coords = cityCoords[city] || cityCoords['London'];

          // Outsavvy API v1 with geo-based search
          const url = `https://api.outsavvy.com/v1/events/search?` +
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

          for (const event of events) {
            const relevanceScore = calculateRelevanceScore(event);
            relevanceScores.push(relevanceScore);

            if (!isRelevantEvent(event)) continue;
            totalRelevant++;

            // Dedup within this scraper run (same event found across multiple queries)
            const dedupeKey = `${event.title.toLowerCase().trim()}|${event.start_date}`;
            if (seenEvents.has(dedupeKey)) {
              totalSkippedDuplicates++;
              continue;
            }
            seenEvents.add(dedupeKey);

            // Check if event already exists in database (by source_url OR title+date)
            const { data: existingByUrl } = await supabaseClient
              .from('events')
              .select('id')
              .eq('source_url', event.url)
              .maybeSingle();

            if (existingByUrl) continue;

            const { data: existingByTitle } = await supabaseClient
              .from('events')
              .select('id')
              .ilike('title', event.title.trim())
              .eq('date', event.start_date)
              .maybeSingle();

            if (existingByTitle) continue;

            // Create or find organizer contact
            let organizerId = null;
            try {
              const { data: existingContact } = await supabaseClient
                .from('contacts')
                .select('id')
                .eq('name', event.organizer.name)
                .single();

              if (existingContact) {
                organizerId = existingContact.id;
              } else {
                const { data: newContact } = await supabaseClient
                  .from('contacts')
                  .insert({
                    name: event.organizer.name,
                    email: `${event.organizer.name.toLowerCase().replace(/\s+/g, '.')}@outsavvy.com`
                  })
                  .select()
                  .single();

                if (newContact) organizerId = newContact.id;
              }
            } catch (contactError) {
              console.warn('Contact creation failed:', contactError);
            }

            // Scrape the actual event page for real description and location
            // The Outsavvy API often returns boilerplate in the description field
            const eventUrl = event.url || `https://www.outsavvy.com/event/${event.id}`;
            const pageData = await scrapeEventPage(eventUrl);

            // Use page-scraped data first, fall back to API data
            let cleanDescription = pageData.description || '';
            if (!cleanDescription || isBoilerplate(cleanDescription)) {
              // Try API description
              cleanDescription = (event.description || '').trim();
            }
            if (!cleanDescription || isBoilerplate(cleanDescription)) {
              // Last resort: build from metadata
              const parts = [event.title];
              if (event.categories?.length) parts.push(`Categories: ${event.categories.join(', ')}`);
              if (event.tags?.length) parts.push(`Tags: ${event.tags.join(', ')}`);
              cleanDescription = parts.join('. ') + '. See OutSavvy link for full details.';
            }

            // Use page-scraped location first, fall back to API venue data
            let cleanLocation = pageData.location || '';
            if (!cleanLocation || cleanLocation === 'Location TBA') {
              if (event.venue?.name && event.venue?.city) {
                cleanLocation = `${event.venue.name}, ${event.venue.city}`;
                if (event.venue.postcode) cleanLocation += ` ${event.venue.postcode}`;
              } else if (event.venue?.city) {
                cleanLocation = event.venue.city;
              } else if (event.venue?.name) {
                cleanLocation = event.venue.name;
              } else {
                cleanLocation = 'See OutSavvy listing for venue details';
              }
            }

            // Use page-scraped organizer if API didn't provide one
            const cleanOrganizer = pageData.organizer || event.organizer?.name || 'Unknown';

            // Rate limit page scraping (don't hammer OutSavvy)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Insert event with enriched data
            const { error } = await supabaseClient
              .from('events')
              .insert({
                title: event.title,
                description: cleanDescription,
                date: event.start_date,
                location: cleanLocation,
                source: 'OutSavvy',
                source_url: eventUrl,
                url: eventUrl,
                organizer_id: organizerId,
                organizer: cleanOrganizer,
                tags: extractTags(event),
                status: 'pending',
                image_url: event.image_url,
                cost: event.price_info?.is_free ? 'Free' : formatPrice(event)
              });

            if (!error) {
              totalAdded++;
            } else {
              errors.push(`Failed to insert event ${event.title}: ${error.message}`);
            }
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

    // Log the scraping session
    await supabaseClient
      .from('scraping_logs')
      .insert({
        source: 'outsavvy',
        events_found: totalFound,
        events_added: totalAdded,
        status: errors.length > 0 ? 'partial' : 'success',
        error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
      });

    return new Response(
      JSON.stringify({
        success: true,
        events_found: totalFound,
        events_relevant: totalRelevant,
        events_added: totalAdded,
        duplicates_skipped: totalSkippedDuplicates,
        relevance_rate: totalFound > 0 ? (totalRelevant / totalFound * 100).toFixed(1) + '%' : '0%',
        avg_relevance_score: avgRelevanceScore.toFixed(1),
        search_strategies_used: SEARCH_STRATEGIES.length,
        cities_searched: SEARCH_STRATEGIES.reduce((acc, s) => acc + s.cities.length, 0),
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Outsavvy scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        events_found: 0,
        events_added: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});