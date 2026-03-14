/**
 * Tavily-Powered Event Discovery Service
 * Replaces fragile JSON-LD/cheerio scraping with Tavily Search + Extract.
 *
 * Why Tavily beats the old approach:
 * - Renders JavaScript SPAs (QX, DIVA, Time Out all fail with axios)
 * - Returns structured content from any page
 * - Search API finds events across the entire web, not just pre-configured URLs
 * - Extract API pulls full event details from any event page
 *
 * Flow:
 * 1. Search queries → candidate event URLs + snippets
 * 2. Extract full content from promising URLs
 * 3. Parse event fields (date, location, price, organizer)
 * 4. Score relevance using existing Black LGBTQ+ keyword system
 * 5. Deduplicate and submit to Supabase
 */

import axios from 'axios'

// Trusted domains that get auto-approved (aligned with trustedEventSources.ts)
const TRUSTED_DOMAINS = [
  'eventbrite.co.uk', 'eventbrite.com',
  'outsavvy.com',
  'qxmagazine.com',
  'diva-magazine.com',
  'timeout.com',
  'attitude.co.uk',
  'ukblackpride.org.uk',
  'lgbthero.org.uk', 'lgbt.foundation',
  'stonewall.org.uk',
  'genderedintelligence.co.uk',
  'consortium.lgbt',
  'blackoutuk.com', 'blkoutuk.com',
]

function getStatusForUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    if (TRUSTED_DOMAINS.some(d => hostname.includes(d))) return 'approved'
  } catch { /* ignore */ }
  return 'pending'
}

class TavilyEventDiscovery {
  constructor(supabaseClient, options = {}) {
    this.supabase = supabaseClient
    this.apiKey = options.tavilyApiKey || process.env.TAVILY_API_KEY
    this.searchUrl = 'https://api.tavily.com/search'
    this.extractUrl = 'https://api.tavily.com/extract'

    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY is required. Set it in .env or pass as option.')
    }

    // Evidence-based search queries (from analysis of 76 approved events)
    this.searchQueries = [
      // Core identity — highest hit rate
      { query: 'black queer events London 2026', depth: 'advanced' },
      { query: 'QTIPOC events UK 2026', depth: 'advanced' },
      { query: 'black LGBT events UK upcoming', depth: 'advanced' },
      { query: 'black trans events UK 2026', depth: 'basic' },
      { query: 'UK black pride events 2026', depth: 'basic' },

      // Platform-targeted — known high-yield sources
      // Use advanced depth for ticketing sites since extract often fails on them
      { query: 'black queer events', depth: 'advanced', includeDomains: ['eventbrite.co.uk', 'eventbrite.com'] },
      { query: 'black LGBT events', depth: 'advanced', includeDomains: ['eventbrite.co.uk', 'eventbrite.com'] },
      { query: 'QTIPOC events', depth: 'advanced', includeDomains: ['outsavvy.com'] },
      { query: 'black queer events', depth: 'advanced', includeDomains: ['outsavvy.com'] },

      // Organization-specific — known community event producers
      { query: 'UK Black Pride events schedule', depth: 'basic' },
      { query: 'Consortium LGBT events calendar UK', depth: 'basic' },
      { query: 'LGBT Foundation events Manchester', depth: 'basic' },
      { query: 'Gendered Intelligence events London', depth: 'basic' },

      // Thematic — popular categories from approved events
      { query: 'black queer wellness event UK', depth: 'basic' },
      { query: 'QTIPOC writing workshop London', depth: 'basic' },
      { query: 'black queer book club London', depth: 'basic' },
      { query: 'queer people of colour social UK', depth: 'basic' },

      // Regional — expand beyond London
      { query: 'black LGBT events Manchester Birmingham', depth: 'basic' },
      { query: 'black queer events Bristol Brighton Leeds', depth: 'basic' },
    ]

    // Relevance keywords (same as EventScrapingService for consistency)
    this.blackLGBTQKeywords = [
      'black lgbtq', 'black queer', 'black trans', 'black gay', 'black lesbian',
      'qtipoc', 'queer people of color', 'queer people of colour', 'black pride',
      'african lgbtq', 'caribbean lgbtq', 'diaspora',
      'uk black pride', 'blkout', 'black lgbt', 'bame lgbtq', 'poc queer',
      'black queer community', 'black trans community', 'black joy',
    ]

    this.lgbtqKeywords = [
      'lgbtq', 'queer', 'trans', 'gay', 'lesbian', 'pride', 'equality', 'rainbow',
    ]

    this.blackKeywords = [
      'black', 'african', 'caribbean', 'diaspora', 'poc', 'bipoc', 'bame',
    ]

    this.ukLocations = [
      'london', 'manchester', 'birmingham', 'bristol', 'leeds', 'brighton',
      'nottingham', 'liverpool', 'sheffield', 'cardiff', 'edinburgh', 'glasgow',
      'newcastle', 'leicester', 'oxford', 'cambridge', 'southampton',
      'uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain',
    ]

    this.excludeKeywords = [
      'corporate training', 'hr diversity workshop', 'dei compliance',
      'usa only', 'us-based', 'new york', 'los angeles', 'san francisco',
    ]
  }

  /**
   * Main entry point — discover events using Tavily Search + Extract
   */
  async discoverEvents() {
    console.log('🔍 Starting Tavily event discovery...')
    const startTime = Date.now()

    const results = {
      totalEvents: 0,
      successfulQueries: 0,
      failedQueries: 0,
      events: [],
      errors: [],
      extractedUrls: 0,
      timestamp: new Date().toISOString(),
    }

    // Phase 1: Search for event URLs and snippets
    const candidateUrls = new Map() // url → { title, snippet, score }

    for (const searchConfig of this.searchQueries) {
      try {
        const searchResults = await this.tavilySearch(searchConfig)
        results.successfulQueries++

        for (const result of searchResults) {
          if (!candidateUrls.has(result.url)) {
            candidateUrls.set(result.url, {
              title: result.title,
              snippet: result.content,
              searchScore: result.score,
              rawContent: result.raw_content || null,
            })
          }
        }

        console.log(`  ✅ "${searchConfig.query}" → ${searchResults.length} results (${candidateUrls.size} unique URLs total)`)

        // Rate limit between searches
        await this.delay(1500)

      } catch (error) {
        results.failedQueries++
        results.errors.push({ query: searchConfig.query, error: error.message })
        console.error(`  ❌ "${searchConfig.query}" failed: ${error.message}`)
      }
    }

    console.log(`\n📊 Search phase: ${candidateUrls.size} unique URLs from ${results.successfulQueries}/${this.searchQueries.length} queries`)

    // Phase 2: Filter candidates that look like event pages
    const eventUrls = this.filterEventUrls(candidateUrls)
    console.log(`🎯 ${eventUrls.length} URLs look like event pages`)

    // Phase 3: Extract full content from event pages (batch in groups of 5)
    const extractedEvents = []
    const urlBatches = this.batchArray(eventUrls, 5)

    for (let i = 0; i < urlBatches.length; i++) {
      const batch = urlBatches[i]
      try {
        const extracted = await this.tavilyExtract(batch.map(u => u.url))
        results.extractedUrls += extracted.length

        for (const page of extracted) {
          const matchingCandidate = candidateUrls.get(page.url)
          const events = this.parseEventsFromContent(
            page.url,
            page.raw_content,
            matchingCandidate?.title,
            matchingCandidate?.snippet,
          )
          extractedEvents.push(...events)
        }

        console.log(`  📄 Batch ${i + 1}/${urlBatches.length}: extracted ${extracted.length} pages`)
        await this.delay(1000)

      } catch (error) {
        results.errors.push({ batch: i + 1, error: error.message })
        console.error(`  ❌ Extract batch ${i + 1} failed: ${error.message}`)
      }
    }

    // Phase 4: Also parse events directly from search snippets
    // (catches events where extract fails or snippet had enough info)
    for (const [url, data] of candidateUrls) {
      const snippetEvents = this.parseEventsFromContent(url, data.snippet, data.title, data.snippet)
      for (const evt of snippetEvents) {
        // Only add if not already found via extract
        if (!extractedEvents.some(e => this.isSameEvent(e, evt))) {
          extractedEvents.push(evt)
        }
      }
    }

    // Phase 5: Score, filter, deduplicate
    const scoredEvents = extractedEvents
      .map(event => ({
        ...event,
        relevanceScore: this.calculateRelevanceScore(event.title, event.description),
      }))
      .filter(event => event.relevanceScore > 0.15)
      .filter(event => !this.isExcluded(event.title, event.description))
      .filter(event => this.isUKEvent(event))
      .filter(event => this.isFutureEvent(event))

    results.events = this.deduplicateEvents(scoredEvents)
    results.totalEvents = results.events.length

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n🏁 Tavily discovery complete in ${duration}s: ${results.totalEvents} events found`)

    return results
  }

  /**
   * Tavily Search API call
   */
  async tavilySearch(config) {
    const payload = {
      query: config.query,
      search_depth: config.depth || 'basic',
      include_raw_content: config.depth === 'advanced',
      max_results: 10,
      topic: 'general',
    }

    if (config.includeDomains?.length) {
      payload.include_domains = config.includeDomains
    }

    const response = await axios.post(this.searchUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    })

    return response.data.results || []
  }

  /**
   * Tavily Extract API call — get full content from URLs.
   * Some sites (e.g. Eventbrite) block extraction; failed URLs are logged but not fatal.
   */
  async tavilyExtract(urls) {
    if (!urls.length) return []

    const response = await axios.post(this.extractUrl, {
      urls,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 60000,
    })

    const failed = response.data.failed_results || []
    if (failed.length > 0) {
      console.log(`    Extract: ${failed.length} URLs failed (blocked by site)`)
    }

    return response.data.results || []
  }

  /**
   * Filter candidate URLs to those likely containing event info
   */
  filterEventUrls(candidateMap) {
    const eventIndicators = [
      '/event', '/events', '/e/', '/d/',
      'eventbrite', 'outsavvy', 'meetup.com/events',
      'ticketmaster', 'skiddle', 'dice.fm',
      'lgbthero.org.uk/event', 'lgbt.foundation/event',
    ]

    const results = []

    for (const [url, data] of candidateMap) {
      const urlLower = url.toLowerCase()
      const textLower = `${data.title} ${data.snippet}`.toLowerCase()

      // URL pattern match
      const urlIsEvent = eventIndicators.some(p => urlLower.includes(p))

      // Content match — snippet mentions event-like things
      const contentIsEvent = /\b(event|tickets?|register|rsvp|attend|book now|free entry|£\d|join us|when:|date:|venue:|location:)\b/i.test(textLower)

      // Relevance check — does it mention our community?
      const isRelevant = this.calculateRelevanceScore(data.title, data.snippet) > 0.1

      if ((urlIsEvent || contentIsEvent) && isRelevant) {
        results.push({ url, ...data })
      }
    }

    return results
  }

  /**
   * Parse event(s) from extracted page content
   */
  parseEventsFromContent(url, content, titleHint, snippetHint) {
    if (!content && !snippetHint) return []

    const text = content || snippetHint || ''
    const events = []

    // Try to parse as a single event page (most common case)
    const event = this.parseSingleEvent(url, text, titleHint)
    if (event) {
      events.push(event)
      return events
    }

    // If that fails, the page might be a listing — try to split
    // (Skip listing parsing for now; search results already give us individual URLs)

    return events
  }

  /**
   * Parse a single event from page content
   */
  parseSingleEvent(url, text, titleHint) {
    const title = titleHint || this.extractTitle(text)
    if (!title) return null

    // Don't create events from generic pages
    if (title.length < 5 || title.length > 300) return null

    const date = this.extractDate(text)
    const location = this.extractLocation(text)
    const organizer = this.extractOrganizer(text, url)
    const cost = this.extractCost(text)
    const description = this.extractDescription(text, title)

    return {
      title: this.cleanText(title),
      description: this.cleanText(description),
      date,
      start_time: this.extractTime(text),
      location,
      organizer,
      cost,
      url,
      source: `Tavily Discovery (${this.extractDomain(url)})`,
      tags: this.extractTags(title, description),
      category: this.categorizeEvent(title, description),
      status: getStatusForUrl(url),
      priority: 'medium',
      scrapedAt: new Date().toISOString(),
    }
  }

  /**
   * Extract event title from content
   */
  extractTitle(text) {
    if (!text) return null

    // Look for common title patterns
    const patterns = [
      /^#+\s*(.+)/m,                    // Markdown heading
      /^(.{10,120})\n/,                 // First line if reasonable length
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[1].trim()
    }

    return null
  }

  /**
   * Extract date from text — handles many formats
   */
  extractDate(text) {
    if (!text) return null

    const now = new Date()
    const currentYear = now.getFullYear()

    // ISO date: 2026-03-20
    const isoMatch = text.match(/\b(20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))\b/)
    if (isoMatch) return isoMatch[1]

    // UK date: 20/03/2026 or 20-03-2026
    const ukMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})\b/)
    if (ukMatch) {
      const day = ukMatch[1].padStart(2, '0')
      const month = ukMatch[2].padStart(2, '0')
      return `${ukMatch[3]}-${month}-${day}`
    }

    // Natural: "20 March 2026", "March 20, 2026", "20th March 2026"
    const months = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04',
      jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    }

    // "20 March 2026" or "20th March 2026"
    const dmyMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(20\d{2})\b/i)
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0')
      const month = months[dmyMatch[2].toLowerCase()]
      return `${dmyMatch[3]}-${month}-${day}`
    }

    // "March 20, 2026" or "March 20 2026"
    const mdyMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i)
    if (mdyMatch) {
      const month = months[mdyMatch[1].toLowerCase()]
      const day = mdyMatch[2].padStart(2, '0')
      return `${mdyMatch[3]}-${month}-${day}`
    }

    // "20 March" or "20th March" (no year — assume current/next occurrence)
    const dmMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i)
    if (dmMatch) {
      const day = dmMatch[1].padStart(2, '0')
      const month = months[dmMatch[2].toLowerCase()]
      let year = currentYear
      const candidate = new Date(`${year}-${month}-${day}`)
      if (candidate < now) year++
      return `${year}-${month}-${day}`
    }

    // "March 20" (no year)
    const mdMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)
    if (mdMatch) {
      const month = months[mdMatch[1].toLowerCase()]
      const day = mdMatch[2].padStart(2, '0')
      let year = currentYear
      const candidate = new Date(`${year}-${month}-${day}`)
      if (candidate < now) year++
      return `${year}-${month}-${day}`
    }

    return null
  }

  /**
   * Extract time from text
   */
  extractTime(text) {
    if (!text) return null

    // "7:00 PM", "19:00", "7pm", "7:30pm"
    const time12Match = text.match(/\b(\d{1,2}):?(\d{2})?\s*(am|pm)\b/i)
    if (time12Match) {
      let hours = parseInt(time12Match[1])
      const minutes = time12Match[2] || '00'
      const period = time12Match[3].toLowerCase()
      if (period === 'pm' && hours < 12) hours += 12
      if (period === 'am' && hours === 12) hours = 0
      return `${String(hours).padStart(2, '0')}:${minutes}`
    }

    // "19:00" or "19.00"
    const time24Match = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/)
    if (time24Match) {
      return `${time24Match[1].padStart(2, '0')}:${time24Match[2]}`
    }

    return null
  }

  /**
   * Extract location from text
   */
  extractLocation(text) {
    if (!text) return 'UK'

    const lower = text.toLowerCase()

    if (lower.includes('online') || lower.includes('virtual') || lower.includes('zoom')) {
      return 'Online Event'
    }

    // Look for "Venue:", "Location:", "Where:" patterns — take only the first clean phrase
    const venueMatch = text.match(/(?:venue|location|where|place)\s*[:–—]\s*([A-Z][\w\s'&,.-]{4,60}?)(?:\n|\.|;|\|)/i)
    if (venueMatch) {
      const venue = venueMatch[1].trim().replace(/,\s*$/, '')
      if (venue.length >= 5 && venue.length <= 80) return venue
    }

    // Try to find a UK city and a venue name preceding it
    for (const city of this.ukLocations.slice(0, 15)) {
      const regex = new RegExp(`\\b${city}\\b`, 'i')
      if (regex.test(lower)) {
        // Look for "Venue Name, City" pattern (starts with capital letter, reasonable length)
        const venueInCity = text.match(new RegExp(`([A-Z][A-Za-z0-9\\s'&.-]{3,35}),?\\s*${city}`, 'i'))
        if (venueInCity) {
          const venueName = venueInCity[1].trim()
          // Sanity check: venue shouldn't look like a sentence fragment
          if (!/\b(the|is|a|an|of|in|for|and|with|from|that|this)\s*$/i.test(venueName)) {
            return `${venueName}, ${city.charAt(0).toUpperCase() + city.slice(1)}`
          }
        }
        return city.charAt(0).toUpperCase() + city.slice(1)
      }
    }

    return 'UK'
  }

  /**
   * Extract organizer from text or URL
   */
  extractOrganizer(text, url) {
    if (!text) return this.extractDomain(url)

    // "Organised by", "Hosted by", "by" patterns
    const orgMatch = text.match(/(?:organis(?:ed|er)|hosted?\s+by|presented?\s+by|by)\s*[:–—]?\s*([A-Z][\w\s'&.]{2,50}?)(?:\n|\.|\||,)/i)
    if (orgMatch) return orgMatch[1].trim()

    return this.extractDomain(url)
  }

  /**
   * Extract cost/price from text
   */
  extractCost(text) {
    if (!text) return 'See link'

    const lower = text.toLowerCase()

    if (/\bfree\b/.test(lower) && !/\bfree\s+(?:bar|drink|food)/.test(lower)) {
      return 'Free'
    }

    // £10, £10.00, from £5
    const priceMatch = text.match(/(?:from\s+)?£(\d+(?:\.\d{2})?)/i)
    if (priceMatch) return `£${priceMatch[1]}`

    return 'See link'
  }

  /**
   * Extract description (first meaningful paragraph)
   */
  extractDescription(text, title) {
    if (!text) return 'See event link for details.'

    // Remove the title from the text
    let content = text.replace(title, '').trim()

    // Take first 500 chars of meaningful content
    const sentences = content.split(/[.\n]/).filter(s => s.trim().length > 20)
    const desc = sentences.slice(0, 3).join('. ').trim()

    if (desc.length < 20) return 'See event link for details.'
    if (desc.length > 500) return desc.slice(0, 497) + '...'

    return desc
  }

  /**
   * Calculate relevance score (0-1) for Black LGBTQ+ community
   */
  calculateRelevanceScore(title, description) {
    const text = `${title || ''} ${description || ''}`.toLowerCase()
    let score = 0

    // High: Black LGBTQ+ specific
    for (const kw of this.blackLGBTQKeywords) {
      if (text.includes(kw)) score += 0.35
    }

    // Medium: general LGBTQ+
    for (const kw of this.lgbtqKeywords) {
      if (text.includes(kw)) score += 0.1
    }

    // Medium: Black/POC
    for (const kw of this.blackKeywords) {
      if (text.includes(kw)) score += 0.1
    }

    // Small boost for community/social terms
    const communityTerms = ['community', 'meetup', 'social', 'networking', 'support', 'workshop']
    for (const term of communityTerms) {
      if (text.includes(term)) score += 0.05
    }

    return Math.min(score, 1.0)
  }

  /**
   * Check if event is in the UK
   */
  isUKEvent(event) {
    const text = `${event.location || ''} ${event.title || ''} ${event.description || ''}`.toLowerCase()
    return this.ukLocations.some(loc => text.includes(loc))
  }

  /**
   * Check if event date is in the future (or has no date — keep for manual review)
   */
  isFutureEvent(event) {
    if (!event.date) return true // No date = keep, needs manual review
    try {
      const eventDate = new Date(event.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return eventDate >= today
    } catch {
      return true
    }
  }

  /**
   * Check if event should be excluded
   */
  isExcluded(title, description) {
    const text = `${title || ''} ${description || ''}`.toLowerCase()
    return this.excludeKeywords.some(kw => text.includes(kw))
  }

  /**
   * Extract tags from event content
   */
  extractTags(title, description) {
    const text = `${title || ''} ${description || ''}`.toLowerCase()
    const tags = []

    const tagKeywords = [
      'lgbtq', 'queer', 'trans', 'gay', 'lesbian', 'bisexual', 'pride',
      'black', 'african', 'caribbean', 'diaspora', 'poc', 'bipoc', 'qtipoc',
      'community', 'social', 'networking', 'party', 'club', 'dance',
      'art', 'culture', 'film', 'theatre', 'performance', 'poetry',
      'wellness', 'health', 'mental health', 'support', 'activism',
      'workshop', 'talk', 'discussion', 'brunch', 'dinner',
    ]

    for (const kw of tagKeywords) {
      if (text.includes(kw)) tags.push(kw)
    }

    return [...new Set(tags)]
  }

  /**
   * Categorize event
   */
  categorizeEvent(title, description) {
    const text = `${title || ''} ${description || ''}`.toLowerCase()

    const categories = {
      social: ['meetup', 'social', 'networking', 'brunch', 'dinner', 'picnic'],
      nightlife: ['club', 'party', 'night', 'dance', 'dj', 'rave'],
      culture: ['art', 'exhibition', 'film', 'theatre', 'performance', 'poetry', 'reading', 'book'],
      wellness: ['yoga', 'meditation', 'wellness', 'health', 'support', 'therapy', 'mental health'],
      activism: ['protest', 'march', 'rally', 'workshop', 'training', 'organizing'],
      celebration: ['pride', 'celebration', 'festival', 'carnival', 'anniversary'],
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) return category
    }

    return 'community'
  }

  /**
   * Deduplicate events by title + date similarity
   */
  deduplicateEvents(events) {
    const seen = new Map()
    const unique = []

    for (const event of events) {
      const key = this.normalizeForDedup(event.title, event.date)
      if (!seen.has(key)) {
        seen.set(key, true)
        unique.push(event)
      }
    }

    // Sort by relevance then date
    return unique.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date) - new Date(b.date)
    })
  }

  /**
   * Check if two events are the same
   */
  isSameEvent(a, b) {
    return this.normalizeForDedup(a.title, a.date) === this.normalizeForDedup(b.title, b.date)
  }

  /**
   * Create a dedup key from title and date
   */
  normalizeForDedup(title, date) {
    const normalizedTitle = (title || '').toLowerCase().trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 60)
    return `${normalizedTitle}_${date || 'nodate'}`
  }

  /**
   * Submit discovered events to Supabase
   */
  async submitToSupabase(events) {
    if (!this.supabase) {
      console.error('Supabase client not initialized')
      return { success: 0, skipped: 0, failed: 0, errors: [] }
    }

    const results = { success: 0, skipped: 0, failed: 0, errors: [] }

    for (const event of events) {
      try {
        // Check for existing event by URL or title+date
        const { data: existing } = await this.supabase
          .from('events')
          .select('id')
          .or(`url.eq.${event.url},and(title.ilike.%${event.title.slice(0, 50)}%,date.eq.${event.date})`)
          .limit(1)

        if (existing?.length > 0) {
          results.skipped++
          continue
        }

        const { error } = await this.supabase
          .from('events')
          .insert({
            title: event.title,
            description: event.description,
            date: event.date,
            start_time: event.start_time,
            location: event.location,
            organizer: event.organizer,
            cost: event.cost,
            url: event.url,
            source: event.source,
            tags: event.tags,
            status: event.status,
            priority: event.relevanceScore > 0.5 ? 'high' : 'medium',
          })

        if (error) throw error

        results.success++
        console.log(`  ✅ Added: ${event.title}`)

      } catch (error) {
        results.failed++
        results.errors.push({ event: event.title, error: error.message })
      }
    }

    return results
  }

  // ── Utilities ──

  cleanText(text) {
    if (!text) return ''
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  batchArray(arr, size) {
    const batches = []
    for (let i = 0; i < arr.length; i += size) {
      batches.push(arr.slice(i, i + size))
    }
    return batches
  }
}

export { TavilyEventDiscovery }
export default TavilyEventDiscovery
