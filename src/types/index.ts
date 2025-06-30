export interface Event {
  id: string;
  name: string; // Using 'name' to match existing schema
  description: string;
  event_date: string; // Using 'event_date' to match existing schema
  location: any; // JSONB in existing schema
  source: 'eventbrite' | 'community' | 'outsavvy' | 'facebook';
  source_url?: string;
  organizer_name?: string; // Using organizer_name for new column
  organizer_id?: string; // Keep existing organizer_id reference
  tags?: string[];
  status: 'draft' | 'reviewing' | 'published' | 'archived';
  scraped_date?: string;
  image_url?: string;
  price?: string;
  contact_email?: string;
  created_at?: string;
  updated_at?: string;
  registration_link?: string;
  target_audience?: string[];
  listed_date?: string;
  attendee_count?: number;
}

export interface FilterOptions {
  dateRange: 'today' | 'week' | 'month' | 'all';
  source: 'all' | 'eventbrite' | 'community' | 'outsavvy' | 'facebook';
  location: string;
  searchTerm: string;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface ScrapingLog {
  id: string;
  source: string;
  events_found: number;
  events_added: number;
  status: 'success' | 'error' | 'partial';
  error_message?: string;
  created_at: string;
}