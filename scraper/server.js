#!/usr/bin/env node

/**
 * BLKOUT Event Scraper Server
 * Community-owned event discovery for Black LGBTQ+ liberation
 *
 * Runs weekly to scrape events from scene-oriented periodicals:
 * - QX Magazine (JSON-LD)
 * - DIVA Magazine (JSON-LD)
 * - Consortium LGBT+ (iCal)
 * - Eventbrite (Black LGBTQ+ specific searches)
 *
 * Manual searches still recommended for:
 * - OutSavvy, Eventbrite (broader searches)
 * - Instagram, Facebook (require alternative approaches)
 */

import cron from 'node-cron'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { EventScrapingService } from './eventScrapingService.js'

// Load environment variables
dotenv.config()

// Supabase configuration — use service role key to bypass RLS for inserts
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('❌ No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Initialize scraping service
const eventScrapingService = new EventScrapingService(supabase)

/**
 * Run the event scraping job
 */
async function runScrapingJob() {
  console.log('='.repeat(60))
  console.log(`🎉 Starting event scraping job at ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Scrape all sources
    const results = await eventScrapingService.scrapeAllSources()

    console.log(`\n📊 Scraping Summary:`)
    console.log(`   Total events found: ${results.totalEvents}`)
    console.log(`   Successful sources: ${results.successfulSources}`)
    console.log(`   Failed sources: ${results.failedSources}`)

    if (results.errors.length > 0) {
      console.log(`\n⚠️ Errors:`)
      results.errors.forEach(err => {
        console.log(`   - ${err.source}: ${err.error}`)
      })
    }

    // Submit events to Supabase
    if (results.events.length > 0) {
      console.log(`\n📤 Submitting ${results.events.length} events to Supabase...`)
      const submitResults = await eventScrapingService.submitEventsToSupabase(results.events)

      console.log(`\n📊 Submission Summary:`)
      console.log(`   Successfully added: ${submitResults.success}`)
      console.log(`   Failed: ${submitResults.failed}`)

      if (submitResults.errors.length > 0 && submitResults.errors.length <= 5) {
        console.log(`\n⚠️ Submission errors:`)
        submitResults.errors.forEach(err => {
          console.log(`   - ${err.event}: ${err.error}`)
        })
      }
    } else {
      console.log(`\n⚠️ No relevant events found to submit`)
    }

    // Log completion
    await logScrapingRun(results)

    console.log(`\n✅ Event scraping job completed at ${new Date().toISOString()}`)

  } catch (error) {
    console.error(`\n❌ Event scraping job failed:`, error)
  }

  console.log('='.repeat(60))
}

/**
 * Log scraping run to database
 */
async function logScrapingRun(results) {
  try {
    // Could log to a scraping_logs table if needed
    console.log(`📝 Logged scraping run: ${results.totalEvents} events from ${results.successfulSources} sources`)
  } catch (error) {
    console.error('Failed to log scraping run:', error.message)
  }
}

/**
 * Health check endpoint info
 */
function printHealthInfo() {
  console.log(`
  🏳️‍🌈 BLKOUT Event Scraper
  ─────────────────────────────
  🎯 Mission: Event discovery for Black LGBTQ+ liberation
  📅 Schedule: Weekly on Sundays at 6 AM UTC
  🌍 Sources: ${eventScrapingService.sources.length} event platforms

  Source Stats:
  ${JSON.stringify(eventScrapingService.getSourceStats(), null, 2)}
  `)
}

// When RUN_NOW is set (GitHub Actions), run once and exit — don't start cron
if (process.env.RUN_NOW === 'true') {
  printHealthInfo()
  console.log('🚀 Running immediate scrape (RUN_NOW=true)...')
  runScrapingJob().then(() => {
    console.log('🏁 Exiting after one-shot run.')
    process.exit(0)
  }).catch((err) => {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  })
} else {
  // Long-running server mode: schedule cron jobs
  if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 6 * * 0', async () => {
      console.log('🔄 Starting weekly event scraping...')
      await runScrapingJob()
    })
    console.log('📅 Scheduled weekly scrape: 0 6 * * 0 (Sundays at 6 AM UTC)')
  }
  printHealthInfo()
}

// Export for testing and manual runs
export { runScrapingJob, eventScrapingService }
export default runScrapingJob
