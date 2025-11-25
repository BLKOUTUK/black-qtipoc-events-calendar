/**
 * Vercel Serverless Function - BrowserAct Webhook Receiver
 * Receives scraped events from BrowserAct and sends to IVOR for moderation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const IVOR_API_URL = process.env.IVOR_API_URL || 'https://ivor-core.railway.app'
const BROWSERACT_SECRET = process.env.BROWSERACT_SECRET_TOKEN || ''
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || ''
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ''

interface BrowserActEvent {
  type: 'event' | 'news'
  title: string
  description: string
  event_date?: string
  location?: string
  source_url: string
  organizer_name?: string
  tags?: string[]
  price?: string
  image_url?: string
}

interface IVORModerationResult {
  confidence: number
  relevance: 'high' | 'medium' | 'low'
  quality: 'high' | 'medium' | 'low'
  liberation_score: number
  reasoning: string
  recommendation: 'auto-approve' | 'review' | 'reject'
  processing_time_ms: number
  flags?: string[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-BrowserAct-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate authentication
  const authToken = req.headers['x-browseract-token'] as string
  if (BROWSERACT_SECRET && authToken !== BROWSERACT_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid BrowserAct token'
    })
  }

  try {
    // Parse incoming events
    const body = req.body
    const events: BrowserActEvent[] = Array.isArray(body.events) ? body.events : [body]

    if (events.length === 0) {
      return res.status(400).json({
        error: 'No events provided',
        received: body
      })
    }

    console.log(`[BrowserAct] Received ${events.length} events for processing`)

    // Process events through IVOR
    const results = await Promise.all(
      events.map(async (eventData) => {
        try {
          // Send to IVOR for AI moderation
          const ivorResponse = await fetch(`${IVOR_API_URL}/api/moderate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: eventData,
              moderation_type: eventData.type === 'event' ? 'event_relevance' : 'news_relevance'
            })
          })

          if (!ivorResponse.ok) {
            throw new Error(`IVOR API error: ${ivorResponse.status}`)
          }

          const ivorResult: IVORModerationResult = await ivorResponse.json()

          // Determine moderation status
          let moderationStatus: string
          if (ivorResult.recommendation === 'auto-approve' && ivorResult.confidence >= 0.90) {
            moderationStatus = 'auto-approved'
          } else if (ivorResult.confidence >= 0.70) {
            moderationStatus = 'review-quick'
          } else {
            moderationStatus = 'review-deep'
          }

          // Enrich event data
          const enrichedEvent = {
            ...eventData,
            ivor_confidence: (ivorResult.confidence * 100).toFixed(0) + '%',
            ivor_reasoning: ivorResult.reasoning,
            liberation_score: (ivorResult.liberation_score * 100).toFixed(0) + '%',
            moderation_status: moderationStatus,
            relevance: ivorResult.relevance,
            quality: ivorResult.quality,
            submitted_by: 'browseract-automation',
            submitted_at: new Date().toISOString(),
            flags: ivorResult.flags?.join(', ') || ''
          }

          // Write to Google Sheets
          await writeToGoogleSheets(enrichedEvent, moderationStatus)

          return {
            success: true,
            title: eventData.title,
            status: moderationStatus,
            confidence: ivorResult.confidence,
            recommendation: ivorResult.recommendation
          }

        } catch (error) {
          console.error(`[BrowserAct] Error processing event: ${eventData.title}`, error)

          // On error, send to manual review
          await writeToGoogleSheets({
            ...eventData,
            moderation_status: 'review-deep',
            ivor_confidence: '0%',
            ivor_reasoning: 'AI moderation failed - requires manual review',
            submitted_by: 'browseract-automation',
            submitted_at: new Date().toISOString(),
            flags: 'error'
          }, 'review-deep')

          return {
            success: false,
            title: eventData.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Calculate statistics
    const stats = {
      total: results.length,
      auto_approved: results.filter(r => r.status === 'auto-approved').length,
      review_quick: results.filter(r => r.status === 'review-quick').length,
      review_deep: results.filter(r => r.status === 'review-deep').length,
      failed: results.filter(r => !r.success).length
    }

    console.log('[BrowserAct] Processing complete:', stats)

    return res.status(200).json({
      success: true,
      message: 'Events processed successfully',
      stats,
      results: results.map(r => ({
        title: r.title,
        status: r.status,
        success: r.success
      }))
    })

  } catch (error) {
    console.error('[BrowserAct] Fatal error:', error)
    return res.status(500).json({
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Write event to Google Sheets
 */
async function writeToGoogleSheets(eventData: any, status: string): Promise<void> {
  if (!GOOGLE_SHEET_ID || !GOOGLE_API_KEY) {
    console.warn('[Google Sheets] Not configured - skipping write')
    return
  }

  try {
    const sheetName = status === 'auto-approved' ? 'Events_Published' : 'Events_PendingReview'
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${sheetName}:append?valueInputOption=RAW&key=${GOOGLE_API_KEY}`

    const row = [
      eventData.submitted_at || new Date().toISOString(),
      eventData.submitted_by || 'browseract-automation',
      'events',
      eventData.title || '',
      eventData.event_date || '',
      eventData.event_time || '',
      eventData.location || '',
      eventData.organizer_name || '',
      eventData.description || '',
      eventData.source_url || '',
      eventData.tags?.join(', ') || '',
      eventData.price || '',
      eventData.image_url || '',
      eventData.ivor_confidence || '',
      eventData.ivor_reasoning || '',
      eventData.liberation_score || '',
      eventData.moderation_status || status,
      eventData.relevance || '',
      eventData.quality || '',
      eventData.flags || '',
      'pending_review',
      ''
    ]

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    })

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`)
    }

    console.log(`[Google Sheets] Written to ${sheetName}: ${eventData.title}`)

  } catch (error) {
    console.error('[Google Sheets] Write failed:', error)
    // Don't throw - we don't want to fail the entire request
  }
}
