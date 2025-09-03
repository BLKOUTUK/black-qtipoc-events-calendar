export interface Event {
  id: string;
  title: string; // Updated to match new API structure
  description: string;
  start_date: string; // Updated to match new API structure  
  end_date: string; // Added end_date for new API
  location: string; // Simplified location field
  address?: string; // Optional detailed address
  event_type: 'workshop' | 'conference' | 'meetup' | 'fundraiser' | 'protest' | 'celebration' | 'education' | 'health';
  organizer_id: string; // Required organizer ID
  max_attendees?: number;
  registration_required: boolean;
  registration_url?: string;
  cost: number; // Changed to number for new API
  featured_image?: string;
  tags: string[];
  status: 'draft' | 'published' | 'cancelled'; // Updated status options
  created_at: string;
  updated_at: string;
  
  // Profile relation for organizer
  profiles?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
  };

  // Legacy support fields (computed from new API)
  name?: string; // Alias for title
  event_date?: string; // Alias for start_date
  source?: string; // Computed from event_type or organizer
  source_url?: string; // Alias for registration_url
  organizer_name?: string; // Computed from profiles.full_name
  scraped_date?: string; // For backward compatibility
  image_url?: string; // Alias for featured_image
  price?: string; // String version of cost for display
  contact_email?: string; // From organizer profile
  listed_date?: string; // When published
  attendee_count?: number; // Not in new API, for display only
  relevance_score?: number; // AI-generated relevance score for QTIPOC+ community
  target_audience?: string[]; // Computed from tags/description
}

export interface FilterOptions {
  dateRange: 'today' | 'week' | 'month' | 'all';
  source: 'all' | 'workshop' | 'conference' | 'meetup' | 'fundraiser' | 'protest' | 'celebration' | 'education' | 'health';
  location: string;
  searchTerm: string;
  status?: 'all' | 'draft' | 'published' | 'cancelled';
  event_type?: string;
  organizer?: string;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// API Response types for new backend integration
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

// Profile type for organizer information
export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin' | 'editor';
  created_at: string;
  updated_at: string;
}

export interface ScrapingLog {
  id: string;
  source: string;
  events_found: number;
  events_added: number;
  status: 'success' | 'error' | 'partial' | 'fallback';
  error_message?: string;
  created_at: string;
  error?: string;
  metadata?: {
    averageQualityScore?: number;
    totalRuns?: number;
    knownOrganizations?: number;
    costEstimate?: number;
    discoveryMode?: 'quick' | 'deep' | 'intelligent';
  };
}