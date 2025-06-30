/*
  # Events Calendar Schema Update

  1. New Tables
    - `scraping_logs` - Track automated event discovery runs
  
  2. Schema Updates
    - Add missing columns to existing `events` table
    - Update RLS policies for public access
    - Add performance indexes
  
  3. Security
    - Enable RLS on new tables
    - Add policies for anonymous and authenticated access
    - Service role policies for automation
*/

-- Add missing columns to existing events table
DO $$
BEGIN
  -- Add source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'source'
  ) THEN
    ALTER TABLE events ADD COLUMN source text NOT NULL DEFAULT 'community' 
    CHECK (source IN ('eventbrite', 'community', 'outsavvy', 'facebook'));
  END IF;

  -- Add source_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE events ADD COLUMN source_url text;
  END IF;

  -- Add scraped_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'scraped_date'
  ) THEN
    ALTER TABLE events ADD COLUMN scraped_date timestamptz DEFAULT now();
  END IF;

  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE events ADD COLUMN image_url text;
  END IF;

  -- Add price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'price'
  ) THEN
    ALTER TABLE events ADD COLUMN price text;
  END IF;

  -- Add contact_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE events ADD COLUMN contact_email text;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'tags'
  ) THEN
    ALTER TABLE events ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  -- Add organizer column if it doesn't exist (rename from organizer_id reference)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'organizer_name'
  ) THEN
    ALTER TABLE events ADD COLUMN organizer_name text;
  END IF;
END $$;

-- Scraping logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  events_found integer DEFAULT 0,
  events_added integer DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on scraping logs
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- Update policies for events table (drop existing conflicting ones first)
DROP POLICY IF EXISTS "View published events" ON events;
DROP POLICY IF EXISTS "Admin access events" ON events;

-- New policies for events table
CREATE POLICY "Anyone can read published events"
  ON events
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated users can read all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage events"
  ON events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for scraping logs
CREATE POLICY "Authenticated users can read scraping logs"
  ON scraping_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert scraping logs"
  ON scraping_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Indexes for performance (using existing column names)
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS events_source_idx ON events(source);
CREATE INDEX IF NOT EXISTS events_tags_idx ON events USING GIN(tags);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at);

-- Indexes for scraping logs
CREATE INDEX IF NOT EXISTS scraping_logs_source_idx ON scraping_logs(source);
CREATE INDEX IF NOT EXISTS scraping_logs_created_at_idx ON scraping_logs(created_at);