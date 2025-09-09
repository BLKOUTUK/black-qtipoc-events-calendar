// Events Calendar - Webhook receiver for moderation sync from platform admin
// This receives and processes moderation actions from the BLKOUT website admin

import { eventService } from '../../services/eventService'

interface ModerationAction {
  id: string
  contentType: 'event' | 'newsroom_article' | 'community_story'
  action: 'approve' | 'reject'
  reason?: string
  moderatorId?: string
  sourceSystem: 'platform-admin' | 'events-admin' | 'chrome-extension'
  timestamp: string
}

interface WebhookPayload {
  type: 'moderation_action'
  data: ModerationAction
  signature?: string
}

const WEBHOOK_SECRET = 'blkout-moderation-sync-2025' // Should match bridge service

function generateSignature(action: ModerationAction): string {
  const content = JSON.stringify(action)
  const signature = btoa(`${WEBHOOK_SECRET}:${content}`).substring(0, 32)
  return signature
}

async function handleModerationSync(action: ModerationAction): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log(`📥 Events Calendar: Processing moderation sync:`, action)

    // Only process event-type content
    if (action.contentType !== 'event') {
      return { 
        success: true, 
        message: `Ignored ${action.contentType} - not an event` 
      }
    }

    // Avoid circular updates
    if (action.sourceSystem === 'events-admin') {
      return { 
        success: true, 
        message: 'Ignored - originated from events admin' 
      }
    }

    // Apply the moderation action using eventService
    const result = action.action === 'approve' 
      ? await eventService.approveEvent(action.id)
      : await eventService.rejectEvent(action.id)

    if (result) {
      return { 
        success: true, 
        message: `Event ${action.id} ${action.action}d successfully via sync` 
      }
    } else {
      return { 
        success: false, 
        error: `Failed to ${action.action} event ${action.id}` 
      }
    }
  } catch (error) {
    console.error('Error processing moderation sync:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main webhook handler
export async function POST(request: Request) {
  try {
    const payload: WebhookPayload = await request.json()
    
    // Basic security checks
    const signature = request.headers.get('X-Webhook-Signature')
    const userAgent = request.headers.get('User-Agent')
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!userAgent?.includes('BLKOUT-Moderation')) {
      return new Response(
        JSON.stringify({ error: 'Invalid User-Agent' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate payload
    if (!payload.type || payload.type !== 'moderation_action') {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook type' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!payload.data) {
      return new Response(
        JSON.stringify({ error: 'Missing moderation data' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify signature
    const expectedSignature = generateSignature(payload.data)
    if (signature !== expectedSignature) {
      console.warn('Invalid webhook signature received')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Process the moderation action
    const result = await handleModerationSync(payload.data)

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: result.message,
          timestamp: new Date().toISOString()
        }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          error: result.error,
          timestamp: new Date().toISOString()
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Health check
export async function GET(request: Request) {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'events-moderation-webhook',
      timestamp: new Date().toISOString()
    }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}