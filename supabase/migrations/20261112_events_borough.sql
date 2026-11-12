-- events.borough (events-door links spec, item C), 12 Nov 2026.
-- The local authority an in-person event is in ('Lambeth', 'Tower Hamlets', 'Birmingham'),
-- from postcodes.io admin_district. Filled by api/event-borough.ts (hourly, server.ts) from the
-- free-text location; NULL for online events and locations too vague to place.
-- borough_checked_at marks a row as looked at, so a location that can't be placed isn't retried
-- every hour. Editing location or virtual_link clears both, and the next run looks again.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS borough text,
  ADD COLUMN IF NOT EXISTS borough_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS events_borough_idx ON public.events (borough) WHERE borough IS NOT NULL;

CREATE OR REPLACE FUNCTION public.events_clear_borough_on_location_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.location IS DISTINCT FROM OLD.location OR NEW.virtual_link IS DISTINCT FROM OLD.virtual_link THEN
    NEW.borough := NULL;
    NEW.borough_checked_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS events_clear_borough ON public.events;
CREATE TRIGGER events_clear_borough BEFORE UPDATE OF location, virtual_link ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_clear_borough_on_location_change();

-- Both public views carry the borough (appended last, so CREATE OR REPLACE keeps existing columns).
CREATE OR REPLACE VIEW public.gatherings_live
WITH (security_invoker = true) AS
SELECT id, title, slug, description, date, start_time, end_time, end_date, location, virtual_link,
       organizer, cost, url, tags, image_url, borough
FROM public.events e
WHERE status IN ('approved', 'published')
  AND date >= current_date
  AND coalesce(btrim(url), '') <> ''
  AND coalesce(btrim(organizer), '') <> ''
  AND lower(btrim(organizer)) NOT IN ('date','street','unknown','unknown organizer','tba','african','n/a','none')
  AND organizer !~* '\.(com|co\.uk|org|org\.uk|net|uk)$'
  AND coalesce(btrim(location), '') <> ''
  AND (
    lower(btrim(location)) NOT IN ('uk','tba','location tba','london','england','united kingdom','virtual','online','online event')
    OR coalesce(btrim(virtual_link), '') <> ''
  );

CREATE OR REPLACE VIEW public.gatherings_page
WITH (security_invoker = true) AS
SELECT id, title, slug, description, date, start_time, end_time, end_date, location, virtual_link,
       organizer, cost, url, tags, image_url, borough
FROM public.events e
WHERE status IN ('approved', 'published')
  AND coalesce(btrim(url), '') <> ''
  AND coalesce(btrim(organizer), '') <> ''
  AND lower(btrim(organizer)) NOT IN ('date','street','unknown','unknown organizer','tba','african','n/a','none')
  AND organizer !~* '\.(com|co\.uk|org|org\.uk|net|uk)$'
  AND coalesce(btrim(location), '') <> ''
  AND (
    lower(btrim(location)) NOT IN ('uk','tba','location tba','london','england','united kingdom','virtual','online','online event')
    OR coalesce(btrim(virtual_link), '') <> ''
  );
