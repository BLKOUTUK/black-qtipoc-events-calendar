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

// Cities supported for website scraping
const SUPPORTED_CITIES = ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Brighton'];

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

async function scrapeEventPage(url: string): Promise<{ description?: string; location?: string; organizer?: string; date?: string; imageUrl?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BLKOUT-Events-Bot/1.0; +https://events.blkoutuk.cloud)',
        'Accept': 'text/html'
      }
    });
    if (!res.ok) return {};
    const html = await res.text();
    const result: { description?: string; location?: string; organizer?: string; date?: string; imageUrl?: string } = {};

    // Try JSON-LD structured data first
    const jsonLdMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
          const ld = JSON.parse(jsonContent);
          // Match Event and all subtypes (DanceEvent, MusicEvent, SocialEvent, etc.)
          const isEventType = (t: string) => t === 'Event' || t.endsWith('Event') || t === 'Festival';
          const event = (ld['@type'] && isEventType(ld['@type'])) ? ld
            : (Array.isArray(ld) ? ld.find((l: any) => l['@type'] && isEventType(l['@type'])) : null);
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
            if (event.startDate) {
              // JSON-LD startDate can be ISO string or date string
              result.date = event.startDate.split('T')[0]; // Extract YYYY-MM-DD
            }
            if (event.image) {
              const img = typeof event.image === 'string' ? event.image : event.image?.url;
              if (img) result.imageUrl = img;
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

    // Parse request body for parameters
    // city: which city to search (default 'London')
    // limit: max new events to process per call (default 20)
    let city = 'London';
    let limit = 20;
    try {
      const body = await req.json();
      if (body.city && typeof body.city === 'string') city = body.city;
      if (typeof body.limit === 'number') limit = Math.min(body.limit, 50);
    } catch { /* no body or invalid JSON — use defaults */ }

    // Title-based keyword filter for relevant LGBTQ+/Black events
    const TITLE_KEYWORDS = [
      'black', 'queer', 'qtipoc', 'lgbtq', 'lgbtqia', 'trans', 'transgender',
      'pride', 'drag', 'poc', 'bipoc', 'qpoc', 'tbpoc',
      'gay', 'lesbian', 'bisexual', 'dyke', 'nonbinary', 'non-binary',
      'liberation', 'intersectional', 'sapphic',
    ];

    let totalFound = 0;
    let totalRelevant = 0;
    let totalAdded = 0;
    let totalSkippedExisting = 0;
    const errors: string[] = [];

    // Step 1: Fetch the OutSavvy search page for this city
    // The API is no longer returning results, so we scrape the website directly
    const searchUrl = `https://www.outsavvy.com/search?q=queer&location=${encodeURIComponent(city)}`;
    console.log(`Fetching search page: ${searchUrl}`);

    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BLKOUT-Events-Bot/1.0; +https://events.blkoutuk.cloud)',
        'Accept': 'text/html'
      }
    });

    if (!searchRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Search page returned ${searchRes.status}`, events_found: 0, events_added: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const searchHtml = await searchRes.text();

    // Step 2: Extract event URLs and titles from HTML cards
    // Card format: <a href="/event/{id}/{slug}"> ... <img alt="Title"> ... <div class="feature-price">Price</div>
    const cardPattern = /href="(\/event\/\d+\/[^"]+)"[\s\S]*?alt="([^"]+)"[\s\S]*?feature-price">([^<]+)</g;
    const discoveredEvents: { url: string; title: string; price: string }[] = [];
    const seenUrls = new Set<string>();
    let cardMatch;
    while ((cardMatch = cardPattern.exec(searchHtml)) !== null) {
      const eventUrl = `https://www.outsavvy.com${cardMatch[1]}`;
      if (!seenUrls.has(eventUrl)) {
        seenUrls.add(eventUrl);
        discoveredEvents.push({
          url: eventUrl,
          title: decodeHTMLEntities(cardMatch[2].trim()),
          price: cardMatch[3].trim()
        });
      }
    }

    totalFound = discoveredEvents.length;
    console.log(`Found ${totalFound} events on search page`);

    // Step 3: Filter by title keywords
    const relevantEvents = discoveredEvents.filter(e => {
      const lower = e.title.toLowerCase();
      return TITLE_KEYWORDS.some(k => lower.includes(k));
    });
    totalRelevant = relevantEvents.length;
    console.log(`${totalRelevant} match title keywords`);

    // Step 4: Process relevant events (up to limit)
    let processed = 0;
    for (const discovered of relevantEvents) {
      if (processed >= limit) break;

      try {
        // Check if event already exists in database by URL or title
        const { data: existingByUrl } = await supabaseClient
          .from('events')
          .select('id')
          .eq('url', discovered.url)
          .maybeSingle();

        if (existingByUrl) {
          totalSkippedExisting++;
          continue;
        }

        const { data: existingByTitle } = await supabaseClient
          .from('events')
          .select('id')
          .ilike('title', discovered.title)
          .maybeSingle();

        if (existingByTitle) {
          totalSkippedExisting++;
          continue;
        }

        // Step 5: Scrape individual event page for full data (JSON-LD)
        console.log(`Scraping: ${discovered.title}`);
        const pageData = await scrapeEventPage(discovered.url);

        // Build event record from scraped page data
        const description = pageData.description || `${discovered.title}. See OutSavvy link for full details.`;
        const location = pageData.location || 'See OutSavvy listing for venue details';
        const organizer = pageData.organizer || 'Unknown';
        const eventDate = pageData.date; // YYYY-MM-DD from JSON-LD

        if (!eventDate) {
          errors.push(`No date found: ${discovered.title}`);
          processed++;
          continue;
        }

        // Skip past events (recurring events may have original start dates from years ago)
        const today = new Date().toISOString().split('T')[0];
        if (eventDate < today) {
          console.log(`  Skipping past event: ${discovered.title} (${eventDate})`);
          processed++;
          continue;
        }

        // Extract tags from title and description
        const textForTags = `${discovered.title} ${description}`.toLowerCase();
        const tags = ALL_KEYWORDS.filter(k => textForTags.includes(k));
        if (textForTags.includes('workshop') || textForTags.includes('training')) tags.push('workshop');
        if (textForTags.includes('art') || textForTags.includes('creative')) tags.push('arts');
        if (textForTags.includes('music') || textForTags.includes('concert')) tags.push('music');
        if (textForTags.includes('social') || textForTags.includes('networking')) tags.push('social');
        if (textForTags.includes('party') || textForTags.includes('celebration')) tags.push('celebration');
        const uniqueTags = [...new Set(tags)];

        // Parse price
        const cost = discovered.price === 'FREE' ? 'Free'
          : discovered.price.startsWith('Pay What') ? 'Pay What You Can'
          : discovered.price.includes('Sold Out') ? 'Sold Out'
          : discovered.price.includes('Waiting List') ? 'Waitlist'
          : discovered.price;

        // Insert into database
        const { error } = await supabaseClient
          .from('events')
          .insert({
            title: discovered.title,
            description,
            date: eventDate,
            location,
            source: 'OutSavvy',
            url: discovered.url,
            organizer,
            tags: uniqueTags,
            status: 'pending',
            cost,
            source_platform: 'outsavvy',
            discovery_method: 'web_scrape',
          });

        if (!error) {
          totalAdded++;
          console.log(`  ✅ Added: ${discovered.title}`);
        } else {
          errors.push(`Insert failed: ${discovered.title}: ${error.message}`);
        }

        processed++;

        // Rate limit: don't hammer OutSavvy with page scrapes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        errors.push(`Error processing ${discovered.title}: ${(err as Error).message}`);
      }
    }

    // Log the scraping session
    try {
      await supabaseClient
        .from('scraping_logs')
        .insert({
          source: 'outsavvy',
          events_found: totalFound,
          events_added: totalAdded,
          status: errors.length > 0 ? 'partial' : 'success',
          error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
        });
    } catch { /* scraping_logs table may not exist */ }

    return new Response(
      JSON.stringify({
        success: true,
        city,
        events_on_page: totalFound,
        events_matching_keywords: totalRelevant,
        events_already_in_db: totalSkippedExisting,
        events_added: totalAdded,
        limit,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined
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