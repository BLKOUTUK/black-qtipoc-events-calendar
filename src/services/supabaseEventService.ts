import { createClient } from '@supabase/supabase-js';
import { Event, FilterOptions, ModerationStats, ScrapingLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Missing required Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseEventService {
  // Authentication methods
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data.user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Public methods - no authentication required
  async getPublishedEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:contacts(name)
        `)
        .eq('status', 'approved')
        .order('event_date', { ascending: true });

      if (error) throw error;

      return data?.map(event => ({
        ...event,
        organizer_name: event.organizer?.name || event.organizer_name || 'Unknown Organizer',
        location: typeof event.location === 'string' ? event.location : JSON.stringify(event.location)
      })) || [];
    } catch (error) {
      console.error('Error fetching published events:', error);
      return [];
    }
  }

  async addEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    try {
      // Create or find contact for organizer
      let organizerId = null;
      if (event.organizer_name) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('name', event.organizer_name)
          .single();

        if (existingContact) {
          organizerId = existingContact.id;
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              name: event.organizer_name,
              email: event.contact_email || `${event.organizer_name.toLowerCase().replace(/\s+/g, '.')}@example.com`
            })
            .select()
            .single();

          if (!contactError && newContact) {
            organizerId = newContact.id;
          }
        }
      }

      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: event.name,
          description: event.description,
          event_date: event.event_date,
          location: event.location,
          source: event.source,
          source_url: event.source_url,
          organizer_id: organizerId,
          organizer_name: event.organizer_name,
          tags: event.tags || [],
          status: 'draft', // All public submissions start as draft
          scraped_date: event.scraped_date || new Date().toISOString(),
          image_url: event.image_url,
          price: event.price,
          contact_email: event.contact_email,
          registration_link: event.registration_link,
          target_audience: event.target_audience
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding event:', error);
      return null;
    }
  }

  // Authenticated methods - require login
  async getAllEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:contacts(name)
        `)
        .order('event_date', { ascending: true });

      if (error) throw error;

      return data?.map(event => ({
        ...event,
        organizer_name: event.organizer?.name || event.organizer_name || 'Unknown Organizer',
        location: typeof event.location === 'string' ? event.location : JSON.stringify(event.location)
      })) || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  async getPendingEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:contacts(name)
        `)
        .in('status', ['draft', 'reviewing'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(event => ({
        ...event,
        organizer_name: event.organizer?.name || event.organizer_name || 'Unknown Organizer',
        location: typeof event.location === 'string' ? event.location : JSON.stringify(event.location)
      })) || [];
    } catch (error) {
      console.error('Error fetching pending events:', error);
      return [];
    }
  }

  async updateEventStatus(id: string, status: 'draft' | 'reviewing' | 'published' | 'archived'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          status,
          listed_date: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating event status:', error);
      return false;
    }
  }

  async scrapeEvents(): Promise<Event[]> {
    try {
      // Call the edge function for scraping
      const { data, error } = await supabase.functions.invoke('scrape-all-sources', {
        body: { sources: ['eventbrite', 'facebook'] }
      });

      if (error) throw error;
      return data?.events || [];
    } catch (error) {
      console.error('Error scraping events:', error);
      return [];
    }
  }

  async getModerationStats(): Promise<ModerationStats> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('status');

      if (error) throw error;

      const stats = data?.reduce((acc, event) => {
        if (event.status === 'draft' || event.status === 'reviewing') {
          acc.pending++;
        } else if (event.status === 'published') {
          acc.approved++;
        } else if (event.status === 'archived') {
          acc.rejected++;
        }
        acc.total++;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0, total: 0 });

      return stats || { pending: 0, approved: 0, rejected: 0, total: 0 };
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      return { pending: 0, approved: 0, rejected: 0, total: 0 };
    }
  }

  async getScrapingLogs(): Promise<ScrapingLog[]> {
    try {
      const { data, error } = await supabase
        .from('scraping_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
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
}

export const supabaseEventService = new SupabaseEventService();