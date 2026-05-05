/**
 * OutSavvy JSON-LD extractor.
 *
 * OutSavvy serves clean schema.org Event microdata in <script type="application/ld+json">
 * blocks on every event page. This module fetches the page, parses out the Event JSON-LD,
 * and maps it into our standard event shape. No DOM rendering needed — JSON-LD is server-
 * rendered into the HTML.
 *
 * Background (5 May 2026): Tavily's text-extraction was returning a 500-char OutSavvy-app
 * marketing footer ("Track your loved events…") instead of actual event content for every
 * OutSavvy URL — produced 36/47 noise in the moderation queue. JSON-LD extraction sidesteps
 * the boilerplate problem entirely because the schema is structured by definition.
 *
 * Replaces Tavily Extract for outsavvy.com URLs in the discovery pipeline.
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; BLKOUT events-calendar/1.0; +https://events.blkoutuk.com)'
const FETCH_TIMEOUT_MS = 15000
const EVENT_TYPES = new Set([
  'Event', 'MusicEvent', 'TheaterEvent', 'SocialEvent', 'EducationEvent',
  'FoodEvent', 'VisualArtsEvent', 'BusinessEvent', 'ScreeningEvent',
  'DanceEvent', 'ComedyEvent', 'Festival', 'SportsEvent', 'PublicationEvent',
  'ChildrensEvent', 'LiteraryEvent',
])

/**
 * Extract Event-shaped JSON-LD blocks from an HTML string.
 * Returns an array of raw schema.org objects (could be empty if none present).
 */
function extractJsonLdEvents(html) {
  const events = []
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = rx.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1].trim())
      const items = Array.isArray(obj) ? obj : (obj['@graph'] || [obj])
      for (const it of items) {
        if (!it || typeof it !== 'object') continue
        const t = it['@type']
        const types = Array.isArray(t) ? t : [t]
        if (types.some(x => EVENT_TYPES.has(String(x)))) events.push(it)
      }
    } catch { /* malformed JSON-LD block — skip */ }
  }
  return events
}

/**
 * Decode HTML entities the schema.org description sometimes contains
 * (OutSavvy double-encodes & to &amp;amp;) and collapse whitespace.
 */
function htmlDecode(s) {
  if (!s || typeof s !== 'string') return s
  return s
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/ | /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Format the location into a single human-readable string, dedupe-aware
 * (OutSavvy sometimes repeats venue name in streetAddress prefix).
 */
function formatLocation(jsonLd) {
  const loc = jsonLd.location
  if (!loc || typeof loc !== 'object') return ''
  const place = Array.isArray(loc) ? loc[0] : loc
  const name = htmlDecode(place.name || '')
  const addr = place.address || {}
  const street = htmlDecode(addr.streetAddress || '')
  const city = htmlDecode(addr.addressLocality || '')
  const postcode = htmlDecode(addr.postalCode || '')
  // If streetAddress starts with venue name, drop the duplicate
  const streetClean = street && name && street.startsWith(name)
    ? street.slice(name.length).replace(/^[\s,]+/, '')
    : street
  return [name, streetClean, city, postcode].filter(Boolean).join(', ')
}

/**
 * Map a schema.org Event JSON-LD object to our standard event shape
 * (the same shape parseSingleEvent() returns elsewhere in tavilyEventDiscovery.js).
 */
function mapJsonLdToEvent(jsonLd, url) {
  const start = jsonLd.startDate || ''
  const end = jsonLd.endDate || ''
  const datePart = start.split('T')[0]
  const startTime = start.includes('T') ? start.split('T')[1].slice(0, 5) : null
  const endTime = end.includes('T') ? end.split('T')[1].slice(0, 5) : null

  const org = jsonLd.organizer
  const orgName = org && typeof org === 'object'
    ? htmlDecode(Array.isArray(org) ? org[0]?.name : org.name)
    : null

  const offers = jsonLd.offers
  const cost = offers && typeof offers === 'object'
    ? (offers.price || offers.lowPrice || null)
    : null

  const isOnline = jsonLd.eventAttendanceMode &&
    String(jsonLd.eventAttendanceMode).includes('Online')

  return {
    title: htmlDecode(jsonLd.name) || '',
    description: htmlDecode(jsonLd.description) || '',
    date: datePart || null,
    start_time: startTime,
    end_time: endTime,
    location: isOnline ? 'Online Event' : formatLocation(jsonLd),
    organizer: orgName,
    cost: cost ? String(cost) : null,
    url: jsonLd.url || url,
    image_url: jsonLd.image || null,
    source: 'OutSavvy (JSON-LD)',
    source_platform: 'outsavvy',
    discovery_method: 'jsonld_scrape',
    eventStatus: jsonLd.eventStatus || null,
    schemaType: jsonLd['@type'] || 'Event',
  }
}

/**
 * Fetch one OutSavvy event URL and return a parsed event (or null if extraction fails).
 * Wraps fetch with timeout + UA + simple error capture.
 */
export async function extractFromOutSavvyUrl(url) {
  if (!url || !url.includes('outsavvy.com')) return null

  let html
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    const resp = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!resp.ok) return null
    html = await resp.text()
  } catch {
    return null
  }

  const events = extractJsonLdEvents(html)
  if (events.length === 0) return null

  const ev = mapJsonLdToEvent(events[0], url)
  // Sanity: drop if we can't even get a title or date
  if (!ev.title || !ev.date) return null
  return ev
}

// Exports for testing
export { extractJsonLdEvents, mapJsonLdToEvent, htmlDecode, formatLocation, EVENT_TYPES }
