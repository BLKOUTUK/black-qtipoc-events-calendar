/**
 * BLKOUT Content Curator - Google Sheets Integration Module
 * Handles Google Sheets API interactions for team-based content submission
 */

/**
 * Google Sheets API configuration
 */
const SHEETS_CONFIG = {
  API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
  DISCOVERY_URL: 'https://sheets.googleapis.com/$discovery/rest?version=v4'
};

/**
 * Column mappings for different content types
 */
const COLUMN_MAPPINGS = {
  events: {
    headers: [
      'Timestamp',
      'Submitted By',
      'Team',
      'Event Title',
      'Event Date',
      'Event Time',
      'Location',
      'Organizer',
      'Description',
      'Source URL',
      'Tags',
      'Price',
      'Image URL',
      'IVOR Confidence',
      'IVOR Reasoning',
      'Liberation Score',
      'Moderation Status',
      'Relevance',
      'Quality',
      'Flags',
      'Status',
      'Notes'
    ],
    dataMapping: (data) => [
      data.submitted_at || data.submittedAt || new Date().toISOString(),
      data.submitted_by || data.submittedBy || 'unknown',
      data.team || 'events',
      data.title || data.eventTitle || '',
      data.event_date || data.eventDate || data.date || '',
      data.event_time || data.eventTime || data.time || '',
      data.location || data.eventLocation || '',
      data.organizer_name || data.eventOrganizer || data.organizer || '',
      data.description || data.eventDescription || '',
      data.source_url || data.sourceUrl || data.url || '',
      data.tags ? (Array.isArray(data.tags) ? data.tags.join(', ') : data.tags) : '',
      data.price || data.eventCost || 'Free',
      data.image_url || '',
      data.ivor_confidence || '',
      data.ivor_reasoning || '',
      data.liberation_score || data.liberationScore || 0,
      data.moderation_status || '',
      data.relevance || '',
      data.quality || '',
      data.flags || '',
      data.status || 'pending_review',
      data.notes || ''
    ]
  },
  news: {
    headers: [
      'Timestamp',
      'Submitted By',
      'Team',
      'Article Title',
      'Author',
      'Publication',
      'Publish Date',
      'Category',
      'Description/Excerpt',
      'Source URL',
      'Tags',
      'Image URL',
      'IVOR Confidence',
      'IVOR Reasoning',
      'Liberation Score',
      'Moderation Status',
      'Relevance',
      'Quality',
      'Flags',
      'Status',
      'Notes'
    ],
    dataMapping: (data) => [
      data.submitted_at || data.submittedAt || new Date().toISOString(),
      data.submitted_by || data.submittedBy || 'unknown',
      data.team || 'news',
      data.title || data.articleTitle || '',
      data.author || data.articleAuthor || '',
      data.publication || '',
      data.publish_date || data.publishDate || '',
      data.category || data.articleCategory || 'community',
      data.description || data.excerpt || '',
      data.source_url || data.sourceUrl || data.url || '',
      data.tags ? (Array.isArray(data.tags) ? data.tags.join(', ') : data.tags) : '',
      data.image_url || '',
      data.ivor_confidence || '',
      data.ivor_reasoning || '',
      data.liberation_score || data.liberationScore || 0,
      data.moderation_status || '',
      data.relevance || '',
      data.quality || '',
      data.flags || '',
      data.status || 'pending_review',
      data.notes || ''
    ]
  }
};

/**
 * Google Sheets API client wrapper
 */
class SheetsAPI {
  constructor() {
    this.authToken = null;
    this.initialized = false;
  }

  /**
   * Initialize with authentication token
   */
  async initialize(authToken) {
    if (!authToken) {
      throw new Error('Authentication token required');
    }

    this.authToken = authToken;
    this.initialized = true;

    console.log('Google Sheets API client initialized');
    return true;
  }

  /**
   * Test connection to a specific spreadsheet
   */
  async testConnection(spreadsheetId) {
    if (!this.initialized) {
      throw new Error('API client not initialized');
    }

    try {
      const response = await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}?fields=properties.title`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        title: data.properties?.title || 'Unknown Spreadsheet',
        spreadsheetId: spreadsheetId
      };

    } catch (error) {
      console.error('Sheet connection test failed:', error);
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetInfo(spreadsheetId) {
    if (!this.initialized) {
      throw new Error('API client not initialized');
    }

    try {
      const response = await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}?fields=properties,sheets.properties`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get spreadsheet info:', error);
      throw error;
    }
  }

  /**
   * Initialize sheet headers if needed
   */
  async initializeSheetHeaders(spreadsheetId, contentType) {
    const columnMapping = COLUMN_MAPPINGS[contentType];
    if (!columnMapping) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    try {
      // Check if headers already exist
      const range = 'A1:Z1';
      const response = await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/${range}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let shouldAddHeaders = false;

      if (response.ok) {
        const data = await response.json();
        const existingHeaders = data.values?.[0] || [];

        // Check if headers match expected format
        const expectedHeaders = columnMapping.headers;
        const headersMatch = expectedHeaders.every((header, index) =>
          existingHeaders[index] === header
        );

        if (!headersMatch || existingHeaders.length === 0) {
          shouldAddHeaders = true;
        }
      } else {
        // Sheet is empty or doesn't exist
        shouldAddHeaders = true;
      }

      if (shouldAddHeaders) {
        await this.addHeaders(spreadsheetId, columnMapping.headers);
        console.log(`Headers initialized for ${contentType} sheet`);
      }

      return true;

    } catch (error) {
      console.error('Failed to initialize sheet headers:', error);
      throw error;
    }
  }

  /**
   * Add headers to sheet
   */
  async addHeaders(spreadsheetId, headers) {
    const body = {
      values: [headers]
    };

    const response = await fetch(
      `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/A1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to add headers');
    }

    return await response.json();
  }

  /**
   * Submit content data to appropriate sheet
   */
  async submitContent(spreadsheetId, contentType, data) {
    if (!this.initialized) {
      throw new Error('API client not initialized');
    }

    const columnMapping = COLUMN_MAPPINGS[contentType];
    if (!columnMapping) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    try {
      // Initialize headers if needed
      await this.initializeSheetHeaders(spreadsheetId, contentType);

      // Prepare data row
      const rowData = columnMapping.dataMapping(data);

      // Submit data
      const body = {
        values: [rowData]
      };

      const response = await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/A:A/append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        spreadsheetId: spreadsheetId,
        range: result.tableRange,
        updatedRows: result.updates?.updatedRows || 1,
        submissionId: `${spreadsheetId}_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Content submission failed:', error);
      throw new Error(`Submission failed: ${error.message}`);
    }
  }

  /**
   * Get recent submissions from sheet
   */
  async getRecentSubmissions(spreadsheetId, limit = 10) {
    if (!this.initialized) {
      throw new Error('API client not initialized');
    }

    try {
      const response = await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/A:Z?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length <= 1) {
        return []; // No data rows (just headers or empty)
      }

      const headers = rows[0];
      const dataRows = rows.slice(1).reverse().slice(0, limit); // Get latest entries

      return dataRows.map(row => {
        const submission = {};
        headers.forEach((header, index) => {
          submission[header] = row[index] || '';
        });
        return submission;
      });

    } catch (error) {
      console.error('Failed to get recent submissions:', error);
      throw error;
    }
  }

  /**
   * Update submission status
   */
  async updateSubmissionStatus(spreadsheetId, rowIndex, status, notes = '') {
    if (!this.initialized) {
      throw new Error('API client not initialized');
    }

    try {
      // Get current headers to find status and notes columns
      const headersResponse = await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/A1:Z1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!headersResponse.ok) {
        throw new Error('Failed to get sheet headers');
      }

      const headersData = await headersResponse.json();
      const headers = headersData.values?.[0] || [];

      const statusColumnIndex = headers.indexOf('Status');
      const notesColumnIndex = headers.indexOf('Notes');

      if (statusColumnIndex === -1) {
        throw new Error('Status column not found in sheet');
      }

      // Update status
      const statusColumn = String.fromCharCode(65 + statusColumnIndex); // Convert to column letter
      const statusRange = `${statusColumn}${rowIndex + 2}`; // +2 because row 1 is headers and API is 1-indexed

      await fetch(
        `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/${statusRange}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [[status]]
          })
        }
      );

      // Update notes if column exists and notes provided
      if (notesColumnIndex !== -1 && notes) {
        const notesColumn = String.fromCharCode(65 + notesColumnIndex);
        const notesRange = `${notesColumn}${rowIndex + 2}`;

        await fetch(
          `${SHEETS_CONFIG.API_BASE}/${spreadsheetId}/values/${notesRange}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              values: [[notes]]
            })
          }
        );
      }

      return {
        success: true,
        rowIndex: rowIndex,
        status: status,
        notes: notes
      };

    } catch (error) {
      console.error('Failed to update submission status:', error);
      throw error;
    }
  }

  /**
   * Create a new spreadsheet for a team
   */
  async createTeamSpreadsheet(teamName, contentType) {
    if (!this.initialized) {
      throw new Error('API client not initialized');
    }

    try {
      const spreadsheetTitle = `BLKOUT ${teamName} Team - ${contentType.charAt(0).toUpperCase()}${contentType.slice(1)} Submissions`;

      const body = {
        properties: {
          title: spreadsheetTitle
        },
        sheets: [
          {
            properties: {
              title: 'Submissions',
              gridProperties: {
                rowCount: 1000,
                columnCount: 26
              }
            }
          }
        ]
      };

      const response = await fetch(
        SHEETS_CONFIG.API_BASE,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create spreadsheet');
      }

      const result = await response.json();

      // Initialize with headers
      await this.initializeSheetHeaders(result.spreadsheetId, contentType);

      return {
        success: true,
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        title: spreadsheetTitle
      };

    } catch (error) {
      console.error('Failed to create team spreadsheet:', error);
      throw error;
    }
  }
}

/**
 * Utility functions for working with Google Sheets
 */
const SheetsUtils = {
  /**
   * Extract spreadsheet ID from Google Sheets URL
   */
  extractSpreadsheetId(url) {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]{44})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  },

  /**
   * Validate spreadsheet ID format
   */
  isValidSpreadsheetId(id) {
    return /^[a-zA-Z0-9-_]{44}$/.test(id);
  },

  /**
   * Format data for sheet submission
   */
  formatSubmissionData(rawData, contentType) {
    const columnMapping = COLUMN_MAPPINGS[contentType];
    if (!columnMapping) {
      throw new Error(`Unknown content type: ${contentType}`);
    }

    return columnMapping.dataMapping(rawData);
  },

  /**
   * Get column mapping for content type
   */
  getColumnMapping(contentType) {
    return COLUMN_MAPPINGS[contentType] || null;
  },

  /**
   * Generate sharing URL for spreadsheet
   */
  generateSharingUrl(spreadsheetId) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`;
  }
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SheetsAPI,
    SheetsUtils,
    SHEETS_CONFIG,
    COLUMN_MAPPINGS
  };
} else if (typeof window !== 'undefined') {
  window.SheetsAPI = SheetsAPI;
  window.SheetsUtils = SheetsUtils;
  window.SHEETS_CONFIG = SHEETS_CONFIG;
  window.COLUMN_MAPPINGS = COLUMN_MAPPINGS;
}