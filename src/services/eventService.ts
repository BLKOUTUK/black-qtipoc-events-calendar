import { Event, FilterOptions } from '../types';
import { supabaseApiService } from './supabaseApiService';

// Legacy API configuration (fallback)
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

  // Fetch events from Supabase API (primary) with fallback to legacy API
  async scrapeEvents(): Promise<Event[]> {
    try {
      console.log('🔄 Fetching events from Supabase API...');
      
      // Try Supabase API first
      const supabaseEvents = await supabaseApiService.getEvents({
        dateRange: 'all',
        source: 'all',
        location: '',
        searchTerm: ''
      });
      
      if (supabaseEvents.length > 0) {
        console.log('✅ Supabase events loaded:', supabaseEvents.length);
        this.events = supabaseEvents;
        this.saveEvents();
        return this.events;
      }
      
      console.log('⚠️ No events from Supabase, trying legacy API...');
      
      // Fallback to legacy API
      const response = await fetch(`${API_BASE}/events/upcoming`);
      const data = await response.json();
      
      if (data.events) {
        const apiEvents = data.events.map(convertApiEvent);
        this.events = apiEvents;
        this.saveEvents();
        return this.events;
      }
    } catch (error) {
      console.error('Failed to fetch events from both APIs:', error);
      console.log('📋 Using local storage events as fallback');
      
      // Return existing events from local storage if API fails
      if (this.events.length > 0) {
        return this.events;
      }
      
      throw new Error('Unable to fetch events from any source');
    }
    
    return this.events;
  }

  getEvents(): Event[] {
    return this.events;
  }

  getEvent(id: string): Event | undefined {
    return this.events.find(event => event.id === id);
  }

  async addEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    try {
      // Try to create event via Supabase API first
      const createdEvent = await supabaseApiService.createEvent(event);
      
      if (createdEvent) {
        console.log('✅ Event created via Supabase API:', createdEvent.id);
        this.events.push(createdEvent);
        this.saveEvents();
        return createdEvent;
      }
      
      console.log('⚠️ Supabase creation failed, creating locally');
    } catch (error) {
      console.warn('Failed to create event via API, creating locally:', error);
    }
    
    // Fallback to local creation
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add required fields for new API structure
      organizer_id: event.organizer_id || 'local-organizer',
      registration_required: event.registration_required || false,
      cost: event.cost || 0,
      tags: event.tags || [],
      status: event.status || 'draft'
    };
    
    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    try {
      // Try to update via Supabase API first
      const updatedEvent = await supabaseApiService.updateEvent(id, updates);
      
      if (updatedEvent) {
        console.log('✅ Event updated via Supabase API:', updatedEvent.id);
        const index = this.events.findIndex(event => event.id === id);
        if (index !== -1) {
          this.events[index] = updatedEvent;
          this.saveEvents();
        }
        return updatedEvent;
      }
      
      console.log('⚠️ Supabase update failed, updating locally');
    } catch (error) {
      console.warn('Failed to update event via API, updating locally:', error);
    }
    
    // Fallback to local update
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return null;

    this.events[index] = { 
      ...this.events[index], 
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveEvents();
    return this.events[index];
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      // Try to delete via Supabase API first
      const deleted = await supabaseApiService.deleteEvent(id);
      
      if (deleted) {
        console.log('✅ Event deleted via Supabase API:', id);
        const index = this.events.findIndex(event => event.id === id);
        if (index !== -1) {
          this.events.splice(index, 1);
          this.saveEvents();
        }
        return true;
      }
      
      console.log('⚠️ Supabase deletion failed, deleting locally');
    } catch (error) {
      console.warn('Failed to delete event via API, deleting locally:', error);
    }
    
    // Fallback to local deletion
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return false;

    this.events.splice(index, 1);
    this.saveEvents();
    return true;
  }

  filterEvents(events: Event[], filters: FilterOptions): Event[] {
    // Use Supabase API service's filtering logic for consistency
    return supabaseApiService.filterEvents(events, filters);
  }

  async getModerationStats() {
    try {
      // Try to get stats from Supabase API
      const stats = await supabaseApiService.getModerationStats();
      console.log('📊 Moderation stats from API:', stats);
      return stats;
    } catch (error) {
      console.warn('Failed to get stats from API, calculating locally:', error);
      
      // Fallback to local calculation
      const pending = this.events.filter(e => e.status === 'draft').length;
      const approved = this.events.filter(e => e.status === 'published').length;
      const rejected = this.events.filter(e => e.status === 'cancelled').length;
      
      return {
        pending,
        approved,
        rejected,
        total: this.events.length
      };
    }
  }

  // Moderation methods (updated for new API status values)
  async approveEvent(id: string): Promise<boolean> {
    const event = await this.updateEvent(id, { status: 'published' });
    return event !== null;
  }

  async rejectEvent(id: string): Promise<boolean> {
    const event = await this.updateEvent(id, { status: 'cancelled' });
    return event !== null;
  }

  async flagEvent(id: string, reason: string): Promise<boolean> {
    // For now, flagged events go to draft status for review
    const event = await this.updateEvent(id, { 
      status: 'draft',
      // Note: flagReason is not in the new API schema, could be added to tags
      tags: [...(this.getEvent(id)?.tags || []), `flagged:${reason}`]
    });
    return event !== null;
  }

  getEventsForModeration(): Event[] {
    return this.events.filter(event => 
      event.status === 'draft' || 
      event.tags?.some(tag => tag.startsWith('flagged:'))
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