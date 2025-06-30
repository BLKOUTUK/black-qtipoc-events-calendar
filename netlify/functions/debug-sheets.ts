import { Handler } from '@netlify/functions';

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
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const API_KEY = process.env.GOOGLE_API_KEY;

    console.log('Environment check:', {
      hasSheetId: !!SHEET_ID,
      hasApiKey: !!API_KEY,
      sheetId: SHEET_ID?.substring(0, 10) + '...',
      apiKey: API_KEY?.substring(0, 10) + '...'
    });

    if (!SHEET_ID || !API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Missing credentials',
          hasSheetId: !!SHEET_ID,
          hasApiKey: !!API_KEY
        })
      };
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/OrganizationsToMonito!A1:L5?key=${API_KEY}`;
    console.log('Request URL:', url);

    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: `Google Sheets API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    const rows = data.values || [];
    console.log('Rows found:', rows.length);

    // Parse first few organizations
    const organizations = rows.slice(1).map((row: string[], index: number) => {
      console.log(`Row ${index}:`, row);
      return {
        id: row[0] || '',
        name: row[1] || '',
        type: row[2] || '',
        location: row[3] || '',
        website: row[4] || '',
        facebook_page: row[6] || '',
        eventbrite_organizer: row[7] || '',
        monitoring_frequency: row[9] || 'monthly',
        last_checked: row[10] || '',
        status: 'active'
      };
    });

    console.log('Parsed organizations:', organizations.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        totalRows: rows.length,
        organizations: organizations.slice(0, 5), // First 5 for debugging
        sampleOrganization: organizations[0]
      })
    };

  } catch (error) {
    console.error('Debug error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};