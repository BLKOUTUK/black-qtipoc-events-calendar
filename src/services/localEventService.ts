import { Event, FilterOptions, ModerationStats, ScrapingLog } from '../types';

// Mock data for demonstration
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
  },
  {
    id: '4',
    name: 'Black Liberation Book Club',
    description: 'Monthly discussion of books by Black authors focusing on liberation, justice, and community organizing.',
    event_date: '2024-03-01T18:30:00Z',
    location: 'Chicago Community Library, IL',
    source: 'community',
    source_url: 'https://example.com/book-club',
    organizer_name: 'Liberation Literature Collective',
    tags: ['books', 'discussion', 'liberation', 'education'],
    status: 'published',
    scraped_date: '2024-02-05T10:00:00Z',
    price: 'Free'
  },
  {
    id: '5',
    name: 'Intersectional Healing Circle',
    description: 'A monthly gathering for Black QTIPOC+ folks to share experiences, practice healing, and build community.',
    event_date: '2024-03-10T15:00:00Z',
    location: 'Atlanta Wellness Space, GA',
    source: 'facebook',
    source_url: 'https://facebook.com/events/example',
    organizer_name: 'Healing Justice ATL',
    tags: ['healing', 'community', 'support', 'wellness'],
    status: 'draft',
    scraped_date: '2024-02-06T10:00:00Z',
    price: 'Donation based'
  }
];

const mockScrapingLogs: ScrapingLog[] = [
  {
    id: '1',
    source: 'eventbrite',
    events_found: 45,
    events_added: 12,
    status: 'success',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    source: 'facebook',
    events_found: 23,
    events_added: 8,
    status: 'partial',
    error_message: 'Some events could not be processed',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    source: 'outsavvy',
    events_found: 15,
    events_added: 3,
    status: 'success',
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

class LocalEventService {
  private events: Event[] = [];
  private scrapingLogs: ScrapingLog[] = [];
  private currentUser: any = null;
  private storageKey = 'qtipoc-events';
  private logsKey = 'qtipoc-scraping-logs';
  private userKey = 'qtipoc-user';

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    // Load events
    const storedEvents = localStorage.getItem(this.storageKey);
    if (storedEvents) {
      this.events = JSON.parse(storedEvents);
    } else {
      this.events = mockEvents;
      this.saveEvents();
    }

    // Load scraping logs
    const storedLogs = localStorage.getItem(this.logsKey);
    if (storedLogs) {
      this.scrapingLogs = JSON.parse(storedLogs);
    } else {
      this.scrapingLogs = mockScrapingLogs;
      this.saveScrapingLogs();
    }

    // Load user
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  private saveEvents(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.events));
  }

  private saveScrapingLogs(): void {
    localStorage.setItem(this.logsKey, JSON.stringify(this.scrapingLogs));
  }

  private saveUser(): void {
    if (this.currentUser) {
      localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  // Authentication methods
  async getCurrentUser() {
    return this.currentUser;
  }

  async signIn(email: string, password: string) {
    // Simple mock authentication
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
    await this.simulateDelay();
    return this.events.filter(event => event.status === 'published');
  }

  async getAllEvents(): Promise<Event[]> {
    await this.simulateDelay();
    return this.events;
  }

  async getPendingEvents(): Promise<Event[]> {
    await this.simulateDelay();
    return this.events.filter(event => event.status === 'draft' || event.status === 'reviewing');
  }

  async addEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    await this.simulateDelay();
    
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scraped_date: event.scraped_date || new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  async updateEventStatus(id: string, status: 'draft' | 'reviewing' | 'published' | 'archived'): Promise<boolean> {
    await this.simulateDelay();
    
    const event = this.events.find(e => e.id === id);
    if (event) {
      event.status = status;
      event.updated_at = new Date().toISOString();
      if (status === 'published') {
        event.listed_date = new Date().toISOString();
      }
      this.saveEvents();
      return true;
    }
    return false;
  }

  async scrapeEvents(): Promise<Event[]> {
    await this.simulateDelay(2000); // Longer delay to simulate scraping
    
    // Mock scraping results
    const mockScrapedEvents: Event[] = [
      {
        id: Date.now().toString(),
        name: 'Black Love Poetry Night',
        description: 'An intimate evening of poetry celebrating Black love in all its forms.',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Atlanta Poetry Lounge, GA',
        source: 'eventbrite',
        source_url: 'https://eventbrite.com/scraped',
        organizer_name: 'Poetry & Love Collective',
        tags: ['poetry', 'love', 'intimate', 'arts'],
        status: 'draft',
        scraped_date: new Date().toISOString(),
        price: '$12'
      },
      {
        id: (Date.now() + 1).toString(),
        name: 'Queer Black Entrepreneurs Meetup',
        description: 'Networking and support for Black QTIPOC+ entrepreneurs and business owners.',
        event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'San Francisco Business Hub, CA',
        source: 'facebook',
        source_url: 'https://facebook.com/events/scraped',
        organizer_name: 'Black Queer Business Network',
        tags: ['business', 'networking', 'entrepreneurship', 'community'],
        status: 'draft',
        scraped_date: new Date().toISOString(),
        price: 'Free'
      }
    ];

    // Add new events that don't already exist
    const newEvents = mockScrapedEvents.filter(scraped => 
      !this.events.some(existing => existing.name === scraped.name)
    );

    this.events.push(...newEvents);
    this.saveEvents();

    // Add scraping log
    const log: ScrapingLog = {
      id: Date.now().toString(),
      source: 'all_sources',
      events_found: mockScrapedEvents.length,
      events_added: newEvents.length,
      status: 'success',
      created_at: new Date().toISOString()
    };

    this.scrapingLogs.unshift(log);
    this.saveScrapingLogs();

    return newEvents;
  }

  async getModerationStats(): Promise<ModerationStats> {
    await this.simulateDelay();
    
    const pending = this.events.filter(e => e.status === 'draft' || e.status === 'reviewing').length;
    const approved = this.events.filter(e => e.status === 'published').length;
    const rejected = this.events.filter(e => e.status === 'archived').length;
    
    return {
      pending,
      approved,
      rejected,
      total: this.events.length
    };
  }

  async getScrapingLogs(): Promise<ScrapingLog[]> {
    await this.simulateDelay();
    return this.scrapingLogs;
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

  private async simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const localEventService = new LocalEventService();