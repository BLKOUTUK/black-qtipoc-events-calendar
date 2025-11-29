import { createClient } from '@supabase/supabase-js';
import { Event, FilterOptions, ModerationStats, ScrapingLog } from '../types';

// Use main platform Supabase database (blkout-community-platform)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgjengudzfickgomjqmz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0';

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
    console.log('🔍 getPublishedEvents called - using direct fetch API');

    try {
      // NO DATE FILTER - show all approved events regardless of date
      // This ensures we don't accidentally filter out events due to timezone/date issues
      console.log('🔍 Fetching all approved events (no date filter)');

      const url = `https://bgjengudzfickgomjqmz.supabase.co/rest/v1/events?status=eq.approved&select=id,title,date,description,location,virtual_link,organizer,source,tags,url,cost,start_time,end_time,end_date,recurrence_rule,recurrence_parent_id,is_recurring_instance,original_start_date&order=date.asc`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      console.log('🔍 Direct API response status:', response.status);

      if (!response.ok) {
        console.error('🔍 API response not OK:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 Direct API data:', data);

      if (!data || data.length === 0) {
        console.log('🔍 No approved events found - returning fallback event');
        return [{
          id: 'api-fallback-1',
          name: 'API Connection Successful',
          title: 'API Connection Successful',
          description: 'Direct API connection worked, but no approved events were found in the database',
          event_date: '2025-03-20',
          location: 'Direct API Test',
          organizer_name: 'System Test',
          source: 'api-test',
          source_url: '',
          tags: ['api-test'],
          image_url: '',
          price: 'Free',
          contact_email: '',
          registration_link: '',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          start_date: '2025-03-20',
          end_date: '2025-03-20',
          event_type: 'workshop' as any,
          organizer_id: 'test',
          max_attendees: 50,
          registration_required: false,
          cost: 0,
          featured_image: '',
          profiles: null
        }];
      }

      console.log(`🔍 Found ${data.length} approved events via direct API`);

      // Remove duplicates based on event ID
      const uniqueData = Array.from(new Map(data.map((event: any) => [event.id, event])).values());
      console.log(`🔍 After deduplication: ${uniqueData.length} unique events`);

      // Map database fields to frontend format
      const mappedEvents = uniqueData.map((event: any) => ({
        id: event.id,
        name: event.title || 'Untitled Event',
        title: event.title || 'Untitled Event',
        description: event.description || '',
        event_date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        end_date: event.end_date,
        location: event.virtual_link ? 'Online Event' : (event.location || 'Location TBA'),
        virtual_link: event.virtual_link,
        organizer_name: event.organizer || 'Unknown Organizer',
        source: event.source || 'community',
        source_url: event.url || '',
        url: event.url || '',
        tags: Array.isArray(event.tags) ? event.tags : [],
        image_url: '',
        price: event.cost || 'Free',
        cost: event.cost,
        contact_email: '',
        recurrence_rule: event.recurrence_rule,
        recurrence_parent_id: event.recurrence_parent_id,
        is_recurring_instance: event.is_recurring_instance,
        original_start_date: event.original_start_date,
        registration_link: event.url || '',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        start_date: event.date,
        event_type: 'community' as any,
        organizer_id: 'unknown',
        max_attendees: 50,
        registration_required: false,
        featured_image: '',
        profiles: null
      }));
      
      console.log('🔍 Mapped events from direct API:', mappedEvents);
      return mappedEvents;

    } catch (error) {
      console.error('🔍 Direct API error:', error);
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

  async getApprovedEvents(): Promise<Event[]> {
    // Alias for getPublishedEvents - returns approved events for moderation dashboard
    return this.getPublishedEvents();
  }

  async getPendingEvents(): Promise<Event[]> {
    try {
      console.log('🔍 Fetching pending events via direct API');

      // Only fetch draft and reviewing events, explicitly excluding archived and approved
      const url = 'https://bgjengudzfickgomjqmz.supabase.co/rest/v1/events?status=in.(draft,reviewing)&select=*&order=created_at.desc';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Pending events response status:', response.status);

      if (!response.ok) {
        console.error('🔍 Failed to fetch pending events:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('🔍 Pending events data:', data.length, 'events');

      return data.map((event: any) => ({
        ...event,
        // Map to frontend format
        name: event.title || 'Untitled Event',
        event_date: event.date,
        organizer_name: event.organizer || 'Unknown Organizer',
        location: event.location || 'TBA',
        source: event.source || 'submission',
        tags: Array.isArray(event.tags) ? event.tags : [],
        price: event.cost || 'Free'
      }));
    } catch (error) {
      console.error('🔍 Error fetching pending events via direct API:', error);
      return [];
    }
  }

  async updateEvent(id: string, edits: Partial<Event>): Promise<boolean> {
    try {
      console.log('🔍 Updating event via direct API:', id, edits);

      // Map frontend Event fields to database column names
      const dbFields: any = {};

      if (edits.title !== undefined) dbFields.title = edits.title;
      if (edits.name !== undefined) dbFields.title = edits.name; // name -> title
      if (edits.description !== undefined) dbFields.description = edits.description;
      if (edits.event_date !== undefined) dbFields.date = edits.event_date; // event_date -> date
      if (edits.start_date !== undefined) dbFields.date = edits.start_date; // start_date -> date
      if (edits.start_time !== undefined) dbFields.start_time = edits.start_time; // preserve start_time
      if (edits.end_time !== undefined) dbFields.end_time = edits.end_time; // preserve end_time
      if (edits.location !== undefined) dbFields.location = edits.location;
      if (edits.organizer_name !== undefined) dbFields.organizer = edits.organizer_name; // organizer_name -> organizer
      if (edits.source !== undefined) dbFields.source = edits.source;
      if (edits.source_url !== undefined) dbFields.url = edits.source_url; // source_url -> url
      if (edits.url !== undefined) dbFields.url = edits.url; // direct url field
      if (edits.image_url !== undefined) dbFields.image_url = edits.image_url; // preserve image_url
      if (edits.featured_image !== undefined) dbFields.featured_image = edits.featured_image; // preserve featured_image
      if (edits.tags !== undefined) dbFields.tags = edits.tags;
      if (edits.price !== undefined) dbFields.cost = edits.price; // price -> cost
      if (edits.status !== undefined) dbFields.status = edits.status;

      dbFields.updated_at = new Date().toISOString();

      console.log('🔍 Mapped database fields:', dbFields);

      const url = `https://bgjengudzfickgomjqmz.supabase.co/rest/v1/events?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(dbFields)
      });

      console.log('🔍 Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Update failed:', response.status, response.statusText, errorText);
        return false;
      }

      console.log('🔍 Event updated successfully');
      return true;
    } catch (error) {
      console.error('🔍 Error updating event via direct API:', error);
      return false;
    }
  }

  async updateEventStatus(id: string, status: 'draft' | 'reviewing' | 'published' | 'archived'): Promise<boolean> {
    try {
      console.log('🔍 Updating event status via direct API:', id, status);

      // Map status to what the database expects
      let dbStatus = status;
      if (status === 'published') {
        dbStatus = 'approved';
      }
      // Keep 'archived' as is - don't map to 'rejected'

      const url = `https://bgjengudzfickgomjqmz.supabase.co/rest/v1/events?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: dbStatus,
          moderated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      console.log('🔍 Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Update failed:', response.status, response.statusText, errorText);
        return false;
      }

      console.log('🔍 Event status updated successfully to:', dbStatus);
      return true;
    } catch (error) {
      console.error('🔍 Error updating event status via direct API:', error);
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
      console.log('🔍 Fetching moderation stats via direct API');
      
      const url = 'https://bgjengudzfickgomjqmz.supabase.co/rest/v1/events?select=status';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('🔍 Failed to fetch moderation stats:', response.status, response.statusText);
        return { pending: 0, approved: 0, rejected: 0, total: 0 };
      }

      const data = await response.json();
      console.log('🔍 Moderation stats data:', data.length, 'total events');

      const stats = data.reduce((acc: any, event: any) => {
        if (event.status === 'draft' || event.status === 'reviewing') {
          acc.pending++;
        } else if (event.status === 'approved') {
          acc.approved++;
        } else if (event.status === 'archived') {
          acc.rejected++;
        }
        acc.total++;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0, total: 0 });

      console.log('🔍 Computed stats:', stats);
      return stats;
    } catch (error) {
      console.error('🔍 Error fetching moderation stats via direct API:', error);
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
    console.log('🔍 filterEvents called:', {
      totalEvents: events.length,
      filters: filters
    });

    const filtered = events.filter(event => {
      // Date filter - NO DATE FILTERING for 'all', and improved logic for other filters
      if (filters.dateRange !== 'all' && event.event_date) {
        const eventDate = new Date(event.event_date);
        if (isNaN(eventDate.getTime())) return true; // Invalid date, include it

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize to start of day
        const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Only show future events for time-based filters
        if (filters.dateRange === 'today' && daysDiff !== 0) return false;
        if (filters.dateRange === 'week' && (daysDiff < 0 || daysDiff > 7)) return false;
        if (filters.dateRange === 'month' && (daysDiff < 0 || daysDiff > 30)) return false;
      }

      // Source filter - fixed to handle null sources
      if (filters.source !== 'all' && event.source && event.source !== filters.source) return false;

      // Location filter - fixed to handle null locations
      if (filters.location && event.location) {
        const locationStr = typeof event.location === 'string' 
          ? event.location 
          : JSON.stringify(event.location);
        if (!locationStr.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }

      // Search term filter - fixed to handle null/undefined fields
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const name = event.name || '';
        const description = event.description || '';
        const tags = event.tags || [];
        
        return name.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower) ||
               tags.some(tag => tag.toLowerCase().includes(searchLower));
      }

      return true;
    });

    console.log('🔍 filterEvents result:', {
      totalEvents: events.length,
      filteredEvents: filtered.length,
      filters: filters
    });

    return filtered;
  }
}

export const supabaseEventService = new SupabaseEventService();