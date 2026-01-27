// Supabase API Service for Events Calendar
// Connects to the new /home/robbe/blkoutnxt-api backend

import { Event, FilterOptions, ModerationStats, ApiResponse } from '../types';

interface EventQuery {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  event_type?: string;
  location?: string;
  status?: string;
  organizer_id?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

class SupabaseApiService {
  private baseUrl: string;
  private timeout: number = 10000;

  constructor() {
    // Use production API or local development API
    this.baseUrl = this.detectApiUrl();
  }

  private detectApiUrl(): string {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    if (isDevelopment || isLocalhost) {
      // Try to use local API if available, fallback to production
      return 'http://localhost:3000/api';
    }
    
    // Production: use the deployed API
    return 'https://ivor.blkoutuk.cloud/api';
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    try {
      console.log(`🌐 Events API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Events API Success: ${options.method || 'GET'} ${url}`);
      
      return data as ApiResponse<T>;
    } catch (error) {
      console.error(`❌ Events API Error: ${options.method || 'GET'} ${url}`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: undefined
      };
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Transform API event to legacy Event interface for backward compatibility
  private transformApiEvent(apiEvent: any): Event {
    return {
      id: apiEvent.id,
      title: apiEvent.title,
      description: apiEvent.description,
      start_date: apiEvent.start_date,
      end_date: apiEvent.end_date,
      location: apiEvent.location,
      address: apiEvent.address,
      event_type: apiEvent.event_type,
      organizer_id: apiEvent.organizer_id,
      max_attendees: apiEvent.max_attendees,
      registration_required: apiEvent.registration_required,
      registration_url: apiEvent.registration_url,
      cost: apiEvent.cost,
      featured_image: apiEvent.featured_image,
      tags: apiEvent.tags || [],
      status: apiEvent.status,
      created_at: apiEvent.created_at,
      updated_at: apiEvent.updated_at,
      profiles: apiEvent.profiles,
      
      // Legacy compatibility fields
      name: apiEvent.title,
      event_date: apiEvent.start_date,
      source: apiEvent.event_type,
      source_url: apiEvent.registration_url,
      organizer_name: apiEvent.profiles?.full_name || 'Unknown Organizer',
      scraped_date: apiEvent.created_at,
      image_url: apiEvent.featured_image,
      price: apiEvent.cost ? `£${apiEvent.cost}` : 'Free',
      contact_email: undefined, // Not in API response
      listed_date: apiEvent.status === 'published' ? apiEvent.updated_at : undefined,
      attendee_count: undefined, // Not tracked in current API
      relevance_score: 0.8, // Default high relevance for QTIPOC+ events
      target_audience: this.extractTargetAudience(apiEvent)
    };
  }

  private extractTargetAudience(apiEvent: any): string[] {
    const audiences = [];
    
    // Extract from tags
    if (apiEvent.tags) {
      const qtipocTags = apiEvent.tags.filter((tag: string) => 
        tag.toLowerCase().includes('qtipoc') ||
        tag.toLowerCase().includes('black') ||
        tag.toLowerCase().includes('queer') ||
        tag.toLowerCase().includes('trans') ||
        tag.toLowerCase().includes('lgbtq')
      );
      audiences.push(...qtipocTags);
    }
    
    // Default audience for all events
    if (audiences.length === 0) {
      audiences.push('Black QTIPOC+ Community');
    }
    
    return audiences;
  }

  // Health check
  async checkHealth(): Promise<{ healthy: boolean; backend: string }> {
    try {
      const response = await this.makeRequest('/health');
      return {
        healthy: response.success,
        backend: this.baseUrl
      };
    } catch (error) {
      return {
        healthy: false,
        backend: this.baseUrl
      };
    }
  }

  // Get all events with filtering and pagination
  async getEvents(filters: FilterOptions = {
    dateRange: 'all',
    source: 'all',
    location: '',
    searchTerm: ''
  }): Promise<Event[]> {
    try {
      const query: EventQuery = {
        page: 1,
        limit: 50,
        sort: 'start_date',
        order: 'asc'
      };

      // Apply filters to query
      if (filters.source && filters.source !== 'all') {
        query.event_type = filters.source;
      }

      if (filters.location) {
        query.location = filters.location;
      }

      if (filters.searchTerm) {
        query.search = filters.searchTerm;
      }

      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }

      // Date filtering
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            query.start_date = startDate.toISOString();
            query.end_date = new Date(startDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'week':
            startDate = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
            query.start_date = startDate.toISOString();
            query.end_date = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            query.start_date = startDate.toISOString();
            query.end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            break;
        }
      }

      const queryString = this.buildQueryString(query);
      const response = await this.makeRequest<any[]>(`/events${queryString}`);

      if (response.success && response.data) {
        return response.data.map(event => this.transformApiEvent(event));
      }

      // Fallback to empty array if API fails
      return [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return [];
    }
  }

  // Get single event
  async getEvent(id: string): Promise<Event | null> {
    try {
      const response = await this.makeRequest<any>(`/events/${id}`);
      
      if (response.success && response.data) {
        return this.transformApiEvent(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch event:', error);
      return null;
    }
  }

  // Create new event
  async createEvent(eventData: Partial<Event>): Promise<Event | null> {
    try {
      const createData = {
        title: eventData.title || eventData.name || '',
        description: eventData.description || '',
        start_date: eventData.start_date || eventData.event_date || new Date().toISOString(),
        end_date: eventData.end_date || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Default 2 hours
        location: eventData.location || '',
        address: eventData.address,
        event_type: eventData.event_type || 'community',
        max_attendees: eventData.max_attendees,
        registration_required: eventData.registration_required || false,
        registration_url: eventData.registration_url || eventData.source_url,
        cost: eventData.cost || 0,
        featured_image: eventData.featured_image || eventData.image_url,
        tags: eventData.tags || [],
        status: 'draft' // All new events start as draft
      };

      const response = await this.makeRequest<any>('/events', {
        method: 'POST',
        body: JSON.stringify(createData)
      });

      if (response.success && response.data) {
        return this.transformApiEvent(response.data);
      }

      return null;
    } catch (error) {
      console.error('Failed to create event:', error);
      return null;
    }
  }

  // Update event
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.event_type !== undefined) updateData.event_type = updates.event_type;
      if (updates.max_attendees !== undefined) updateData.max_attendees = updates.max_attendees;
      if (updates.registration_required !== undefined) updateData.registration_required = updates.registration_required;
      if (updates.registration_url !== undefined) updateData.registration_url = updates.registration_url;
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      if (updates.featured_image !== undefined) updateData.featured_image = updates.featured_image;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.status !== undefined) updateData.status = updates.status;

      const response = await this.makeRequest<any>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.success && response.data) {
        return this.transformApiEvent(response.data);
      }

      return null;
    } catch (error) {
      console.error('Failed to update event:', error);
      return null;
    }
  }

  // Delete event
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/events/${id}`, {
        method: 'DELETE'
      });

      return response.success;
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }

  // Get moderation stats
  async getModerationStats(): Promise<ModerationStats> {
    try {
      // Get all events to calculate stats
      const events = await this.getEvents();
      
      const stats = events.reduce((acc, event) => {
        acc.total++;
        // Count pending statuses (draft, reviewing, pending)
        if (event.status === 'draft' || event.status === 'reviewing' || event.status === 'pending') acc.pending++;
        if (event.status === 'published' || event.status === 'approved') acc.approved++;
        if (event.status === 'cancelled' || event.status === 'archived') acc.rejected++;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0, total: 0 });

      return stats;
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return { pending: 0, approved: 0, rejected: 0, total: 0 };
    }
  }

  // Filter events (client-side filtering for additional filters not supported by API)
  filterEvents(events: Event[], filters: FilterOptions): Event[] {
    return events.filter(event => {
      // Additional client-side filtering can be added here
      // Most filtering should be done server-side via the API
      
      // Location search (case insensitive)
      if (filters.location && 
          !event.location.toLowerCase().includes(filters.location.toLowerCase()) &&
          !event.address?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Search term in title, description, or tags
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description.toLowerCase().includes(searchLower);
        const matchesTags = event.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const matchesOrganizer = event.organizer_name?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesTags && !matchesOrganizer) {
          return false;
        }
      }

      return true;
    });
  }

  // Get connection status
  getConnectionStatus(): Promise<{ connected: boolean; backend: string }> {
    return this.checkHealth().then(health => ({
      connected: health.healthy,
      backend: health.backend
    }));
  }
}

export const supabaseApiService = new SupabaseApiService();
export default supabaseApiService;