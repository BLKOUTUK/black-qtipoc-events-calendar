import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          start_date: string;
          end_date: string | null;
          location: string;
          source: 'eventbrite' | 'community' | 'outsavvy' | 'facebook';
          source_url: string;
          organizer: string;
          tags: string[];
          status: 'pending' | 'approved' | 'rejected';
          scraped_date: string;
          image_url: string | null;
          price: string | null;
          contact_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          start_date: string;
          end_date?: string | null;
          location: string;
          source: 'eventbrite' | 'community' | 'outsavvy' | 'facebook';
          source_url: string;
          organizer: string;
          tags?: string[];
          status?: 'pending' | 'approved' | 'rejected';
          scraped_date?: string;
          image_url?: string | null;
          price?: string | null;
          contact_email?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          start_date?: string;
          end_date?: string | null;
          location?: string;
          source?: 'eventbrite' | 'community' | 'outsavvy' | 'facebook';
          source_url?: string;
          organizer?: string;
          tags?: string[];
          status?: 'pending' | 'approved' | 'rejected';
          scraped_date?: string;
          image_url?: string | null;
          price?: string | null;
          contact_email?: string | null;
        };
      };
      scraping_logs: {
        Row: {
          id: string;
          source: string;
          events_found: number;
          events_added: number;
          status: 'success' | 'error' | 'partial';
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          events_found?: number;
          events_added?: number;
          status: 'success' | 'error' | 'partial';
          error_message?: string | null;
        };
        Update: {
          id?: string;
          source?: string;
          events_found?: number;
          events_added?: number;
          status?: 'success' | 'error' | 'partial';
          error_message?: string | null;
        };
      };
    };
  };
};