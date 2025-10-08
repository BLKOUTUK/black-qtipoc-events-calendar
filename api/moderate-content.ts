// Moderation API Route Implementation with Supabase integration
export default async function handler(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed - use POST'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { action, eventId, status, edits } = body;

    if (!action || !eventId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: action, eventId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0';

    console.log(`Moderation action: ${action} on event ${eventId} with status ${status}`);

    let updatePayload: any = {};

    if (action === 'edit' && edits) {
      // Handle edit action - map frontend fields to database fields
      if (edits.title !== undefined) updatePayload.title = edits.title;
      if (edits.name !== undefined) updatePayload.title = edits.name;
      if (edits.description !== undefined) updatePayload.description = edits.description;
      if (edits.event_date !== undefined) updatePayload.date = edits.event_date;
      if (edits.start_date !== undefined) updatePayload.date = edits.start_date;
      if (edits.start_time !== undefined) updatePayload.start_time = edits.start_time;
      if (edits.end_time !== undefined) updatePayload.end_time = edits.end_time;
      if (edits.location !== undefined) updatePayload.location = edits.location;
      if (edits.organizer_name !== undefined) updatePayload.organizer = edits.organizer_name;
      if (edits.source !== undefined) updatePayload.source = edits.source;
      if (edits.source_url !== undefined) updatePayload.url = edits.source_url;
      if (edits.url !== undefined) updatePayload.url = edits.url;
      if (edits.image_url !== undefined) updatePayload.image_url = edits.image_url;
      if (edits.featured_image !== undefined) updatePayload.featured_image = edits.featured_image;
      if (edits.tags !== undefined) updatePayload.tags = edits.tags;
      if (edits.price !== undefined) updatePayload.cost = edits.price;
      if (edits.status !== undefined) updatePayload.status = edits.status;
      if (edits.recurrence_rule !== undefined) updatePayload.recurrence_rule = edits.recurrence_rule;
      if (edits.recurrence_parent_id !== undefined) updatePayload.recurrence_parent_id = edits.recurrence_parent_id;
      if (edits.is_recurring_instance !== undefined) updatePayload.is_recurring_instance = edits.is_recurring_instance;
      if (edits.original_start_date !== undefined) updatePayload.original_start_date = edits.original_start_date;
    } else {
      // Map status for approve/reject actions
      let dbStatus = status;
      if (action === 'approve') {
        dbStatus = 'approved';
      } else if (action === 'reject') {
        dbStatus = 'archived';
      }

      updatePayload = {
        status: dbStatus,
        moderated_at: new Date().toISOString()
      };
    }

    updatePayload.updated_at = new Date().toISOString();

    // Update event in Supabase
    const updateUrl = `${supabaseUrl}/rest/v1/events?id=eq.${eventId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updatePayload)
    });

    console.log('Supabase update response:', updateResponse.status);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Supabase update failed:', errorText);

      return new Response(JSON.stringify({
        success: false,
        error: `Failed to update event: ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'approve') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Event approved successfully',
        publishedId: eventId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (action === 'reject') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Event rejected successfully'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (action === 'edit') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Event updated successfully'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action. Use approve, reject, or edit'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}