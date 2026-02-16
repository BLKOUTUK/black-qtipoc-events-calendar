/**
 * Event Scraping Service
 * Community-focused event discovery for Black LGBTQ+ liberation
 *
 * Targets scene-oriented periodicals and listings platforms:
 * - QX Magazine (JSON-LD structured data + RSS feed)
 * - DIVA Magazine (JSON-LD structured data)
 * - Time Out London LGBTQ+ (JSON-LD structured data)
 * - Attitude Magazine (RSS feed with event keyword filtering)
 * - Eventbrite (for Black LGBTQ+ specific searches)
 *
 * Rationale: Scene publications have higher-density, more relevant
 * LGBTQ+ event listings than generic ticketing platforms.
 */

import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'

// Trusted sources that get auto-approved (match trustedEventSources.ts)
const TRUSTED_SOURCES = [
  'DIVA Magazine Events',
  'Eventbrite UK - LGBTQ+',
  'qxmagazine.com',
  'ukblackpride.org.uk',
  'QX Magazine Events',
  'QX Magazine Feed',
  'stonewall.org.uk',
  'Time Out London LGBTQ+',
  'Attitude Magazine Feed',
  'community-submission',
];

// Sources that need manual review before publishing
const MANUAL_REVIEW_SOURCES = [
  'n8n_automation',
  'research_agent',
  'Web Search',
  'chrome-extension',
  'chrome_extension',
];

/**
 * Determine the correct status for an event based on its source
 * - Trusted sources: 'approved' (auto-publish)
 * - Manual review sources: 'pending' (goes to moderation queue)
 * - Unknown sources: 'pending' (goes to moderation queue)
 */
function getStatusForSource(sourceName) {
  if (TRUSTED_SOURCES.includes(sourceName)) {
    return 'approved';
  }
  // All other sources go to moderation queue for review
  return 'pending';
}

class EventScrapingService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })

    // Scene-oriented periodicals and civil society sources
    this.sources = [
      {
        id: 'qx_magazine_events',
        name: 'QX Magazine Events',
        type: 'jsonld',
        url: 'https://www.qxmagazine.com/events/',
        description: 'London LGBTQ+ scene magazine - comprehensive event listings',
        trustScore: 0.95,
        category: 'nightlife'
      },
      {
        id: 'qx_magazine_rss',
        name: 'QX Magazine Feed',
        type: 'rss',
        url: 'https://www.qxmagazine.com/feed/',
        description: 'QX Magazine RSS - events and editorial content',
        relevanceKeywords: ['event', 'party', 'club', 'bar', 'cabaret', 'theatre', 'pride'],
        trustScore: 0.9,
        category: 'nightlife'
      },
      {
        id: 'diva_magazine_events',
        name: 'DIVA Magazine Events',
        type: 'jsonld',
        url: 'https://www.diva-magazine.com/events/',
        description: 'LGBTQIA+ magazine for women - community events',
        trustScore: 0.95,
        category: 'community'
      },
      {
        id: 'timeout_london_lgbtq',
        name: 'Time Out London LGBTQ+',
        type: 'jsonld',
        url: 'https://www.timeout.com/london/lgbt',
        description: 'Time Out London LGBTQ+ hub - event guides, club nights, bars',
        trustScore: 0.9,
        category: 'nightlife'
      },
      {
        id: 'attitude_magazine_feed',
        name: 'Attitude Magazine Feed',
        type: 'rss',
        url: 'https://www.attitude.co.uk/feed/',
        description: 'Attitude Magazine RSS - UK leading gay magazine, culture and events',
        relevanceKeywords: ['event', 'party', 'club', 'bar', 'cabaret', 'theatre', 'pride', 'festival', 'night', 'gig', 'concert', 'launch', 'awards'],
        trustScore: 0.85,
        category: 'culture'
      },
      {
        id: 'eventbrite_uk_black_lgbtq',
        name: 'Eventbrite - Black LGBTQ+ UK',
        type: 'jsonld',
        baseUrl: 'https://www.eventbrite.com/d/united-kingdom/lgbtq/',
        searchTerms: ['black lgbtq', 'black queer', 'qtipoc', 'uk black pride', 'black gay'],
        description: 'Eventbrite filtered for Black LGBTQ+ specific events',
        trustScore: 0.85,
        category: 'community'
      }
    ]

    // Black LGBTQ+ specific keywords for relevance scoring
    this.blackLGBTQKeywords = [
      'black lgbtq', 'black queer', 'black trans', 'black gay', 'black lesbian',
      'qtipoc', 'queer people of color', 'black pride', 'intersectional',
      'african lgbtq', 'caribbean lgbtq', 'diaspora', 'melanin',
      'uk black pride', 'blkout', 'black lgbt', 'bame lgbtq', 'poc queer',
      'black queer community', 'black trans community', 'black joy',
      'black excellence', 'black liberation', 'black empowerment'
    ]

    // UK location keywords
    this.ukLocations = [
      'london', 'manchester', 'birmingham', 'bristol', 'leeds', 'brighton',
      'nottingham', 'liverpool', 'sheffield', 'cardiff', 'edinburgh', 'glasgow',
      'newcastle', 'leicester', 'oxford', 'cambridge', 'southampton',
      'uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain'
    ]

    // Community-focused event categories
    this.eventCategories = {
      social: ['meetup', 'social', 'networking', 'brunch', 'dinner', 'picnic'],
      nightlife: ['club', 'party', 'night', 'dance', 'dj', 'rave'],
      culture: ['art', 'exhibition', 'film', 'theatre', 'performance', 'poetry', 'reading'],
      wellness: ['yoga', 'meditation', 'wellness', 'health', 'support', 'therapy', 'mental health'],
      activism: ['protest', 'march', 'rally', 'workshop', 'training', 'organizing'],
      celebration: ['pride', 'celebration', 'festival', 'carnival', 'anniversary']
    }
  }

  /**
   * Main scraping method - scrapes all configured sources
   */
  async scrapeAllSources() {
    console.log('🎉 Starting comprehensive event scraping for Black LGBTQ+ community')

    const results = {
      totalEvents: 0,
      successfulSources: 0,
      failedSources: 0,
      events: [],
      errors: [],
      timestamp: new Date().toISOString()
    }

    for (const source of this.sources) {
      try {
        console.log(`📅 Scraping ${source.name}...`)

        let events = []

        switch (source.type) {
          case 'rss':
            events = await this.scrapeRSSFeed(source)
            break
          case 'jsonld':
            events = await this.scrapeJSONLDSource(source)
            break
          case 'ical':
            events = await this.scrapeICalSource(source)
            break
          case 'api':
            events = await this.scrapeAPISource(source)
            break
          case 'web':
            events = await this.scrapeWebSource(source)
            break
        }

        if (events.length > 0) {
          // Filter for UK location and relevance
          const relevantEvents = events.filter(event =>
            this.isUKEvent(event) && event.relevanceScore > 0.2
          )

          results.events.push(...relevantEvents)
          results.successfulSources++

          console.log(`✅ ${source.name}: ${relevantEvents.length} relevant events found (${events.length} total)`)
        } else {
          console.log(`⚠️ ${source.name}: No events found`)
        }

        // Rate limiting - be respectful to sources
        await this.delay(3000)

      } catch (error) {
        results.failedSources++
        results.errors.push({
          source: source.name,
          error: error.message
        })

        console.error(`❌ Failed to scrape ${source.name}:`, error.message)
      }
    }

    // Remove duplicates and sort by date
    results.events = this.removeDuplicates(results.events)
    results.events = this.sortByDate(results.events)
    results.totalEvents = results.events.length

    console.log(`🎯 Scraping complete: ${results.totalEvents} unique events from ${results.successfulSources}/${this.sources.length} sources`)

    return results
  }

  /**
   * Scrape RSS feed source
   */
  async scrapeRSSFeed(source) {
    const events = []

    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'BLKOUT-EventBot/1.0 (https://blkout.org; community@blkoutuk.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: 15000
      })

      const parsed = this.xmlParser.parse(response.data)
      const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || []

      for (const item of (Array.isArray(items) ? items : [items])) {
        // If source has relevanceKeywords, pre-filter items
        if (source.relevanceKeywords && source.relevanceKeywords.length > 0) {
          const itemText = `${item.title || ''} ${item.description || ''} ${item.summary || ''} ${item.content || ''}`.toLowerCase()
          const hasRelevantKeyword = source.relevanceKeywords.some(kw => itemText.includes(kw.toLowerCase()))
          if (!hasRelevantKeyword) continue
        }

        const event = this.parseRSSItem(item, source)
        if (event) {
          events.push(event)
        }
      }

    } catch (error) {
      console.error(`Error scraping RSS ${source.name}:`, error.message)
      throw error
    }

    return events
  }

  /**
   * Parse RSS item into event object
   */
  parseRSSItem(item, source) {
    try {
      const title = this.cleanText(item.title || '')
      const description = this.cleanText(item.description || item.summary || item.content || '')
      const link = item.link?.['@_href'] || item.link || ''

      if (!title) return null

      const event = {
        id: this.generateEventId(source.id, link || title),
        title,
        description,
        url: link,
        source: source.name,
        sourceId: source.id,
        date: this.parseEventDate(item.pubDate || item.published || item.updated),
        location: this.extractLocation(title, description),
        organizer: source.name,
        cost: this.extractCost(title, description),
        tags: this.extractTags(title, description),
        category: this.categorizeEvent(title, description, source.category),
        relevanceScore: this.calculateRelevanceScore(title, description),
        trustScore: source.trustScore,
        status: getStatusForSource(source.name), // Use source classification for moderation routing
        priority: 'medium',
        scrapedAt: new Date().toISOString()
      }

      return event

    } catch (error) {
      console.error('Error parsing RSS item:', error.message)
      return null
    }
  }

  /**
   * Scrape JSON-LD structured data from scene publications
   * Optimized for QX Magazine, DIVA Magazine, etc.
   */
  async scrapeJSONLDSource(source) {
    const events = []

    try {
      // Handle sources with search terms (multiple URLs)
      const urls = source.searchTerms
        ? source.searchTerms.map(term => `${source.baseUrl}?q=${encodeURIComponent(term)}`)
        : [source.url]

      for (const url of urls) {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9'
          },
          timeout: 20000
        })

        // Extract JSON-LD structured data
        const structuredData = this.extractStructuredData(response.data)

        console.log(`  Found ${structuredData.length} JSON-LD event objects from ${url}`)

        for (const eventData of structuredData) {
          const event = this.parseStructuredEvent(eventData, source)
          if (event) {
            events.push(event)
          }
        }

        // Rate limit between URLs
        if (urls.length > 1) {
          await this.delay(2000)
        }
      }

    } catch (error) {
      console.error(`Error scraping JSON-LD source ${source.name}:`, error.message)
      throw error
    }

    return events
  }

  /**
   * Scrape iCal/ICS calendar feeds
   * For sources like Consortium.lgbt Google Calendar integration
   */
  async scrapeICalSource(source) {
    const events = []

    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'BLKOUT-EventBot/1.0 (https://blkout.org; community@blkoutuk.com)',
          'Accept': 'text/calendar, application/calendar+xml'
        },
        timeout: 15000
      })

      // Parse iCal format
      const icalEvents = this.parseICalData(response.data, source)
      events.push(...icalEvents)

    } catch (error) {
      console.error(`Error scraping iCal source ${source.name}:`, error.message)
      throw error
    }

    return events
  }

  /**
   * Parse iCal/ICS data format
   */
  parseICalData(icalString, source) {
    const events = []

    try {
      // Split by VEVENT blocks
      const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g
      let match

      while ((match = veventRegex.exec(icalString)) !== null) {
        const vevent = match[1]

        // Extract fields
        const getValue = (field) => {
          const regex = new RegExp(`^${field}[^:]*:(.*)$`, 'mi')
          const match = vevent.match(regex)
          return match ? match[1].trim() : null
        }

        const title = getValue('SUMMARY')
        if (!title) continue

        const event = {
          id: this.generateEventId(source.id, getValue('UID') || title),
          title: this.cleanICalText(title),
          description: this.cleanICalText(getValue('DESCRIPTION') || ''),
          url: getValue('URL') || '',
          source: source.name,
          sourceId: source.id,
          date: this.parseICalDate(getValue('DTSTART')),
          end_date: this.parseICalDate(getValue('DTEND')),
          location: this.cleanICalText(getValue('LOCATION') || 'TBD'),
          organizer: getValue('ORGANIZER') || source.name,
          cost: 'See link',
          tags: this.extractTags(title, getValue('DESCRIPTION') || ''),
          category: this.categorizeEvent(title, getValue('DESCRIPTION') || '', source.category),
          relevanceScore: this.calculateRelevanceScore(title, getValue('DESCRIPTION') || ''),
          trustScore: source.trustScore,
          status: getStatusForSource(source.name), // Use source classification for moderation routing
          priority: 'medium',
          scrapedAt: new Date().toISOString()
        }

        events.push(event)
      }

    } catch (error) {
      console.error('Error parsing iCal data:', error.message)
    }

    return events
  }

  /**
   * Parse iCal date format (YYYYMMDD or YYYYMMDDTHHMMSS)
   */
  parseICalDate(dateStr) {
    if (!dateStr) return null

    try {
      // Handle YYYYMMDD format
      if (dateStr.length === 8) {
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      }

      // Handle YYYYMMDDTHHMMSS format
      if (dateStr.includes('T')) {
        const datePart = dateStr.split('T')[0]
        return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Clean iCal escaped text
   */
  cleanICalText(text) {
    if (!text) return ''
    return text
      .replace(/\\n/g, ' ')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
      .trim()
  }

  /**
   * Scrape API-based source (Eventbrite, Skiddle, etc.)
   */
  async scrapeAPISource(source) {
    const events = []

    // For now, use web scraping approach for API sources
    // In production, would integrate with actual APIs
    try {
      for (const searchTerm of source.searchTerms) {
        const searchUrl = `${source.baseUrl}?q=${encodeURIComponent(searchTerm)}`

        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml'
          },
          timeout: 15000
        })

        // Extract JSON-LD structured data from page
        const structuredData = this.extractStructuredData(response.data)

        for (const eventData of structuredData) {
          const event = this.parseStructuredEvent(eventData, source)
          if (event) {
            events.push(event)
          }
        }

        await this.delay(2000)
      }

    } catch (error) {
      console.error(`Error scraping API source ${source.name}:`, error.message)
    }

    return events
  }

  /**
   * Scrape web-based source
   */
  async scrapeWebSource(source) {
    const events = []

    try {
      const response = await axios.get(source.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 15000
      })

      // Extract JSON-LD structured data
      const structuredData = this.extractStructuredData(response.data)

      for (const eventData of structuredData) {
        const event = this.parseStructuredEvent(eventData, source)
        if (event) {
          events.push(event)
        }
      }

    } catch (error) {
      console.error(`Error scraping web source ${source.name}:`, error.message)
    }

    return events
  }

  /**
   * Extract JSON-LD structured data from HTML
   */
  extractStructuredData(html) {
    const events = []

    try {
      // Match JSON-LD script tags
      const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
      let match

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(match[1])

          // Handle arrays
          const items = Array.isArray(data) ? data : [data]

          for (const item of items) {
            if (item['@type'] === 'Event' || item['@type']?.includes('Event')) {
              events.push(item)
            }
            // Check for nested events
            if (item.itemListElement) {
              for (const listItem of item.itemListElement) {
                if (listItem.item?.['@type'] === 'Event') {
                  events.push(listItem.item)
                }
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    } catch (error) {
      console.error('Error extracting structured data:', error.message)
    }

    return events
  }

  /**
   * Parse structured event data (JSON-LD)
   */
  parseStructuredEvent(data, source) {
    try {
      const title = data.name || ''
      const description = data.description || ''

      if (!title) return null

      const event = {
        id: this.generateEventId(source.id, data.url || title),
        title: this.cleanText(title),
        description: this.cleanText(description),
        url: data.url || '',
        source: source.name,
        sourceId: source.id,
        date: this.parseEventDate(data.startDate),
        end_date: data.endDate ? this.parseEventDate(data.endDate) : null,
        start_time: this.extractTime(data.startDate),
        end_time: data.endDate ? this.extractTime(data.endDate) : null,
        location: this.parseLocation(data.location),
        organizer: data.organizer?.name || source.name,
        cost: this.parsePrice(data.offers),
        tags: this.extractTags(title, description),
        category: this.categorizeEvent(title, description, source.category),
        relevanceScore: this.calculateRelevanceScore(title, description),
        trustScore: source.trustScore,
        status: getStatusForSource(source.name), // Use source classification for moderation routing
        priority: 'medium',
        scrapedAt: new Date().toISOString()
      }

      return event

    } catch (error) {
      console.error('Error parsing structured event:', error.message)
      return null
    }
  }

  /**
   * Calculate relevance score for Black LGBTQ+ community
   */
  calculateRelevanceScore(title, description) {
    const text = `${title} ${description}`.toLowerCase()
    let score = 0

    // High score for Black LGBTQ+ specific content
    this.blackLGBTQKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 0.35
      }
    })

    // Medium score for general LGBTQ+ content
    const lgbtqTerms = ['lgbtq', 'queer', 'trans', 'gay', 'lesbian', 'pride', 'equality', 'rainbow']
    lgbtqTerms.forEach(term => {
      if (text.includes(term)) {
        score += 0.1
      }
    })

    // Medium score for Black/POC content
    const blackTerms = ['black', 'african', 'caribbean', 'diaspora', 'poc', 'bipoc', 'bame']
    blackTerms.forEach(term => {
      if (text.includes(term)) {
        score += 0.1
      }
    })

    // Boost for community/social events
    const communityTerms = ['community', 'meetup', 'social', 'networking', 'support']
    communityTerms.forEach(term => {
      if (text.includes(term)) {
        score += 0.05
      }
    })

    return Math.min(score, 1.0)
  }

  /**
   * Check if event is in UK
   */
  isUKEvent(event) {
    const locationText = `${event.location || ''} ${event.description || ''}`.toLowerCase()
    return this.ukLocations.some(loc => locationText.includes(loc))
  }

  /**
   * Categorize event based on content
   */
  categorizeEvent(title, description, defaultCategory) {
    const text = `${title} ${description}`.toLowerCase()

    for (const [category, keywords] of Object.entries(this.eventCategories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category
      }
    }

    return defaultCategory || 'community'
  }

  /**
   * Extract tags from event content
   */
  extractTags(title, description) {
    const text = `${title} ${description}`.toLowerCase()
    const tags = []

    const tagKeywords = [
      'lgbtq', 'queer', 'trans', 'gay', 'lesbian', 'bisexual', 'pride',
      'black', 'african', 'caribbean', 'diaspora', 'poc', 'bipoc',
      'community', 'social', 'networking', 'party', 'club', 'dance',
      'art', 'culture', 'film', 'theatre', 'performance', 'poetry',
      'wellness', 'health', 'mental health', 'support', 'activism',
      'workshop', 'talk', 'discussion', 'brunch', 'dinner'
    ]

    tagKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword)
      }
    })

    return [...new Set(tags)]
  }

  /**
   * Extract location from text
   */
  extractLocation(title, description) {
    const text = `${title} ${description}`

    // Try to find UK cities
    for (const city of this.ukLocations.slice(0, 15)) {
      const regex = new RegExp(`\\b${city}\\b`, 'i')
      if (regex.test(text)) {
        return city.charAt(0).toUpperCase() + city.slice(1)
      }
    }

    return 'UK'
  }

  /**
   * Parse location from structured data
   */
  parseLocation(location) {
    if (!location) return 'TBD'
    if (typeof location === 'string') return location

    if (location.name) {
      const parts = [location.name]
      if (location.address?.addressLocality) {
        parts.push(location.address.addressLocality)
      }
      return parts.join(', ')
    }

    if (location.address) {
      return location.address.streetAddress ||
             location.address.addressLocality ||
             'TBD'
    }

    return 'TBD'
  }

  /**
   * Extract cost from text
   */
  extractCost(title, description) {
    const text = `${title} ${description}`.toLowerCase()

    if (text.includes('free') || text.includes('no charge') || text.includes('complimentary')) {
      return 'Free'
    }

    // Look for price patterns
    const priceMatch = text.match(/£(\d+(?:\.\d{2})?)/i)
    if (priceMatch) {
      return `£${priceMatch[1]}`
    }

    return 'See link'
  }

  /**
   * Parse price from structured data offers
   */
  parsePrice(offers) {
    if (!offers) return 'See link'

    const offerList = Array.isArray(offers) ? offers : [offers]

    for (const offer of offerList) {
      if (offer.price === 0 || offer.price === '0') {
        return 'Free'
      }
      if (offer.price) {
        return `£${offer.price}`
      }
    }

    return 'See link'
  }

  /**
   * Parse event date
   */
  parseEventDate(dateStr) {
    if (!dateStr) return null

    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null
      return date.toISOString().split('T')[0]
    } catch {
      return null
    }
  }

  /**
   * Extract time from date string
   */
  extractTime(dateStr) {
    if (!dateStr) return null

    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null
      return date.toTimeString().slice(0, 5)
    } catch {
      return null
    }
  }

  /**
   * Remove duplicate events
   */
  removeDuplicates(events) {
    const seen = new Map()
    const unique = []

    for (const event of events) {
      // Create key from normalized title and date
      const key = `${event.title.toLowerCase().trim().replace(/\s+/g, ' ')}_${event.date}`

      if (!seen.has(key)) {
        seen.set(key, true)
        unique.push(event)
      }
    }

    return unique
  }

  /**
   * Sort events by date
   */
  sortByDate(events) {
    return events.sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date) - new Date(b.date)
    })
  }

  /**
   * Submit events to Supabase
   */
  async submitEventsToSupabase(events) {
    if (!this.supabase) {
      console.error('Supabase client not initialized')
      return { success: 0, failed: 0, errors: [] }
    }

    const results = { success: 0, failed: 0, errors: [] }

    for (const event of events) {
      try {
        // Check if event already exists (by URL or title+date)
        const { data: existing } = await this.supabase
          .from('events')
          .select('id')
          .or(`url.eq.${event.url},and(title.ilike.${event.title},date.eq.${event.date})`)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`⏭️ Skipping duplicate: ${event.title}`)
          continue
        }

        // Insert event with pending status
        const { error } = await this.supabase
          .from('events')
          .insert({
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
            status: getStatusForSource(event.source), // Use source classification for moderation routing
            priority: event.relevanceScore > 0.5 ? 'high' : 'medium'
          })

        if (error) {
          throw error
        }

        results.success++
        console.log(`✅ Added: ${event.title}`)

      } catch (error) {
        results.failed++
        results.errors.push({
          event: event.title,
          error: error.message
        })
        console.error(`❌ Failed to add ${event.title}:`, error.message)
      }
    }

    return results
  }

  /**
   * Utility methods
   */
  cleanText(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  generateEventId(sourceId, identifier) {
    const timestamp = Date.now()
    const hash = this.simpleHash(identifier)
    return `${sourceId}_${timestamp}_${hash}`
  }

  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get scraping statistics
   */
  getSourceStats() {
    return {
      totalSources: this.sources.length,
      sourcesByType: this.sources.reduce((acc, source) => {
        acc[source.type] = (acc[source.type] || 0) + 1
        return acc
      }, {}),
      sources: this.sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        category: source.category,
        trustScore: source.trustScore
      }))
    }
  }
}

export { EventScrapingService }
export default EventScrapingService
