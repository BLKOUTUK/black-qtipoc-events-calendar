// API endpoint to generate recurring event instances
import { generateRecurringInstances } from '../src/utils/recurringEvents';

export default async function handler(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const { parentEvent, maxInstances = 100 } = body;

    if (!parentEvent || !parentEvent.recurrence_rule) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing parentEvent or recurrence_rule'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate instances
    const instances = generateRecurringInstances(
      parentEvent,
      parentEvent.recurrence_rule,
      maxInstances
    );

    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    // Insert instances into database
    const insertUrl = `${supabaseUrl}/rest/v1/events`;
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(instances)
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Failed to insert instances:', errorText);

      return new Response(JSON.stringify({
        success: false,
        error: `Failed to create recurring instances: ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const createdInstances = await insertResponse.json();

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${createdInstances.length} recurring event instances`,
      instances: createdInstances,
      count: createdInstances.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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
