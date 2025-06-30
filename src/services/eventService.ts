import { Event, FilterOptions } from '../types';

// Mock data for demonstration
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Black Trans Joy Celebration',
    description: 'A celebration of Black trans joy, resilience, and community. Join us for an evening of music, poetry, and connection.',
    startDate: '2024-02-15T19:00:00Z',
    endDate: '2024-02-15T22:00:00Z',
    location: 'Brooklyn Community Center, NY',
    source: 'eventbrite',
    sourceUrl: 'https://eventbrite.com/example',
    organizer: 'Black Trans Collective',
    tags: ['trans', 'celebration', 'community', 'music'],
    status: 'approved',
    scrapedDate: '2024-02-01T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 'Free'
  },
  {
    id: '2',
    title: 'Queer POC Mental Health Workshop',
    description: 'A safe space workshop focusing on mental health resources and community support for QTIPOC+ individuals.',
    startDate: '2024-02-20T14:00:00Z',
    endDate: '2024-02-20T16:00:00Z',
    location: 'Oakland Wellness Center, CA',
    source: 'community',
    sourceUrl: 'https://community.example.com',
    organizer: 'Healing Justice Collective',
    tags: ['mental health', 'workshop', 'wellness', 'support'],
    status: 'approved',
    scrapedDate: '2024-02-02T10:00:00Z',
    price: 'Sliding scale $10-30'
  },
  {
    id: '3',
    title: 'Black Queer Artists Showcase',
    description: 'An evening showcasing the incredible talent of Black queer artists across multiple mediums.',
    startDate: '2024-02-25T18:00:00Z',
    endDate: '2024-02-25T21:00:00Z',
    location: 'Harlem Arts Center, NY',
    source: 'outsavvy',
    sourceUrl: 'https://outsavvy.com/example',
    organizer: 'Queer Arts Network',
    tags: ['art', 'showcase', 'creativity', 'performance'],
    status: 'pending',
    scrapedDate: '2024-02-03T10:00:00Z',
    imageUrl: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: '$15'
  }
];

// Keywords for filtering Black QTIPOC+ relevant events
const relevantKeywords = [
  'black', 'african american', 'afro', 'qtipoc', 'queer', 'trans', 'transgender', 
  'lgbtq', 'pride', 'intersectional', 'poc', 'bipoc', 'melanin', 'community',
  'liberation', 'justice', 'healing', 'wellness', 'safe space', 'inclusive'
];

class EventService {
  private events: Event[] = [];
  private storageKey = 'qtipoc-events';

  constructor() {
    this.loadEvents();
  }

  private loadEvents(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.events = JSON.parse(stored);
    } else {
      this.events = mockEvents;
      this.saveEvents();
    }
  }

  private saveEvents(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.events));
  }

  // Simulate automated event scraping
  async scrapeEvents(): Promise<Event[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock scraped events
    const scrapedEvents: Event[] = [
      {
        id: Date.now().toString(),
        title: 'Black Love Poetry Night',
        description: 'An intimate evening of poetry celebrating Black love in all its forms.',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Atlanta Poetry Lounge, GA',
        source: 'eventbrite',
        sourceUrl: 'https://eventbrite.com/scraped',
        organizer: 'Poetry & Love Collective',
        tags: ['poetry', 'love', 'intimate', 'arts'],
        status: 'pending',
        scrapedDate: new Date().toISOString(),
        price: '$12'
      }
    ];

    // Add scraped events to existing events
    const newEvents = scrapedEvents.filter(scraped => 
      !this.events.some(existing => existing.title === scraped.title)
    );

    this.events.push(...newEvents);
    this.saveEvents();
    return newEvents;
  }

  getAllEvents(): Event[] {
    return this.events;
  }

  getApprovedEvents(): Event[] {
    return this.events.filter(event => event.status === 'approved');
  }

  getPendingEvents(): Event[] {
    return this.events.filter(event => event.status === 'pending');
  }

  addEvent(event: Omit<Event, 'id' | 'scrapedDate'>): Event {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      scrapedDate: new Date().toISOString()
    };
    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  updateEventStatus(id: string, status: 'approved' | 'rejected'): void {
    const event = this.events.find(e => e.id === id);
    if (event) {
      event.status = status;
      this.saveEvents();
    }
  }

  filterEvents(events: Event[], filters: FilterOptions): Event[] {
    return events.filter(event => {
      // Date filter
      if (filters.dateRange !== 'all') {
        const eventDate = new Date(event.startDate);
        const now = new Date();
        const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.dateRange === 'today' && daysDiff !== 0) return false;
        if (filters.dateRange === 'week' && daysDiff > 7) return false;
        if (filters.dateRange === 'month' && daysDiff > 30) return false;
      }

      // Source filter
      if (filters.source !== 'all' && event.source !== filters.source) return false;

      // Location filter
      if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) return false;

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return event.title.toLowerCase().includes(searchLower) ||
               event.description.toLowerCase().includes(searchLower) ||
               event.tags.some(tag => tag.toLowerCase().includes(searchLower));
      }

      return true;
    });
  }

  getModerationStats() {
    const pending = this.events.filter(e => e.status === 'pending').length;
    const approved = this.events.filter(e => e.status === 'approved').length;
    const rejected = this.events.filter(e => e.status === 'rejected').length;
    
    return {
      pending,
      approved,
      rejected,
      total: this.events.length
    };
  }
}

export const eventService = new EventService();