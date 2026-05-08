-- ====================================================================
-- BLKOUT — events.image_url (cover image for event listing/card)
-- ====================================================================
-- The events-calendar frontend (EventCard.tsx, EventForm.tsx) already
-- expects an image_url column on events, but the production schema
-- never had it — events have rendered without imagery as a result.
-- This adds the column to align schema with the frontend expectation.
-- Existing rows get NULL (no image), same as previous behaviour.
-- ====================================================================

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.events.image_url IS
    'URL to event cover image. Relative to events.blkoutuk.com (e.g. /images/events/picnic-2026.jpg) or absolute (e.g. https://...).';
