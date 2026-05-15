/**
 * Marlborough Productions events scraper.
 *
 * Marlborough Productions (Brighton, AD: Tarik Elmoutawakil) hosts the strongest
 * programme of QTIPOC-relevant events outside London — 12 confirmed events
 * May–Nov 2026 alone — but Tavily's keyword search wasn't catching any of them
 * (15 May 2026 audit at projects/events-calendar/spikes/2026-05-14-data-source-spike.md).
 *
 * Their /whats-on/ page renders each event as an <a> wrapping h4 title +
 * organizer paragraph + date + venue, in a consistent card structure. There
 * is no JSON-LD anywhere on the site (homepage, /whats-on/, or per-event pages),
 * and the WP REST API exposes the event post type but does NOT include event
 * dates in any field accessible without auth. So /whats-on/ HTML is the only
 * source of dated events.
 *
 * This scraper fetches /whats-on/ once, parses out the 12-ish event cards, and
 * returns events ready for Supabase insertion. Status is left as 'pending' so
 * the moderator can sanity-check (Marlborough's domain isn't in TRUSTED_DOMAINS,
 * matching the audit's note about not auto-approving non-canonical sources).
 *
 * If Marlborough's theme changes, this scraper will quietly start returning
 * fewer events — date-format misses or card-structure changes both fail-safe
 * to "skip the event" rather than insert garbage.
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; BLKOUT events-calendar/1.0; +https://events.blkoutuk.com)'
const FETCH_TIMEOUT_MS = 15000
const WHATS_ON_URL = 'https://marlboroughproductions.org.uk/whats-on/'
const SOURCE_LABEL = 'Marlborough Productions'

const MONTHS = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

/**
 * Parse a "Thu 25 Jun 2026" or "Sun 15 Mar – Sun 8 Nov 2026" style date string.
 * Returns the START date in YYYY-MM-DD form, or null on failure.
 */
function parseEventDate(text) {
  // Try range pattern FIRST — the range END half is also a valid single-date match,
  // so checking single-date first would silently return the end of a range as the start.
  // Range without year on the start half: "Sun 15 Mar – Sun 8 Nov 2026"
  const rangeStart = text.match(/\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+[-–]\s+(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+\d{1,2}\s+[A-Z][a-z]{2}\s+(\d{4})\b/)
  if (rangeStart) {
    const [, day, mon, year] = rangeStart
    const monthNum = MONTHS[mon]
    if (!monthNum) return null
    return `${year}-${monthNum}-${day.padStart(2, '0')}`
  }
  // Range with year on both halves (rarer but possible): grab the first one.
  const rangeStartFull = text.match(/\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})\s+[-–]/)
  if (rangeStartFull) {
    const [, day, mon, year] = rangeStartFull
    const monthNum = MONTHS[mon]
    if (!monthNum) return null
    return `${year}-${monthNum}-${day.padStart(2, '0')}`
  }
  // Single date: "Thu 25 Jun 2026"
  const fullMatch = text.match(/\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})\b/)
  if (fullMatch) {
    const [, day, mon, year] = fullMatch
    const monthNum = MONTHS[mon]
    if (!monthNum) return null
    return `${year}-${monthNum}-${day.padStart(2, '0')}`
  }
  return null
}

/**
 * Decode a small set of HTML entities that show up in Marlborough's titles
 * (curly quotes, ampersands, en-dashes).
 */
function htmlDecode(s) {
  if (!s) return s
  return s
    .replace(/&amp;/g, '&').replace(/&#038;/g, '&')
    .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract events from the /whats-on/ HTML.
 * Returns an array of event objects in the shape submitToSupabase expects.
 */
export function parseWhatsOnHtml(html) {
  const events = []
  // Each event card is wrapped in <a href="https://marlboroughproductions.org.uk/event/<slug>/">…</a>.
  const cardRx = /<a[^>]+href=["'](https?:\/\/marlboroughproductions\.org\.uk\/event\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/g
  let m
  const seenUrls = new Set()
  while ((m = cardRx.exec(html)) !== null) {
    const url = m[1]
    if (seenUrls.has(url)) continue  // /whats-on/ sometimes duplicates the link
    seenUrls.add(url)

    const inner = m[2]
    // Title from <h4>
    const titleMatch = inner.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)
    const title = titleMatch ? htmlDecode(titleMatch[1]) : null
    if (!title) continue

    // Organizer from first <p> after the title
    const orgMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/)
    const organizer = orgMatch ? htmlDecode(orgMatch[1]) : null

    // Strip all tags from inner to get the text bag containing date + venue
    const text = htmlDecode(inner)

    const date = parseEventDate(text)
    if (!date) continue  // fail-safe: skip events whose date format we can't parse

    // Venue heuristic: text after the parsed date string (year + word that follows)
    // Find the year position in the text and grab everything after.
    const yearMatch = text.match(/\b20\d{2}\b/)
    const venue = yearMatch
      ? text.slice(yearMatch.index + yearMatch[0].length).trim()
      : ''

    events.push({
      title,
      description: '',  // /whats-on/ doesn't show descriptions; per-event scrape is too costly
      date,
      start_time: null,
      location: venue || 'Marlborough Productions venue',
      organizer: organizer || 'Marlborough Productions',
      cost: null,
      url,
      source: SOURCE_LABEL,
      source_platform: 'marlborough',
      discovery_method: 'whats-on-html-scrape',
      tags: [],
      status: 'pending',  // moderator approves; marlborough not in TRUSTED_DOMAINS
      relevanceScore: 0.7,  // partner organiser, generally high-quality
    })
  }
  return events
}

/**
 * Fetch /whats-on/ and parse events. Returns [] on fetch failure.
 */
export async function extractMarlboroughEvents() {
  let html
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    const resp = await fetch(WHATS_ON_URL, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!resp.ok) {
      console.error(`[Marlborough] /whats-on/ returned HTTP ${resp.status}`)
      return []
    }
    html = await resp.text()
  } catch (err) {
    console.error(`[Marlborough] fetch failed: ${err.message}`)
    return []
  }

  const events = parseWhatsOnHtml(html)
  console.log(`[Marlborough] parsed ${events.length} events from /whats-on/`)
  return events
}

/**
 * Insert Marlborough events into Supabase, deduping by URL.
 * Mirrors the dedup pattern in TavilyEventDiscovery.submitToSupabase but
 * doesn't require the Tavily class to be instantiated.
 */
export async function submitMarlboroughToSupabase(supabase, events) {
  const results = { success: 0, skipped: 0, failed: 0, errors: [] }
  for (const event of events) {
    if (!event.date) { results.skipped++; continue }
    try {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('url', event.url)
        .limit(1)
      if (existing?.length > 0) { results.skipped++; continue }

      const { error } = await supabase.from('events').insert({
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
        priority: 'medium',
      })
      if (error) throw error
      results.success++
      console.log(`  ✅ Added: ${event.title} (${event.date})`)
    } catch (err) {
      results.failed++
      results.errors.push({ event: event.title, error: err.message })
    }
  }
  return results
}

// CLI usage: node marlboroughEventsScraper.js → prints parsed events as JSON
if (import.meta.url === `file://${process.argv[1]}`) {
  extractMarlboroughEvents().then((events) => {
    console.log(JSON.stringify(events, null, 2))
  })
}
