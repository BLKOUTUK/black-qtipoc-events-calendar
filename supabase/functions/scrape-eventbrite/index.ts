import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  // Category bonuses
  const category = event.category?.name?.toLowerCase() || '';
  const subcategory = event.subcategory?.name?.toLowerCase() || '';
  
  if (category.includes('community') || category.includes('social')) score += 3;
  if (category.includes('arts') || category.includes('culture')) score += 2;
  if (subcategory.includes('lgbtq') || subcategory.includes('diversity')) score += 5;

  return score;
}

function isRelevantEvent(event: EventbriteEvent): boolean {
  const score = calculateRelevanceScore(event);
  return score >= 10; // Minimum threshold for relevance
}

function extractTags(event: EventbriteEvent): string[] {
  const text = `${event.name.text} ${event.description.text}`.toLowerCase();
  const foundKeywords = ALL_KEYWORDS.filter(keyword => text.includes(keyword));
  
  // Add category-based tags
  const tags = [...foundKeywords];
  if (event.category?.name) tags.push(event.category.name.toLowerCase());
  if (event.subcategory?.name) tags.push(event.subcategory.name.toLowerCase());
  
  // Add event type tags based on content analysis
  if (text.includes('workshop') || text.includes('training')) tags.push('workshop');
  if (text.includes('art') || text.includes('creative')) tags.push('arts');
  if (text.includes('music') || text.includes('concert')) tags.push('music');
  if (text.includes('health') || text.includes('wellness')) tags.push('wellness');
  if (text.includes('social') || text.includes('networking')) tags.push('social');
  if (text.includes('support') || text.includes('group')) tags.push('support');
  if (text.includes('celebration') || text.includes('party')) tags.push('celebration');
  
  return [...new Set(tags)]; // Remove duplicates
}

function formatLocation(event: EventbriteEvent): any {
  if (event.online_event) {
    return { type: 'online', name: 'Online Event' };
  }
  
  if (!event.venue) return { type: 'tbd', name: 'Location TBD' };
  
  const { name, address } = event.venue;
  return {
    type: 'physical',
    name: name,
    address: address.address_1 || '',
    city: address.city,
    state: address.region,
    country: address.country,
    formatted: `${name}, ${address.city}, ${address.region}`
  };
}

function formatPrice(event: EventbriteEvent): string {
  if (event.ticket_availability?.is_free) return 'Free';
  if (event.ticket_classes && event.ticket_classes.length > 0) {
    const prices = event.ticket_classes.map(tc => tc.cost.display);
    return prices.join(', ');
  }
  return 'See event page';
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

    const eventbriteToken = Deno.env.get('EVENTBRITE_API_TOKEN');
    if (!eventbriteToken) {
      throw new Error('Eventbrite API token not configured');
    }

    // Enhanced search strategy
    const searchStrategies = [
      // Direct identity searches
      { query: 'black queer', cities: ['New York', 'Los Angeles', 'Chicago', 'Atlanta', 'Oakland'] },
      { query: 'qtipoc', cities: ['Brooklyn', 'San Francisco', 'Washington DC', 'Philadelphia'] },
      { query: 'black trans', cities: ['New York', 'Los Angeles', 'Chicago', 'Atlanta'] },
      { query: 'black lgbtq', cities: ['Oakland', 'Brooklyn', 'Los Angeles', 'Chicago'] },
      
      // Community and values searches
      { query: 'black liberation', cities: ['New York', 'Oakland', 'Chicago', 'Atlanta'] },
      { query: 'racial justice queer', cities: ['San Francisco', 'Brooklyn', 'Los Angeles'] },
      { query: 'intersectional community', cities: ['New York', 'Los Angeles', 'Chicago'] },
      
      // Event type + identity searches
      { query: 'black community workshop', cities: ['New York', 'Los Angeles', 'Oakland'] },
      { query: 'queer poc arts', cities: ['Brooklyn', 'San Francisco', 'Los Angeles'] },
      { query: 'black wellness healing', cities: ['Atlanta', 'Oakland', 'Chicago'] }
    ];
    
    let totalFound = 0;
    let totalAdded = 0;
    let totalRelevant = 0;
    const errors: string[] = [];
    const relevanceScores: number[] = [];

    for (const strategy of searchStrategies) {
      for (const city of strategy.cities) {
        try {
          // Enhanced API call with more fields
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

          for (const event of events) {
            const relevanceScore = calculateRelevanceScore(event);
            relevanceScores.push(relevanceScore);

            if (!isRelevantEvent(event)) continue;
            totalRelevant++;

            // Check if event already exists
            const { data: existingEvent } = await supabaseClient
              .from('events')
              .select('id')
              .eq('source_url', event.url)
              .single();

            if (existingEvent) continue;

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
                    email: `${event.organizer.name.toLowerCase().replace(/\s+/g, '.')}@eventbrite.com`
                  })
                  .select()
                  .single();

                if (newContact) organizerId = newContact.id;
              }
            } catch (contactError) {
              console.warn('Contact creation failed:', contactError);
            }

            // Insert event with enhanced data
            const { error } = await supabaseClient
              .from('events')
              .insert({
                name: event.name.text,
                description: event.description.text || 'No description available',
                event_date: event.start.utc,
                location: formatLocation(event),
                source: 'eventbrite',
                source_url: event.url,
                organizer_id: organizerId,
                organizer_name: event.organizer.name,
                tags: extractTags(event),
                status: 'draft', // All scraped events need review
                image_url: event.logo?.url,
                price: formatPrice(event),
                target_audience: ['black', 'qtipoc', 'community']
              });

            if (!error) {
              totalAdded++;
            } else {
              errors.push(`Failed to insert event ${event.name.text}: ${error.message}`);
            }
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

    // Log the scraping session with enhanced metrics
    await supabaseClient
      .from('scraping_logs')
      .insert({
        source: 'eventbrite',
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
        relevance_rate: totalFound > 0 ? (totalRelevant / totalFound * 100).toFixed(1) + '%' : '0%',
        avg_relevance_score: avgRelevanceScore.toFixed(1),
        search_strategies_used: searchStrategies.length,
        errors: errors.length > 0 ? errors.slice(0, 3) : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});