// Moderation API Route Implementation
// File: api/moderate-content.ts
// Purpose: Handle approval/rejection actions for moderation queue content

import { CommunityPublicationService } from '../lib/publicationService';

interface ModerationRequest {
  action: 'approve' | 'reject' | 'edit';
  contentId: string;
  moderatorId: string;
  reason?: string;
  edits?: {
    title?: string;
    content?: string;
    communityMessage?: string;
  };
}

interface ModerationResponse {
  success: boolean;
  message: string;
  publishedId?: string;
  error?: string;
}

const publicationService = new CommunityPublicationService();

export default async function handler(request: Request): Promise<Response> {
  // Enable CORS for frontend requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Only allow POST requests for moderation actions
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed - use POST' 
      }), 
      { 
        status: 405, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  try {
    // Parse request body
    const moderationRequest: ModerationRequest = await request.json();
    
    // Validate required fields
    if (!moderationRequest.action || !moderationRequest.contentId || !moderationRequest.moderatorId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: action, contentId, moderatorId'
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const { action, contentId, moderatorId, reason, edits } = moderationRequest;
    let response: ModerationResponse;

    switch (action) {
      case 'approve':
        try {
          const published = await publicationService.approveFromModeration(contentId, moderatorId);
          
          response = {
            success: true,
            message: 'Content approved and published to community',
            publishedId: published.id
          };
          
          // Log community liberation action
          console.log(`🏴‍☠️ Community content approved: ${published.title} by moderator ${moderatorId}`);
          
        } catch (error) {
          response = {
            success: false,
            error: `Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            message: 'Failed to approve content'
          };
        }
        break;

      case 'reject':
        if (!reason || reason.trim().length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Rejection reason is required for community transparency'
            }),
            { 
              status: 400, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }

        try {
          await publicationService.rejectFromModeration(contentId, moderatorId, reason);
          
          response = {
            success: true,
            message: 'Content rejected with community transparency'
          };
          
          // Log rejection for community oversight
          console.log(`❌ Community content rejected: ${contentId} by moderator ${moderatorId} - Reason: ${reason}`);
          
        } catch (error) {
          response = {
            success: false,
            error: `Rejection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            message: 'Failed to reject content'
          };
        }
        break;

      case 'edit':
        // TODO: Implement edit functionality
        // This would allow community moderators to edit content before approval
        response = {
          success: false,
          error: 'Edit functionality not yet implemented',
          message: 'Content editing feature coming soon'
        };
        break;

      default:
        response = {
          success: false,
          error: `Invalid action: ${action}. Supported actions: approve, reject, edit`,
          message: 'Invalid moderation action'
        };
    }

    // Return appropriate HTTP status code
    const statusCode = response.success ? 200 : 400;
    
    return new Response(
      JSON.stringify(response),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Moderation API Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error during moderation',
        message: error instanceof Error ? error.message : 'Unknown server error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Export configuration for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};