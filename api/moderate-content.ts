// Moderation API Route Implementation with Supabase integration
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed - use POST'
    });
  }

  try {
    const { action, eventId, status, edits } = req.body;

    if (!action || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: action, eventId'
      });
    }

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    console.log(`Moderation action: ${action} on event ${eventId} with status ${status}`);

    let updatePayload: any = {};

    if (action === 'edit' && edits) {
      // Handle edit action - map frontend fields to database fields
      if (edits.title !== undefined) updatePayload.title = edits.title;
      if (edits.name !== undefined) updatePayload.title = edits.name;
      if (edits.description !== undefined) updatePayload.description = edits.description;
      if (edits.event_date !== undefined) updatePayload.date = edits.event_date;
      if (edits.start_date !== undefined) updatePayload.date = edits.start_date;
      if (edits.end_date !== undefined) updatePayload.end_date = edits.end_date;
      if (edits.start_time !== undefined) updatePayload.start_time = edits.start_time;
      if (edits.end_time !== undefined) updatePayload.end_time = edits.end_time;
      if (edits.location !== undefined) updatePayload.location = edits.location;
      if (edits.organizer_name !== undefined) updatePayload.organizer = edits.organizer_name;
      if (edits.source !== undefined) updatePayload.source = edits.source;
      if (edits.source_url !== undefined) updatePayload.url = edits.source_url;
      if (edits.url !== undefined) updatePayload.url = edits.url;
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

      return res.status(500).json({
        success: false,
        error: `Failed to update event: ${errorText}`
      });
    }

    if (action === 'approve') {
      return res.status(200).json({
        success: true,
        message: 'Event approved successfully',
        publishedId: eventId
      });
    } else if (action === 'reject') {
      return res.status(200).json({
        success: true,
        message: 'Event rejected successfully'
      });
    } else if (action === 'edit') {
      return res.status(200).json({
        success: true,
        message: 'Event updated successfully'
      });
    } else if (action === 'delete') {
      // Permanently delete event from database
      const deleteUrl = `${supabaseUrl}/rest/v1/events?id=eq.${eventId}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Supabase delete response:', deleteResponse.status);

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('Supabase delete failed:', errorText);

        return res.status(500).json({
          success: false,
          error: `Failed to delete event: ${errorText}`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event permanently deleted'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use approve, reject, edit, or delete'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
