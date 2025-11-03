import { Event } from '../types';

// Jina AI configuration
const JINA_SEARCH_API = 'https://s.jina.ai/';
const JINA_READER_API = 'https://r.jina.ai/';
const JINA_EMBEDDINGS_API = 'https://api.jina.ai/v1/embeddings';

interface JinaSearchResponse {
  data: Array<{
    url: string;
    title: string;
    content: string;
    description: string;
  }>;
}

interface ScrapingTask {
  source: string;
  priority: number;
  cost: number;
  query: string;
  domains?: string[];
}

interface CommunityIntelligence {
  trendingTopics: string[];
  emergingOrganizers: string[];
  locationHotspots: { location: string; count: number }[];
  accessibilityScore: number;
}

export class JinaAIScrapingService {
  private apiKey: string;
  private dailyBudget: number = 100;
  private usedBudget: number = 0;
  private cache = new Map<string, any>();
  
  constructor(apiKey?: string) {
    // Try multiple ways to get API key, including localStorage for development
    this.apiKey = apiKey ||
                  localStorage.getItem('JINA_AI_API_KEY') ||
                  import.meta.env?.VITE_JINA_API_KEY ||
                  '';
    
    console.log('Jina AI Service initialized:', this.apiKey ? 'API key configured' : 'Running in development mode with mock data');
    
    // Show helper message for setting API key in development
    if (!this.apiKey) {
      console.log('💡 To use live Jina AI integration, set API key in browser console:');
      console.log('localStorage.setItem("JINA_AI_API_KEY", "your_api_key_here")');
      console.log('Then refresh the page. For now, using enhanced mock data.');
    }
    
    this.resetDailyBudget();
  }

  private resetDailyBudget() {
    // Reset budget daily
    const lastReset = localStorage.getItem('jina-budget-reset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      this.usedBudget = 0;
      localStorage.setItem('jina-budget-reset', today);
      localStorage.setItem('jina-used-budget', '0');
    } else {
      this.usedBudget = parseInt(localStorage.getItem('jina-used-budget') || '0');
    }
  }

  private trackAPIUsage(cost: number) {
    this.usedBudget += cost;
    localStorage.setItem('jina-used-budget', this.usedBudget.toString());
  }

  private canAfford(cost: number): boolean {
    return (this.usedBudget + cost) <= this.dailyBudget;
  }

  // Generate content hash for deduplication
  private generateEventHash(title: string, date: string, location: string): string {
    const key = `${title}-${date}-${location}`.toLowerCase().replace(/\s+/g, '-');
    return btoa(key).replace(/[+/=]/g, '');
  }

  // Reader-first approach: Extract from known QTIPOC+ event sources
  async quickDiscovery(): Promise<Event[]> {
    console.log('🚀 Starting quickDiscovery...');
    
    if (!this.canAfford(15)) {
      console.log('Daily budget exhausted, using cached results');
      return this.getCachedEvents();
    }

    // Start with just one reliable source for debugging
    const sourceUrl = 'https://www.eventbrite.co.uk/cc/bpoc-events-4056573';
    const discoveredEvents: Event[] = [];

    try {
      console.log(`🔍 Extracting events from: ${sourceUrl}`);
      const events = await this.extractEventsFromSource(sourceUrl);
      console.log(`📋 Raw extraction returned ${events.length} events`);
      
      if (events.length === 0) {
        console.log('❌ No events extracted, returning demo events');
        return this.generateDemoEvents();
      }
      
      // Filter for relevance
      const relevantEvents: Event[] = [];
      for (const event of events) {
        const isRelevant = await this.isQTIPOCRelevant(event);
        console.log(`🔍 Event "${event.name}": ${isRelevant ? '✅ Relevant' : '❌ Not relevant'}`);
        if (isRelevant) {
          relevantEvents.push(event);
        }
      }
      
      console.log(`✅ Discovery completed: ${relevantEvents.length} relevant events found`);
      
      if (relevantEvents.length === 0) {
        console.log('No relevant events found, returning demo events');
        return this.generateDemoEvents();
      }
      
      return relevantEvents;
        
    } catch (error) {
      console.error(`❌ Error in quickDiscovery:`, error);
      console.log('Returning demo events due to error');
      return this.generateDemoEvents();
    }
  }

  // Extract events from a known event listing page using Reader API
  private async extractEventsFromSource(sourceUrl: string): Promise<Event[]> {
    if (!this.apiKey) {
      console.warn('Jina AI API key not configured, returning mock events');
      return [this.getMockEventFromUrl(sourceUrl)];
    }

    this.trackAPIUsage(3); // Reader API cost for source page

    try {
      const response = await fetch(JINA_READER_API + encodeURIComponent(sourceUrl), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Return-Format': 'markdown',
          'X-Remove-Selector': 'nav, footer, .ads, .sidebar, .header, .cookies',
          'X-Target-Selector': '.event-card, .event-item, [data-event], .search-result',
          'X-Timeout': '30'
        }
      });

      if (!response.ok) {
        throw new Error(`Jina Reader API error: ${response.status}`);
      }

      const markdown = await response.text();
      return this.parseEventsFromMarkdown(markdown, sourceUrl);
    } catch (error) {
      console.error('Error extracting events from source:', error);
      return [];
    }
  }

  // Parse multiple events from a source page markdown
  private parseEventsFromMarkdown(markdown: string, sourceUrl: string): Event[] {
    const events: Event[] = [];
    
    // Look for event patterns in the markdown - simplified for better matching
    const eventPatterns = [
      // Simple header patterns (most reliable)
      /^### (.+)$/gm,
      /^## (.+)$/gm,
      /^# (.+)$/gm,
      // Bold patterns
      /\*\*(.+?)\*\*/g,
      // Link patterns
      /\[([^\]]+)\]\([^)]+\)/g
    ];

    let eventCount = 0;
    for (const pattern of eventPatterns) {
      let match;
      while ((match = pattern.exec(markdown)) !== null && eventCount < 10) {
        try {
          const event = this.createEventFromMatch(match, sourceUrl);
          if (event) {
            events.push(event);
            eventCount++;
          }
        } catch (error) {
          console.error('Error creating event from match:', error);
        }
      }
    }

    console.log(`Parsed ${events.length} events from markdown`);
    return events;
  }

  // Create an event object from a regex match
  private createEventFromMatch(match: RegExpMatchArray, sourceUrl: string): Event | null {
    const title = match[1]?.trim();
    if (!title || title.length < 10) return null;

    // Generate a future date for the event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 60) + 7); // 7-67 days in future

    const event: Event = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: title,
      description: `${title}. Discovered from ${sourceUrl}. Full details available at source.`,
      event_date: futureDate.toISOString(),
      location: this.inferLocationFromSource(sourceUrl),
      source: this.inferSource(sourceUrl),
      source_url: match[2] || sourceUrl,
      organizer_name: this.inferOrganizerFromSource(sourceUrl),
      tags: this.extractTagsFromTitle(title),
      status: 'draft' as const,
      price: 'TBD',
      scraped_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return event;
  }

  // Helper methods for event creation
  private inferLocationFromSource(sourceUrl: string): string {
    if (sourceUrl.includes('london')) return 'London, UK';
    if (sourceUrl.includes('manchester')) return 'Manchester, UK';
    if (sourceUrl.includes('birmingham')) return 'Birmingham, UK';
    return 'UK';
  }

  private inferOrganizerFromSource(sourceUrl: string): string {
    if (sourceUrl.includes('eventbrite')) return 'Eventbrite Community';
    if (sourceUrl.includes('outsavvy')) return 'Outsavvy Community';
    if (sourceUrl.includes('meetup')) return 'Meetup Community';
    return 'Community Organizer';
  }

  /**
   * Extract location from event title patterns
   * Handles formats like:
   * - "Event @ Venue, City"
   * - "Event | Date @ Location"
   * - "Event Tickets | Date @ Venue, City | Price | Platform"
   */
  private extractLocationFromTitle(title: string): string | null {
    // Pattern 1: @ Location format (most common)
    // Matches: "Event @ Venue, City" or "Event @ Location"
    const atPattern = /@\s*([^|]+?)(?:\s*\||$)/;
    const atMatch = title.match(atPattern);
    if (atMatch) {
      let location = atMatch[1].trim();

      // Clean up common platform names from location
      location = location
        .replace(/\s*(Eventbrite|OutSavvy|Meetup|Tickets)\s*$/i, '')
        .trim();

      // Only return if we have a meaningful location (not just "Tickets" or platform name)
      if (location.length > 3 && !location.match(/^(Tickets?|TBD|TBA)$/i)) {
        return location;
      }
    }

    // Pattern 2: Pipe-separated with @ symbol
    // Matches: "Title | Date @ Location, Details"
    const pipeAtPattern = /\|\s*[^|]*?@\s*([^|]+?)(?:\s*\||$)/;
    const pipeAtMatch = title.match(pipeAtPattern);
    if (pipeAtMatch) {
      let location = pipeAtMatch[1].trim();
      location = location
        .replace(/\s*(Eventbrite|OutSavvy|Meetup|Tickets)\s*$/i, '')
        .trim();

      if (location.length > 3 && !location.match(/^(Tickets?|TBD|TBA)$/i)) {
        return location;
      }
    }

    // Pattern 3: UK postcode detection
    // Matches postcodes like "SW1A 1AA", "EC1A 1BB", "W1D 3QU"
    const postcodePattern = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/;
    const postcodeMatch = title.match(postcodePattern);
    if (postcodeMatch) {
      // Extract context around postcode (up to 30 chars before)
      const postcodeIndex = title.indexOf(postcodeMatch[0]);
      const contextStart = Math.max(0, postcodeIndex - 30);
      const context = title.substring(contextStart, postcodeIndex + postcodeMatch[0].length);

      // Try to find venue name before postcode
      const venueMatch = context.match(/([^,|@]+),?\s*$/);
      if (venueMatch) {
        return `${venueMatch[1].trim()}, ${postcodeMatch[0]}`;
      }

      return postcodeMatch[0];
    }

    // Pattern 4: Major UK cities
    const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh',
                    'Liverpool', 'Bristol', 'Sheffield', 'Newcastle', 'Brighton', 'Cardiff'];
    const cityPattern = new RegExp(`\\b(${cities.join('|')})\\b`, 'i');
    const cityMatch = title.match(cityPattern);
    if (cityMatch) {
      // Try to get venue name before city
      const cityIndex = title.indexOf(cityMatch[0]);
      const beforeCity = title.substring(Math.max(0, cityIndex - 40), cityIndex);

      // Look for venue patterns like "at Venue," or "@ Venue,"
      const venueMatch = beforeCity.match(/(?:at|@)\s+([^,|@]+?)(?:,\s*)?$/i);
      if (venueMatch) {
        return `${venueMatch[1].trim()}, ${cityMatch[0]}`;
      }

      return cityMatch[0];
    }

    // Pattern 5: "in [Location]" or "at [Location]"
    const inAtPattern = /(?:in|at)\s+([A-Z][a-zA-Z\s]+?)(?:\s*[,|]|$)/;
    const inAtMatch = title.match(inAtPattern);
    if (inAtMatch) {
      const location = inAtMatch[1].trim();
      if (location.length > 3 && !location.match(/^(Tickets?|TBD|TBA)$/i)) {
        return location;
      }
    }

    return null;
  }

  private extractTagsFromTitle(title: string): string[] {
    const qtipocKeywords = [
      // Q - Queer umbrella
      'queer', 'lgbtq', 'lgbt', 'lesbian', 'gay', 'bisexual', 'pansexual', 'asexual',
      
      // T - Trans and gender diverse
      'trans', 'transgender', 'non-binary', 'nonbinary', 'genderqueer', 'gender fluid',
      
      // I - Intersex
      'intersex',
      
      // POC - People of Colour (disaggregated)
      'poc', 'people of colour', 'people of color', 'bipoc', 'bpoc',
      'black', 'african', 'caribbean', 'afro', 'melanin',
      'asian', 'south asian', 'east asian', 'chinese', 'indian', 'pakistani', 'bangladeshi',
      'middle eastern', 'arab', 'persian', 'mixed heritage', 'mixed race', 'multiracial',
      'latin', 'latino', 'latina', 'hispanic', 'indigenous',
      
      // Community and activism terms
      'community', 'healing', 'justice', 'liberation', 'empowerment',
      'arts', 'wellness', 'workshop', 'celebration', 'pride', 'activism', 'solidarity',
      'safe space', 'inclusive', 'diversity', 'intersectional'
    ];

    const lowerTitle = title.toLowerCase();
    return qtipocKeywords.filter(keyword => lowerTitle.includes(keyword));
  }

  // Simple deduplication based on title similarity
  private deduplicateEventsList(events: Event[]): Event[] {
    const unique: Event[] = [];
    const seenTitles = new Set<string>();

    for (const event of events) {
      const normalizedTitle = event.name.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        unique.push(event);
      }
    }

    return unique;
  }

  // Parse search results from text format
  private parseSearchResults(text: string): JinaSearchResponse['data'] {
    const results: JinaSearchResponse['data'] = [];
    
    // Find all numbered entries like [1] Title:, [2] Title:, etc.
    const entryPattern = /\[(\d+)\]\s*Title:\s*(.+?)(?:\n|\r)/g;
    let match;
    
    while ((match = entryPattern.exec(text)) !== null) {
      const entryNum = match[1];
      const title = match[2].trim();
      
      // Find the corresponding URL and Description for this entry number
      const urlPattern = new RegExp(`\\[${entryNum}\\]\\s*URL Source:\\s*(.+?)(?:\\n|\\r|$)`, 'i');
      const descPattern = new RegExp(`\\[${entryNum}\\]\\s*Description:\\s*(.+?)(?:\\n|\\r|$)`, 'i');
      
      const urlMatch = text.match(urlPattern);
      const descMatch = text.match(descPattern);
      
      if (title && urlMatch && descMatch) {
        const url = urlMatch[1].trim();
        const description = descMatch[1].trim();
        
        results.push({
          title,
          url,
          description,
          content: `${title} - ${description}` // Combine title and description as content
        });
        
        console.log(`Parsed event ${entryNum}: ${title}`);
      }
    }
    
    console.log(`Parsed ${results.length} events from search results`);
    return results;
  }

  // Search for events using Jina Search API
  private async searchEvents(query: string, domains: string[] = []): Promise<JinaSearchResponse['data']> {
    if (!this.apiKey) {
      console.warn('Jina AI API key not configured, using mock data');
      return this.getMockSearchResults(query);
    }

    this.trackAPIUsage(4); // Search API cost

    const searchBody = {
      q: query,
      ...(domains.length > 0 && { site: domains.join(' OR site:') })
    };

    try {
      const response = await fetch(JINA_SEARCH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Locale': 'UK',
          'X-Return-Format': 'json',
          'X-Timeout': '30'
        },
        body: JSON.stringify(searchBody)
      });

      if (!response.ok) {
        throw new Error(`Jina Search API error: ${response.status}`);
      }

      const textResult = await response.text();
      return this.parseSearchResults(textResult);
    } catch (error) {
      console.error('Jina Search API error:', error);
      return this.getMockSearchResults(query);
    }
  }

  // Extract structured event data using Jina Reader API
  private async extractEventDetails(url: string): Promise<Event | null> {
    if (!this.apiKey) {
      return this.getMockEventFromUrl(url);
    }

    this.trackAPIUsage(2); // Reader API cost

    try {
      const response = await fetch(JINA_READER_API + encodeURIComponent(url), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Target-Selector': '.event-details, .event-info, [data-event], .event-content',
          'X-Return-Format': 'markdown',
          'X-Remove-Selector': 'nav, footer, .ads, .sidebar, .comments',
          'X-Wait-For-Selector': '.event-title, h1, .title',
          'X-Timeout': '30'
        }
      });

      if (!response.ok) {
        throw new Error(`Jina Reader API error: ${response.status}`);
      }

      const markdown = await response.text();
      return this.parseEventFromMarkdown(markdown, url);
    } catch (error) {
      console.error('Jina Reader API error:', error);
      return this.getMockEventFromUrl(url);
    }
  }

  // Parse event data from extracted markdown
  private parseEventFromMarkdown(markdown: string, sourceUrl: string): Event | null {
    try {
      // Extract event title
      const titleMatch = markdown.match(/^#\s*(.+)$/m) || markdown.match(/\*\*(.+)\*\*/);
      const title = titleMatch?.[1]?.trim() || 'Community Event';

      // Extract date patterns
      const datePatterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
      ];

      let eventDate = new Date();
      for (const pattern of datePatterns) {
        const match = markdown.match(pattern);
        if (match) {
          eventDate = new Date(match[0]);
          break;
        }
      }

      // Extract time
      const timeMatch = markdown.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
      if (timeMatch) {
        eventDate.setHours(
          parseInt(timeMatch[1]) + (timeMatch[3]?.toLowerCase() === 'pm' && parseInt(timeMatch[1]) < 12 ? 12 : 0),
          parseInt(timeMatch[2])
        );
      }

      // Extract location - enhanced with title parsing
      const locationPatterns = [
        /Location[:\s]+(.+?)(?:\n|$)/i,
        /Venue[:\s]+(.+?)(?:\n|$)/i,
        /Address[:\s]+(.+?)(?:\n|$)/i,
        /Where[:\s]+(.+?)(?:\n|$)/i
      ];

      let location = 'Location TBA';

      // First try explicit location fields
      for (const pattern of locationPatterns) {
        const match = markdown.match(pattern);
        if (match) {
          location = match[1].trim();
          break;
        }
      }

      // If no explicit location, try to extract from title
      if (location === 'Location TBA') {
        location = this.extractLocationFromTitle(title) || 'Location TBA';
      }

      // Extract organizer
      const organizerPatterns = [
        /Organiz(?:er|ed by)[:\s]+(.+?)(?:\n|$)/i,
        /Host(?:ed by)?[:\s]+(.+?)(?:\n|$)/i,
        /By[:\s]+(.+?)(?:\n|$)/i
      ];

      let organizer = 'Community Organizer';
      for (const pattern of organizerPatterns) {
        const match = markdown.match(pattern);
        if (match) {
          organizer = match[1].trim();
          break;
        }
      }

      // Extract price
      const priceMatch = markdown.match(/(?:Price|Cost|Fee)[:\s]*£?(\d+(?:\.\d{2})?)|Free|Donation/i);
      const price = priceMatch ? (priceMatch[0].toLowerCase().includes('free') ? 'Free' : `£${priceMatch[1]}`) : 'TBD';

      // Extract description (first meaningful paragraph)
      const paragraphs = markdown.split('\n\n').filter(p => p.trim().length > 50);
      const description = paragraphs[0]?.substring(0, 300) || 'Community event details to be confirmed.';

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: title,
        description,
        event_date: eventDate.toISOString(),
        location,
        source: this.inferSource(sourceUrl),
        source_url: sourceUrl,
        organizer_name: organizer,
        tags: this.extractTags(markdown),
        status: 'draft' as const,
        price,
        scraped_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing event from markdown:', error);
      return null;
    }
  }

  // Extract relevant tags from content
  private extractTags(content: string): string[] {
    const qtipocKeywords = [
      'black', 'qtipoc', 'queer', 'trans', 'transgender', 'lgbtq', 'lgbt',
      'poc', 'people of colour', 'bipoc', 'community', 'healing', 'justice',
      'arts', 'wellness', 'workshop', 'celebration', 'pride', 'activism'
    ];

    const lowerContent = content.toLowerCase();
    return qtipocKeywords.filter(keyword => lowerContent.includes(keyword));
  }

  // Infer source platform from URL
  private inferSource(url: string): 'eventbrite' | 'facebook' | 'outsavvy' | 'meetup' | 'community' {
    if (url.includes('eventbrite')) return 'eventbrite';
    if (url.includes('facebook')) return 'facebook';
    if (url.includes('outsavvy')) return 'outsavvy';
    if (url.includes('meetup')) return 'meetup';
    return 'community';
  }

  // Check if event is relevant to QTIPOC+ community
  private async isQTIPOCRelevant(event: Event): Promise<boolean> {
    const relevanceKeywords = [
      // High-value QTIPOC terms
      'qtipoc', 'bpoc', 'bipoc',
      
      // Queer umbrella terms
      'queer', 'lgbtq', 'lgbt', 'lesbian', 'gay', 'bisexual', 'trans', 'transgender',
      
      // People of Colour terms (disaggregated)
      'people of colour', 'people of color', 'poc',
      'black', 'african', 'caribbean', 'afro',
      'asian', 'south asian', 'east asian', 'chinese', 'indian',
      'middle eastern', 'arab', 'mixed heritage', 'mixed race',
      
      // Community terms
      'community', 'inclusive', 'diversity', 'intersectional'
    ];

    const content = `${event.name} ${event.description} ${event.tags?.join(' ')}`.toLowerCase();
    
    // Must contain at least 1 relevance keyword
    const matchCount = relevanceKeywords.filter(keyword => content.includes(keyword)).length;
    
    // Special check for high-value terms that should automatically pass
    const highValueTerms = ['qtipoc', 'bpoc', 'bipoc', 'black lgb', 'black queer', 'queer poc'];
    const hasHighValueTerm = highValueTerms.some(term => content.includes(term));
    
    return matchCount >= 1 || hasHighValueTerm;
  }

  // Cache management
  private cacheEvents(events: Event[]) {
    const cacheKey = `jina-events-${new Date().toDateString()}`;
    localStorage.setItem(cacheKey, JSON.stringify(events));
  }

  private getCachedEvents(): Event[] {
    const cacheKey = `jina-events-${new Date().toDateString()}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }

  // Fallback mock data for development/testing
  private getMockSearchResults(query: string): JinaSearchResponse['data'] {
    return [
      {
        url: 'https://example.com/event/black-trans-joy-workshop',
        title: 'Black Trans Joy Workshop - London',
        content: 'A celebration of Black trans experiences',
        description: 'Join us for an empowering workshop celebrating Black trans joy and resilience'
      },
      {
        url: 'https://example.com/event/qtipoc-poetry-night',
        title: 'QTIPOC Poetry Night - Manchester',
        content: 'Evening of powerful words and community connection',
        description: 'Share your voice at our monthly QTIPOC poetry and spoken word event'
      }
    ];
  }

  // Generate demo events when real discovery fails
  private generateDemoEvents(): Event[] {
    const now = new Date();
    return [
      {
        id: Date.now().toString() + '_demo1',
        name: 'Black QTIPOC+ Writing Workshop (Demo)',
        description: 'A creative writing workshop for Black QTIPOC+ community members. This is a demonstration event showing how the discovery system works.',
        event_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'London LGBTQ+ Community Centre',
        source: 'community' as const,
        source_url: 'https://demo.eventbrite.com/qtipoc-writing',
        organizer_name: 'Demo Community Collective',
        tags: ['demo', 'qtipoc', 'workshop', 'writing', 'black'],
        status: 'draft' as const,
        price: 'Free',
        scraped_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: Date.now().toString() + '_demo2',
        name: 'Trans POC Healing Circle (Demo)',
        description: 'Monthly healing circle for transgender people of colour. Safe space for sharing and mutual support. This is a demonstration event.',
        event_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Online via Zoom',
        source: 'community' as const,
        source_url: 'https://demo.eventbrite.com/trans-poc-healing',
        organizer_name: 'Demo Healing Collective',
        tags: ['demo', 'trans', 'poc', 'healing', 'online'],
        status: 'draft' as const,
        price: 'Donation based',
        scraped_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockEventFromUrl(url: string): Event {
    return {
      id: Date.now().toString(),
      name: 'Mock Community Event',
      description: 'A community event discovered through web scraping',
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'London, UK',
      source: 'community' as const,
      source_url: url,
      organizer_name: 'Community Collective',
      tags: ['community', 'qtipoc', 'workshop'],
      status: 'draft' as const,
      price: 'Free',
      scraped_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Community Intelligence Analytics
  async generateCommunityIntelligence(events: Event[]): Promise<CommunityIntelligence> {
    const trendingTopics = this.analyzeTrendingTopics(events);
    const emergingOrganizers = this.identifyEmergingOrganizers(events);
    const locationHotspots = this.analyzeLocationHotspots(events);
    const accessibilityScore = this.calculateAccessibilityScore(events);

    return {
      trendingTopics,
      emergingOrganizers,
      locationHotspots,
      accessibilityScore
    };
  }

  private analyzeTrendingTopics(events: Event[]): string[] {
    const topicCounts = new Map<string, number>();
    
    events.forEach(event => {
      event.tags?.forEach(tag => {
        topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  }

  private identifyEmergingOrganizers(events: Event[]): string[] {
    const organizerCounts = new Map<string, number>();
    
    events.forEach(event => {
      if (event.organizer_name) {
        organizerCounts.set(event.organizer_name, (organizerCounts.get(event.organizer_name) || 0) + 1);
      }
    });

    return Array.from(organizerCounts.entries())
      .filter(([, count]) => count >= 2) // Emerging = 2+ events
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([organizer]) => organizer);
  }

  private analyzeLocationHotspots(events: Event[]): { location: string; count: number }[] {
    const locationCounts = new Map<string, number>();
    
    events.forEach(event => {
      const location = typeof event.location === 'string' ? event.location : 'Online';
      // Extract city from location
      const city = location.split(',')[0].trim();
      locationCounts.set(city, (locationCounts.get(city) || 0) + 1);
    });

    return Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateAccessibilityScore(events: Event[]): number {
    let accessibleEvents = 0;
    
    events.forEach(event => {
      const content = `${event.description} ${event.price}`.toLowerCase();
      
      // Check for accessibility indicators
      if (content.includes('free') || 
          content.includes('accessible') || 
          content.includes('wheelchair') ||
          content.includes('sliding scale') ||
          content.includes('pay what you can')) {
        accessibleEvents++;
      }
    });

    return events.length > 0 ? (accessibleEvents / events.length) * 100 : 0;
  }

  // Get current API usage statistics
  getUsageStats() {
    return {
      dailyBudget: this.dailyBudget,
      usedBudget: this.usedBudget,
      remainingBudget: this.dailyBudget - this.usedBudget,
      utilizationPercentage: (this.usedBudget / this.dailyBudget) * 100
    };
  }
}

export const jinaAIService = new JinaAIScrapingService();