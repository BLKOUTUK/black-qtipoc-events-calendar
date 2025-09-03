// Supabase Database Types for BLKOUTNXT Platform
// Updated to work with the new Supabase-backed APIs

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Events Table
      events: {
        Row: {
          id: string
          name: string
          description: string
          event_date: string
          location: Json // JSONB field for flexible location data
          source: 'eventbrite' | 'community' | 'outsavvy' | 'facebook' | 'manual'
          source_url: string | null
          organizer_id: string | null
          organizer_name: string | null
          tags: string[] | null
          status: 'draft' | 'reviewing' | 'published' | 'archived'
          scraped_date: string | null
          listed_date: string | null
          image_url: string | null
          price: string | null
          contact_email: string | null
          registration_link: string | null
          target_audience: string[] | null
          attendee_count: number | null
          relevance_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          event_date: string
          location?: Json
          source: 'eventbrite' | 'community' | 'outsavvy' | 'facebook' | 'manual'
          source_url?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          tags?: string[] | null
          status?: 'draft' | 'reviewing' | 'published' | 'archived'
          scraped_date?: string | null
          listed_date?: string | null
          image_url?: string | null
          price?: string | null
          contact_email?: string | null
          registration_link?: string | null
          target_audience?: string[] | null
          attendee_count?: number | null
          relevance_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          event_date?: string
          location?: Json
          source?: 'eventbrite' | 'community' | 'outsavvy' | 'facebook' | 'manual'
          source_url?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          tags?: string[] | null
          status?: 'draft' | 'reviewing' | 'published' | 'archived'
          scraped_date?: string | null
          listed_date?: string | null
          image_url?: string | null
          price?: string | null
          contact_email?: string | null
          registration_link?: string | null
          target_audience?: string[] | null
          attendee_count?: number | null
          relevance_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Articles Table
      articles: {
        Row: {
          id: string
          title: string
          excerpt: string | null
          content: string | null
          author: string
          published_at: string
          category: string
          featured: boolean
          status: 'draft' | 'published' | 'archived'
          tags: string[] | null
          image_url: string | null
          source_url: string | null
          read_time: number | null
          priority: 'low' | 'medium' | 'high'
          submitted_via: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          excerpt?: string | null
          content?: string | null
          author: string
          published_at?: string
          category: string
          featured?: boolean
          status?: 'draft' | 'published' | 'archived'
          tags?: string[] | null
          image_url?: string | null
          source_url?: string | null
          read_time?: number | null
          priority?: 'low' | 'medium' | 'high'
          submitted_via?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          excerpt?: string | null
          content?: string | null
          author?: string
          published_at?: string
          category?: string
          featured?: boolean
          status?: 'draft' | 'published' | 'archived'
          tags?: string[] | null
          image_url?: string | null
          source_url?: string | null
          read_time?: number | null
          priority?: 'low' | 'medium' | 'high'
          submitted_via?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Contacts Table
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          organization: string | null
          phone: string | null
          website: string | null
          social_media: Json | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          organization?: string | null
          phone?: string | null
          website?: string | null
          social_media?: Json | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          organization?: string | null
          phone?: string | null
          website?: string | null
          social_media?: Json | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      
      // Scraping Logs Table
      scraping_logs: {
        Row: {
          id: string
          source: string
          events_found: number
          events_added: number
          status: 'success' | 'error' | 'partial' | 'fallback'
          error_message: string | null
          error: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          events_found?: number
          events_added?: number
          status: 'success' | 'error' | 'partial' | 'fallback'
          error_message?: string | null
          error?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          events_found?: number
          events_added?: number
          status?: 'success' | 'error' | 'partial' | 'fallback'
          error_message?: string | null
          error?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Frontend-friendly types derived from Database types
export type Event = Database['public']['Tables']['events']['Row'] & {
  // Additional computed fields
  title?: string // Alias for name
  date?: string // Alias for event_date
  startTime?: string
  endTime?: string
  url?: string // Alias for source_url or registration_link
  organizer?: string // Alias for organizer_name
  cost?: string // Alias for price
}

export type NewsArticle = Database['public']['Tables']['articles']['Row'] & {
  // Additional computed fields
  publishedAt?: string // Alias for published_at
  readTime?: number // Alias for read_time
  imageUrl?: string // Alias for image_url
  externalUrl?: string // Alias for source_url
  isBreaking?: boolean
}

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ScrapingLog = Database['public']['Tables']['scraping_logs']['Row']

// Filter and stats interfaces
export interface FilterOptions {
  dateRange: 'today' | 'week' | 'month' | 'all'
  source: 'all' | 'eventbrite' | 'community' | 'outsavvy' | 'facebook' | 'manual'
  location: string
  searchTerm: string
  status?: 'all' | 'draft' | 'reviewing' | 'published' | 'archived'
}

export interface ModerationStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export interface NewsroomStats {
  published: number
  draft: number
  total: number
  todayCount: number
}
