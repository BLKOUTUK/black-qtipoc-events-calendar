import { Event, FilterOptions } from '../types';

// API configuration
const API_BASE = 'http://localhost:9000/api';

// Convert API response to Event format
const convertApiEvent = (apiEvent: any): Event => ({
  id: apiEvent.id,
  title: apiEvent.title,
  description: apiEvent.description,
  startDate: apiEvent.start_time,
  endDate: apiEvent.end_time,
  location: apiEvent.location,
  source: 'api',
  sourceUrl: apiEvent.registration_url,
  organizer: apiEvent.organizer,
  tags: apiEvent.tags || [],
  status: 'approved',
  scrapedDate: new Date().toISOString(),
  imageUrl: 'https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg?auto=compress&cs=tinysrgb&w=800',
  price: apiEvent.is_free ? 'Free' : (apiEvent.price || 'Paid'),
  relevanceScore: apiEvent.relevance_score || 0.5
});

// Common QTIPOC+ event keywords for filtering
const qtipocKeywords = [
  'black', 'african', 'caribbean', 'afro', 'poc', 'people of color',
  'queer', 'lgbt', 'lgbtq', 'lgbtqia', 'trans', 'transgender', 'non-binary',
  'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual',
  'qtipoc', 'qpoc', 'bpoc', 'bipoc',
  'community', 'collective', 'support', 'meetup', 'gathering',
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
      this.events = [];
    }
  }

  private saveEvents(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.events));
  }

  // Fetch events from API
  async scrapeEvents(): Promise<Event[]> {
    try {
      const response = await fetch(`${API_BASE}/events/upcoming`);
      const data = await response.json();
      
      if (data.events) {
        const apiEvents = data.events.map(convertApiEvent);
        this.events = apiEvents;
        this.saveEvents();
        return this.events;
      }
    } catch (error) {
      console.error('Failed to fetch events from API:', error);
      throw new Error('Unable to fetch events from API');
    }
    
    return this.events;
  }

  getEvents(): Event[] {
    return this.events;
  }

  getEvent(id: string): Event | undefined {
    return this.events.find(event => event.id === id);
  }

  async addEvent(event: Omit<Event, 'id' | 'scrapedDate'>): Promise<Event> {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      scrapedDate: new Date().toISOString()
    };
    
    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return null;

    this.events[index] = { ...this.events[index], ...updates };
    this.saveEvents();
    return this.events[index];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return false;

    this.events.splice(index, 1);
    this.saveEvents();
    return true;
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

  // Moderation methods
  async approveEvent(id: string): Promise<boolean> {
    const event = await this.updateEvent(id, { status: 'approved' });
    return event !== null;
  }

  async rejectEvent(id: string): Promise<boolean> {
    const event = await this.updateEvent(id, { status: 'rejected' });
    return event !== null;
  }

  async flagEvent(id: string, reason: string): Promise<boolean> {
    const event = await this.updateEvent(id, { 
      status: 'flagged',
      flagReason: reason 
    });
    return event !== null;
  }

  getEventsForModeration(): Event[] {
    return this.events.filter(event => 
      event.status === 'pending' || 
      event.status === 'flagged'
    );
  }

  // Search events
  async searchEvents(query: string, limit: number = 10): Promise<Event[]> {
    try {
      const response = await fetch(`${API_BASE}/events/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();
      
      if (data.events) {
        return data.events.map(convertApiEvent);
      }
    } catch (error) {
      console.error('Failed to search events:', error);
    }
    
    return [];
  }
}

export const eventService = new EventService();