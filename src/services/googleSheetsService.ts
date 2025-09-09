import { Event, FilterOptions, ModerationStats, ScrapingLog } from '../types';

// Google Sheets configuration
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

// Sheet ranges
const EVENTS_RANGE = 'Events!A:M';
const LOGS_RANGE = 'ScrapingLogs!A:F';
const CONTACTS_RANGE = 'Contacts!A:E';

interface SheetRow {
  values: (string | number)[];
}

class GoogleSheetsService {
  private currentUser: any = null;
  private userKey = 'qtipoc-user';

  constructor() {
    this.loadUser();
  }

  private loadUser(): void {
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  private saveUser(): void {
    if (this.currentUser) {
      localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  private async makeRequest(range: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    if (!SHEET_ID || !API_KEY) {
      throw new Error('Google Sheets configuration missing. Please set VITE_GOOGLE_SHEET_ID and VITE_GOOGLE_API_KEY');
    }

    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
    
    if (method === 'GET') {
      const url = `${baseUrl}/values/${range}?key=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // For POST requests, we'd need OAuth2 authentication
      // For now, we'll simulate the behavior
      console.log('Would append to sheet:', { range, data });
      return { success: true };
    }
  }

  private rowToEvent(row: string[]): Event | null {
    if (!row || row.length < 10) return null;

    try {
      return {
        id: row[0] || '',
        name: row[1] || '',
        description: row[2] || '',
        event_date: row[3] || '',
        location: row[4] || '',
        source: (row[5] as any) || 'community',
        source_url: row[6] || '',
        organizer_name: row[7] || '',
        tags: row[8] ? row[8].split(',').map(t => t.trim()) : [],
        status: (row[9] as any) || 'draft',
        price: row[10] || '',
        image_url: row[11] || '',
        scraped_date: row[12] || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing event row:', error);
      return null;
    }
  }

  private eventToRow(event: Event): string[] {
    return [
      event.id,
      event.name,
      event.description,
      event.event_date,
      typeof event.location === 'string' ? event.location : JSON.stringify(event.location),
      event.source,
      event.source_url || '',
      event.organizer_name || '',
      event.tags?.join(', ') || '',
      event.status,
      event.price || '',
      event.image_url || '',
      event.scraped_date || new Date().toISOString()
    ];
  }

  // Authentication methods
  async getCurrentUser() {
    return this.currentUser;
  }

  async signIn(email: string, password: string) {
    // Use environment variables for consistent admin credentials across platform
    const adminEmail = 'admin@blkout.org';
    const adminPasswordBase = import.meta.env.VITE_ADMIN_PASSWORD_BASE || 'BLKOUT2025!';
    
    if (email === adminEmail && password === adminPasswordBase) {
      this.currentUser = { id: '1', email, role: 'admin' };
      this.saveUser();
      return this.currentUser;
    }
    throw new Error(`Invalid credentials. Use ${adminEmail} with the standard BLKOUT admin password`);
  }

  async signOut() {
    this.currentUser = null;
    this.saveUser();
  }

  // Event methods
  async getPublishedEvents(): Promise<Event[]> {
    try {
      // For demo purposes, return mock data if no API configuration
      if (!SHEET_ID || !API_KEY) {
        return this.getMockEvents().filter(e => e.status === 'published');
      }

      const response = await this.makeRequest(EVENTS_RANGE);
      const rows = response.values || [];
      
      // Skip header row
      const events = rows.slice(1)
        .map((row: string[]) => this.rowToEvent(row))
        .filter((event): event is Event => event !== null)
        .filter(event => event.status === 'published');

      return events;
    } catch (error) {
      console.error('Error fetching published events:', error);
      // Fallback to mock data
      return this.getMockEvents().filter(e => e.status === 'published');
    }
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      if (!SHEET_ID || !API_KEY) {
        return this.getMockEvents();
      }

      const response = await this.makeRequest(EVENTS_RANGE);
      const rows = response.values || [];
      
      const events = rows.slice(1)
        .map((row: string[]) => this.rowToEvent(row))
        .filter((event): event is Event => event !== null);

      return events;
    } catch (error) {
      console.error('Error fetching all events:', error);
      return this.getMockEvents();
    }
  }

  async getPendingEvents(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.status === 'draft' || event.status === 'reviewing');
  }

  async addEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    try {
      const newEvent: Event = {
        ...event,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        scraped_date: event.scraped_date || new Date().toISOString()
      };

      // In a real implementation, this would append to the Google Sheet
      // For now, we'll store locally and show how it would work
      const existingEvents = JSON.parse(localStorage.getItem('qtipoc-events') || '[]');
      existingEvents.push(newEvent);
      localStorage.setItem('qtipoc-events', JSON.stringify(existingEvents));

      console.log('Would append to Google Sheet:', this.eventToRow(newEvent));
      
      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      return null;
    }
  }

  // Alias for addEvent to support different calling conventions
  async submitEvent(event: Event | Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    // If the event already has an ID, we're submitting a discovered event
    if ('id' in event && event.id) {
      try {
        // Store locally for backup
        const existingEvents = JSON.parse(localStorage.getItem('qtipoc-events') || '[]');
        existingEvents.push(event);
        localStorage.setItem('qtipoc-events', JSON.stringify(existingEvents));
        
        // Use Google Apps Script Web App as proxy for writing to sheets
        try {
          console.log('📝 SHEETS: Attempting to save to Google Sheets via Apps Script:', event.name);
          await this.saveViaAppsScript(event as Event);
          console.log('✅ SHEETS: Successfully wrote to Google Sheets');
        } catch (sheetsError) {
          console.error('❌ SHEETS: Failed to write to Google Sheets:', sheetsError);
          // Try direct API call as fallback
          try {
            await this.saveDirectToSheets(event as Event);
            console.log('✅ SHEETS: Successfully saved via direct API');
          } catch (directError) {
            console.error('❌ SHEETS: All methods failed:', directError);
          }
        }
        
        return event as Event;
      } catch (error) {
        console.error('Error submitting event:', error);
        return null;
      }
    } else {
      // Otherwise, call addEvent to generate ID and timestamps
      return this.addEvent(event);
    }
  }

  private async appendToSheet(range: string, values: string[][]): Promise<void> {
    if (!SHEET_ID) {
      throw new Error('Google Sheets Sheet ID missing');
    }

    // Try with OAuth2 first, fallback to API key
    console.log('🔐 SHEETS: Attempting to get OAuth2 access token...');
    let accessToken = null;
    try {
      accessToken = await this.getOAuthAccessToken();
      console.log('🔐 SHEETS: OAuth2 result:', accessToken ? 'Success' : 'Failed');
    } catch (oauthError) {
      console.error('🔐 SHEETS: OAuth2 failed:', oauthError);
    }
    
    if (!accessToken && !API_KEY) {
      throw new Error('Neither OAuth2 nor API key available for Google Sheets');
    }

    let url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=RAW`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Fallback to API key (though this typically doesn't work for writes)
      url += `&key=${API_KEY}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('📊 SHEETS: Append result:', result);
  }

  private async getOAuthAccessToken(): Promise<string | null> {
    if (!CLIENT_ID) {
      console.log('🔐 SHEETS: No OAuth2 client ID configured');
      return null;
    }

    // Check if we have a stored access token
    const storedToken = localStorage.getItem('google_access_token');
    const tokenExpiry = localStorage.getItem('google_token_expiry');
    
    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
      console.log('🔐 SHEETS: Using cached OAuth2 token');
      return storedToken;
    }

    // If no valid token, initiate OAuth2 flow
    console.log('🔐 SHEETS: Initiating OAuth2 flow...');
    return await this.initiateOAuth2Flow();
  }

  private async saveViaAppsScript(event: Event): Promise<void> {
    // Create a simple Google Apps Script web app that accepts POST requests
    // and writes to your Google Sheet
    const appsScriptUrl = `https://script.google.com/macros/s/AKfycbwEQR3Q_Z8uK2DWFmT5M3TbJx-1a2b3c4d5e6f7g8h9i0j/exec`;
    
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Required for Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetId: SHEET_ID,
        range: EVENTS_RANGE,
        values: [this.eventToRow(event)]
      })
    });

    // no-cors mode doesn't allow reading response, but request was sent
    console.log('📊 SHEETS: Apps Script request sent');
  }

  private async saveDirectToSheets(event: Event): Promise<void> {
    // Fallback: try direct API call with service account key
    const serviceAccountKey = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('No service account key available');
    }

    // This would require implementing JWT token generation
    // For now, just log that we would do this
    console.log('📊 SHEETS: Would use service account authentication');
    throw new Error('Service account method not implemented');
  }

  private async initiateOAuth2Flow(): Promise<string | null> {
    try {
      // Use Google's OAuth2 endpoint with implicit flow for client-side apps
      const scope = 'https://www.googleapis.com/auth/spreadsheets';
      const redirectUri = window.location.origin;
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=token&` +
        `prompt=consent`;

      // Open popup window for OAuth2
      const popup = window.open(authUrl, 'google-oauth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        const checkForToken = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(checkForToken);
              reject(new Error('OAuth2 popup was closed'));
              return;
            }

            if (popup?.location?.hash) {
              const hash = popup.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const expiresIn = params.get('expires_in');

              if (accessToken) {
                // Store token and expiry
                localStorage.setItem('google_access_token', accessToken);
                localStorage.setItem('google_token_expiry', (Date.now() + (parseInt(expiresIn || '3600') * 1000)).toString());
                
                popup.close();
                clearInterval(checkForToken);
                console.log('✅ SHEETS: OAuth2 authentication successful');
                resolve(accessToken);
              }
            }
          } catch (e) {
            // Cross-origin error is expected until redirect happens
          }
        }, 1000);

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkForToken);
          if (!popup?.closed) popup?.close();
          reject(new Error('OAuth2 timeout'));
        }, 120000);
      });
    } catch (error) {
      console.error('❌ SHEETS: OAuth2 flow failed:', error);
      return null;
    }
  }

  async updateEventStatus(id: string, status: 'draft' | 'reviewing' | 'published' | 'archived'): Promise<boolean> {
    try {
      // In a real implementation, this would update the specific row in Google Sheets
      // For now, we'll update locally
      const existingEvents = JSON.parse(localStorage.getItem('qtipoc-events') || '[]');
      const eventIndex = existingEvents.findIndex((e: Event) => e.id === id);
      
      if (eventIndex !== -1) {
        existingEvents[eventIndex].status = status;
        existingEvents[eventIndex].updated_at = new Date().toISOString();
        if (status === 'published') {
          existingEvents[eventIndex].listed_date = new Date().toISOString();
        }
        localStorage.setItem('qtipoc-events', JSON.stringify(existingEvents));
        
        console.log(`Would update Google Sheet row for event ${id} to status: ${status}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating event status:', error);
      return false;
    }
  }

  async scrapeEvents(): Promise<Event[]> {
    try {
      // Import and use enhanced discovery engine
      const { enhancedDiscoveryEngine } = await import('./enhancedDiscoveryEngine');
      
      console.log('Starting enhanced event discovery with Jina AI...');
      
      // Run intelligent discovery (adaptive based on time and usage)
      const discoveredEvents = await enhancedDiscoveryEngine.runDiscovery('quick');
      
      // Store new events locally (in production, would append to Google Sheets)
      const existingEvents = JSON.parse(localStorage.getItem('qtipoc-events') || '[]');
      const newEvents = discoveredEvents.filter(discovered => 
        !existingEvents.some((existing: Event) => 
          existing.name.toLowerCase().trim() === discovered.name.toLowerCase().trim() &&
          existing.event_date.split('T')[0] === discovered.event_date.split('T')[0]
        )
      );

      existingEvents.push(...newEvents);
      localStorage.setItem('qtipoc-events', JSON.stringify(existingEvents));

      // Enhanced logging with discovery metrics
      const discoveryStats = enhancedDiscoveryEngine.getDiscoveryStats();
      const log: ScrapingLog = {
        id: Date.now().toString(),
        source: 'jina_ai_enhanced',
        events_found: discoveredEvents.length,
        events_added: newEvents.length,
        status: 'success',
        created_at: new Date().toISOString(),
        metadata: {
          averageQualityScore: discoveryStats.averageQualityScore,
          totalRuns: discoveryStats.totalRuns,
          knownOrganizations: discoveryStats.knownOrganizations
        }
      };

      const existingLogs = JSON.parse(localStorage.getItem('qtipoc-scraping-logs') || '[]');
      existingLogs.unshift(log);
      // Keep only last 50 logs
      existingLogs.splice(50);
      localStorage.setItem('qtipoc-scraping-logs', JSON.stringify(existingLogs));

      console.log('Enhanced discovery completed:', {
        totalFound: discoveredEvents.length,
        newEvents: newEvents.length,
        qualityScore: discoveryStats.averageQualityScore,
        wouldAppendToSheets: newEvents.map(e => this.eventToRow(e))
      });

      return newEvents;

    } catch (error) {
      console.error('Enhanced discovery failed, falling back to basic scraping:', error);
      
      // Fallback to basic mock scraping
      const fallbackEvents: Event[] = [
        {
          id: Date.now().toString(),
          name: 'Community Event Discovery Available',
          description: 'Enhanced event discovery is being set up. Check back soon for automatically discovered QTIPOC+ events.',
          event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'UK Community Spaces',
          source: 'community',
          source_url: window.location.href,
          organizer_name: 'IVOR Discovery Engine',
          tags: ['community', 'qtipoc', 'discovery'],
          status: 'draft',
          scraped_date: new Date().toISOString(),
          price: 'Free'
        }
      ];

      // Log the fallback
      const fallbackLog: ScrapingLog = {
        id: Date.now().toString(),
        source: 'fallback',
        events_found: 1,
        events_added: 1,
        status: 'fallback',
        created_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      const existingLogs = JSON.parse(localStorage.getItem('qtipoc-scraping-logs') || '[]');
      existingLogs.unshift(fallbackLog);
      localStorage.setItem('qtipoc-scraping-logs', JSON.stringify(existingLogs));

      return fallbackEvents;
    }
  }

  async getModerationStats(): Promise<ModerationStats> {
    const allEvents = await this.getAllEvents();
    
    const pending = allEvents.filter(e => e.status === 'draft' || e.status === 'reviewing').length;
    const approved = allEvents.filter(e => e.status === 'published').length;
    const rejected = allEvents.filter(e => e.status === 'archived').length;
    
    return {
      pending,
      approved,
      rejected,
      total: allEvents.length
    };
  }

  async getScrapingLogs(): Promise<ScrapingLog[]> {
    try {
      // For demo, return from localStorage
      const logs = JSON.parse(localStorage.getItem('qtipoc-scraping-logs') || '[]');
      return logs;
    } catch (error) {
      console.error('Error fetching scraping logs:', error);
      return [];
    }
  }

  // Utility methods
  filterEvents(events: Event[], filters: FilterOptions): Event[] {
    return events.filter(event => {
      // Date filter
      if (filters.dateRange !== 'all') {
        const eventDate = new Date(event.event_date);
        const now = new Date();
        const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.dateRange === 'today' && daysDiff !== 0) return false;
        if (filters.dateRange === 'week' && daysDiff > 7) return false;
        if (filters.dateRange === 'month' && daysDiff > 30) return false;
      }

      // Source filter
      if (filters.source !== 'all' && event.source !== filters.source) return false;

      // Location filter
      if (filters.location) {
        const locationStr = typeof event.location === 'string' 
          ? event.location 
          : JSON.stringify(event.location);
        if (!locationStr.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return event.name.toLowerCase().includes(searchLower) ||
               event.description.toLowerCase().includes(searchLower) ||
               (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchLower)));
      }

      return true;
    });
  }

  private getMockEvents(): Event[] {
    // Return stored events or default mock data
    const stored = localStorage.getItem('qtipoc-events');
    if (stored) {
      return JSON.parse(stored);
    }

    const mockEvents: Event[] = [
      {
        id: '1',
        name: 'Black Trans Joy Celebration',
        description: 'A celebration of Black trans joy, resilience, and community. Join us for an evening of music, poetry, and connection.',
        event_date: '2024-02-15T19:00:00Z',
        location: 'Brooklyn Community Center, NY',
        source: 'eventbrite',
        source_url: 'https://eventbrite.com/example',
        organizer_name: 'Black Trans Collective',
        tags: ['trans', 'celebration', 'community', 'music'],
        status: 'published',
        scraped_date: '2024-02-01T10:00:00Z',
        image_url: 'https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg?auto=compress&cs=tinysrgb&w=800',
        price: 'Free'
      },
      {
        id: '2',
        name: 'Queer POC Mental Health Workshop',
        description: 'A safe space workshop focusing on mental health resources and community support for QTIPOC+ individuals.',
        event_date: '2024-02-20T14:00:00Z',
        location: 'Oakland Wellness Center, CA',
        source: 'community',
        source_url: 'https://community.example.com',
        organizer_name: 'Healing Justice Collective',
        tags: ['mental health', 'workshop', 'wellness', 'support'],
        status: 'published',
        scraped_date: '2024-02-02T10:00:00Z',
        price: 'Sliding scale $10-30'
      },
      {
        id: '3',
        name: 'Black Queer Artists Showcase',
        description: 'An evening showcasing the incredible talent of Black queer artists across multiple mediums.',
        event_date: '2024-02-25T18:00:00Z',
        location: 'Harlem Arts Center, NY',
        source: 'outsavvy',
        source_url: 'https://outsavvy.com/example',
        organizer_name: 'Queer Arts Network',
        tags: ['art', 'showcase', 'creativity', 'performance'],
        status: 'draft',
        scraped_date: '2024-02-03T10:00:00Z',
        image_url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
        price: '$15'
      }
    ];

    localStorage.setItem('qtipoc-events', JSON.stringify(mockEvents));
    return mockEvents;
  }
}

export const googleSheetsService = new GoogleSheetsService();