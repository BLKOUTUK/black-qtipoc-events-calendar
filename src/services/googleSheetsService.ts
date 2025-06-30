import { Event, FilterOptions, ModerationStats, ScrapingLog } from '../types';

// Google Sheets configuration
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

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
    // Simple mock authentication for demo
    if (email === 'admin@example.com' && password === 'admin123') {
      this.currentUser = { id: '1', email, role: 'admin' };
      this.saveUser();
      return this.currentUser;
    }
    throw new Error('Invalid credentials. Use admin@example.com / admin123');
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
    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock scraped events
    const mockScrapedEvents: Event[] = [
      {
        id: Date.now().toString(),
        name: 'Black Joy Meditation Circle',
        description: 'A weekly meditation and mindfulness practice centered on Black joy and healing.',
        event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Oakland Healing Center, CA',
        source: 'eventbrite',
        source_url: 'https://eventbrite.com/scraped-meditation',
        organizer_name: 'Black Wellness Collective',
        tags: ['meditation', 'healing', 'wellness', 'community'],
        status: 'draft',
        scraped_date: new Date().toISOString(),
        price: 'Donation based'
      },
      {
        id: (Date.now() + 1).toString(),
        name: 'Queer Black Film Festival',
        description: 'Celebrating Black QTIPOC+ filmmakers and storytellers with a weekend of screenings and discussions.',
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Brooklyn Arts Cinema, NY',
        source: 'facebook',
        source_url: 'https://facebook.com/events/film-festival',
        organizer_name: 'Black Queer Cinema Collective',
        tags: ['film', 'arts', 'storytelling', 'festival'],
        status: 'draft',
        scraped_date: new Date().toISOString(),
        price: '$20-35'
      }
    ];

    // Store scraped events locally (in real app, would append to Google Sheet)
    const existingEvents = JSON.parse(localStorage.getItem('qtipoc-events') || '[]');
    const newEvents = mockScrapedEvents.filter(scraped => 
      !existingEvents.some((existing: Event) => existing.name === scraped.name)
    );

    existingEvents.push(...newEvents);
    localStorage.setItem('qtipoc-events', JSON.stringify(existingEvents));

    // Log scraping session
    const log: ScrapingLog = {
      id: Date.now().toString(),
      source: 'all_sources',
      events_found: mockScrapedEvents.length,
      events_added: newEvents.length,
      status: 'success',
      created_at: new Date().toISOString()
    };

    const existingLogs = JSON.parse(localStorage.getItem('qtipoc-scraping-logs') || '[]');
    existingLogs.unshift(log);
    localStorage.setItem('qtipoc-scraping-logs', JSON.stringify(existingLogs));

    console.log('Would append scraping results to Google Sheets:', {
      events: newEvents.map(e => this.eventToRow(e)),
      log: [log.id, log.source, log.events_found, log.events_added, log.status, log.created_at]
    });

    return newEvents;
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