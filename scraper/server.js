#!/usr/bin/env node

/**
 * BLKOUT Event Scraper Server
 * Community-owned event discovery for Black LGBTQ+ liberation
 *
 * Two discovery engines:
 * 1. Tavily (primary) — web search + content extraction, handles SPAs
 * 2. Legacy (fallback) — JSON-LD/RSS from scene publications
 *
 * Schedule: Weekly on Sundays at 6 AM UTC
 * Manual: RUN_NOW=true node server.js
 * Tavily only: TAVILY_ONLY=true RUN_NOW=true node server.js
 */

import cron from 'node-cron'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { EventScrapingService } from './eventScrapingService.js'
import { TavilyEventDiscovery } from './tavilyEventDiscovery.js'

dotenv.config()

// Supabase — use service role key to bypass RLS for inserts
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Initialize both discovery engines
const legacyScraper = new EventScrapingService(supabase)

let tavilyDiscovery = null
if (process.env.TAVILY_API_KEY) {
  tavilyDiscovery = new TavilyEventDiscovery(supabase)
  console.log('Tavily event discovery: enabled')
} else {
  console.log('Tavily event discovery: disabled (no TAVILY_API_KEY)')
}

const tavilyOnly = process.env.TAVILY_ONLY === 'true'

/**
 * Run the combined event discovery job
 */
async function runScrapingJob() {
  console.log('='.repeat(60))
  console.log(`Starting event discovery at ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  let totalEvents = 0
  let totalSubmitted = 0
  let allErrors = []

  try {
    // ── Tavily Discovery (primary) ──
    if (tavilyDiscovery) {
      console.log('\n--- Tavily Discovery ---')
      const tavilyResults = await tavilyDiscovery.discoverEvents()

      console.log(`Tavily: ${tavilyResults.totalEvents} events from ${tavilyResults.successfulQueries} queries`)
      totalEvents += tavilyResults.totalEvents
      allErrors.push(...tavilyResults.errors.map(e => ({ source: 'Tavily', ...e })))

      if (tavilyResults.events.length > 0) {
        console.log(`Submitting ${tavilyResults.events.length} Tavily events to Supabase...`)
        const submitResults = await tavilyDiscovery.submitToSupabase(tavilyResults.events)
        totalSubmitted += submitResults.success

        console.log(`  Added: ${submitResults.success}, Skipped: ${submitResults.skipped}, Failed: ${submitResults.failed}`)
      }
    }

    // ── Legacy Scraper (fallback — skip if TAVILY_ONLY) ──
    if (!tavilyOnly) {
      console.log('\n--- Legacy Scraper ---')
      const legacyResults = await legacyScraper.scrapeAllSources()

      console.log(`Legacy: ${legacyResults.totalEvents} events from ${legacyResults.successfulSources}/${legacyScraper.sources.length} sources`)
      totalEvents += legacyResults.totalEvents
      allErrors.push(...legacyResults.errors.map(e => ({ source: 'Legacy', ...e })))

      if (legacyResults.events.length > 0) {
        console.log(`Submitting ${legacyResults.events.length} legacy events to Supabase...`)
        const submitResults = await legacyScraper.submitEventsToSupabase(legacyResults.events)
        totalSubmitted += submitResults.success

        console.log(`  Added: ${submitResults.success}, Failed: ${submitResults.failed}`)
      }
    }

    // ── Summary ──
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Discovery Summary:`)
    console.log(`  Total events found: ${totalEvents}`)
    console.log(`  Submitted to Supabase: ${totalSubmitted}`)
    console.log(`  Engines: ${tavilyDiscovery ? 'Tavily' : '-'}${!tavilyOnly ? ' + Legacy' : ''}`)

    if (allErrors.length > 0) {
      console.log(`  Errors: ${allErrors.length}`)
      allErrors.slice(0, 5).forEach(err => {
        console.log(`    - ${err.source || err.query}: ${err.error}`)
      })
    }

    console.log(`Completed at ${new Date().toISOString()}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error(`Event discovery failed:`, error)
  }
}

/**
 * Health check info
 */
function printHealthInfo() {
  console.log(`
  BLKOUT Event Discovery
  ──────────────────────────────
  Mission: Event discovery for Black LGBTQ+ liberation
  Schedule: Weekly on Sundays at 6 AM UTC
  Tavily: ${tavilyDiscovery ? 'enabled' : 'disabled'}
  Legacy sources: ${legacyScraper.sources.length}
  Mode: ${tavilyOnly ? 'Tavily only' : 'Tavily + Legacy'}
  `)
}

// Run mode
if (process.env.RUN_NOW === 'true') {
  printHealthInfo()
  console.log('Running immediate discovery (RUN_NOW=true)...')
  runScrapingJob().then(() => {
    console.log('Exiting after one-shot run.')
    process.exit(0)
  }).catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
} else {
  // Schedule: Sundays 6 AM UTC
  if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 6 * * 0', async () => {
      console.log('Starting weekly event discovery...')
      await runScrapingJob()
    })
    console.log('Scheduled weekly discovery: 0 6 * * 0 (Sundays at 6 AM UTC)')
  }
  printHealthInfo()
}

export { runScrapingJob, tavilyDiscovery, legacyScraper }
export default runScrapingJob
