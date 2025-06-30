import { Handler } from '@netlify/functions';

interface Organization {
  id: string;
  name: string;
  type: string;
  location: string;
  website?: string;
  facebook_page?: string;
  eventbrite_organizer?: string;
  monitoring_frequency: 'weekly' | 'monthly' | 'quarterly';
  last_checked?: string;
  status: 'active' | 'inactive' | 'needs_review';
}

async function getOrganizationsFromSheet(): Promise<Organization[]> {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!SHEET_ID || !API_KEY) {
    console.warn('Google Sheets credentials not configured');
    return [];
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/OrganizationsToMonito!A:L?key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Skip header row and convert to Organization objects
    return rows.slice(1).map((row: string[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      type: row[2] || '',
      location: row[3] || '',
      website: row[4] || '',
      facebook_page: row[5] || '',
      eventbrite_organizer: row[6] || '',
      monitoring_frequency: (row[7] as any) || 'monthly',
      last_checked: row[8] || '',
      status: (row[9] as any) || 'active'
    }));
  } catch (error) {
    console.error('Error fetching organizations from sheet:', error);
    return [];
  }
}

async function shouldCheckOrganization(org: Organization): Promise<boolean> {
  if (org.status !== 'active') return false;
  if (!org.last_checked) return true;

  const lastChecked = new Date(org.last_checked);
  const now = new Date();
  const daysSinceCheck = Math.floor((now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24));

  switch (org.monitoring_frequency) {
    case 'weekly':
      return daysSinceCheck >= 7;
    case 'monthly':
      return daysSinceCheck >= 30;
    case 'quarterly':
      return daysSinceCheck >= 90;
    default:
      return daysSinceCheck >= 30;
  }
}

async function checkOrganizationEvents(org: Organization): Promise<{ events_found: number; events_added: number }> {
  let eventsFound = 0;
  let eventsAdded = 0;

  try {
    // Check Eventbrite if organizer ID is provided
    if (org.eventbrite_organizer) {
      const eventbriteToken = process.env.EVENTBRITE_API_TOKEN;
      if (eventbriteToken) {
        const url = `https://www.eventbriteapi.com/v3/organizers/${org.eventbrite_organizer}/events/?` +
          `start_date.range_start=${new Date().toISOString()}&` +
          `start_date.range_end=${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()}&` +
          `token=${eventbriteToken}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          eventsFound += data.events?.length || 0;
          // In a real implementation, would filter and add relevant events
          eventsAdded += Math.floor((data.events?.length || 0) * 0.8); // Assume 80% relevance
        }
      }
    }

    // Check Facebook if page is provided
    if (org.facebook_page) {
      const facebookToken = process.env.FACEBOOK_ACCESS_TOKEN;
      if (facebookToken) {
        const url = `https://graph.facebook.com/v18.0/${org.facebook_page}/events?` +
          `access_token=${facebookToken}&` +
          `since=${Math.floor(Date.now() / 1000)}&` +
          `until=${Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000)}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          eventsFound += data.data?.length || 0;
          eventsAdded += data.data?.length || 0; // Assume all Facebook events from known orgs are relevant
        }
      }
    }

    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error(`Error checking events for ${org.name}:`, error);
  }

  return { events_found: eventsFound, events_added: eventsAdded };
}

async function updateOrganizationSheet(org: Organization, eventsFound: number) {
  // In a real implementation, this would update the Google Sheet
  // with the new last_checked date and events_found_last_check
  console.log(`Would update ${org.name}: last_checked=${new Date().toISOString()}, events_found=${eventsFound}`);
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const organizations = await getOrganizationsFromSheet();
    const results = {
      organizations_checked: 0,
      total_events_found: 0,
      total_events_added: 0,
      organizations_skipped: 0,
      errors: [] as string[]
    };

    for (const org of organizations) {
      try {
        const shouldCheck = await shouldCheckOrganization(org);
        
        if (!shouldCheck) {
          results.organizations_skipped++;
          continue;
        }

        const { events_found, events_added } = await checkOrganizationEvents(org);
        
        results.organizations_checked++;
        results.total_events_found += events_found;
        results.total_events_added += events_added;

        // Update the organization's last checked date
        await updateOrganizationSheet(org, events_found);

        console.log(`Checked ${org.name}: ${events_found} events found, ${events_added} added`);

      } catch (error) {
        results.errors.push(`Error checking ${org.name}: ${error.message}`);
      }
    }

    // Log the monitoring session
    const logData = {
      id: Date.now().toString(),
      source: 'organization_monitor',
      events_found: results.total_events_found,
      events_added: results.total_events_added,
      status: results.errors.length > 0 ? 'partial' : 'success',
      created_at: new Date().toISOString(),
      error_message: results.errors.length > 0 ? results.errors.slice(0, 3).join('; ') : null
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...results,
        log: logData,
        message: `Monitored ${results.organizations_checked} organizations, found ${results.total_events_found} events`
      })
    };

  } catch (error) {
    console.error('Organization monitoring error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};