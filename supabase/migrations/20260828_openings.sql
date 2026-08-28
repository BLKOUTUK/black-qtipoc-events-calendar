-- 20260828_openings.sql
-- The Openings stream (things to go after) + the honest public views for the events surface.
-- Spec: ~/blkout/projects/events-calendar/specs/events-surface-spec-v1.md §2.
-- Applied via mcp__supabase__apply_migration as `openings_stream` on 28 Aug 2026.
--
-- Principles baked in here:
--   * anon never reads the openings TABLE (found_by_contact must never be public) — reads go
--     through openings_live, which exposes public columns only.
--   * a curator's approved find lands in first_gestures (the reciprocity spine), never in the empty
--     volunteers / volunteer_hours scaffolding. Nobody counts hours. Credit on the listing is the
--     return mechanism.
--   * gatherings_live is the completeness gate Rob stated on 10 Aug 2026: a real venue and a named
--     organiser or it does not go up. The Note counts what is held back.

CREATE TABLE IF NOT EXISTS public.openings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  organisation      text NOT NULL,
  kind              text NOT NULL DEFAULT 'other'
                    CHECK (kind IN ('job','commission','residency','bursary','fund','call','panel','training','research','other')),
  beat              text NOT NULL
                    CHECK (beat IN ('arts-film','writing-publishing','jobs-training','money','study-research','community-organising')),
  summary           text,            -- one or two sentences: what it is, who it is for
  open_to           text,            -- eligibility line as the organisation states it
  pay               text,            -- fee / salary / amount as stated
  location          text,            -- 'UK-wide' | 'London' | 'Remote' | a city
  url               text NOT NULL,
  deadline          date,            -- NULL = rolling
  found_by          text,            -- public credit: "Found by Marcus"
  found_by_contact  text,            -- NEVER public. email or hub handle, for the being-met loop
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  source            text NOT NULL DEFAULT 'form',
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  moderated_at      timestamptz,
  moderated_by      text,
  moderation_reason text,
  gesture_id        uuid,            -- first_gestures.id once approved
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS openings_status_deadline_idx ON public.openings (status, deadline);
CREATE INDEX IF NOT EXISTS openings_url_idx ON public.openings (url);

ALTER TABLE public.openings ENABLE ROW LEVEL SECURITY;
-- Supabase default privileges grant new public tables to anon/authenticated; take that back.
REVOKE ALL ON public.openings FROM anon, authenticated;
GRANT ALL ON public.openings TO service_role;

-- Approval → a gesture. Fires once per row (gesture_id guards re-approval).
CREATE OR REPLACE FUNCTION public.openings_gesture_on_approve() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND coalesce(OLD.status, '') <> 'approved' THEN
    NEW.moderated_at := coalesce(NEW.moderated_at, now());
    IF NEW.gesture_id IS NULL AND NEW.found_by IS NOT NULL AND btrim(NEW.found_by) <> '' THEN
      INSERT INTO public.first_gestures (person_ref, person_name, surface, gesture, source_table, source_id, occurred_at, notes)
      VALUES (
        coalesce(nullif(btrim(NEW.found_by_contact), ''), btrim(NEW.found_by)),
        btrim(NEW.found_by),
        'openings',
        'Found an opening: ' || NEW.title,
        'openings',
        NEW.id,
        NEW.submitted_at,
        'credited on the listing as "Found by ' || btrim(NEW.found_by) || '"'
      )
      RETURNING id INTO NEW.gesture_id;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS openings_gesture_on_approve ON public.openings;
CREATE TRIGGER openings_gesture_on_approve
  BEFORE UPDATE ON public.openings
  FOR EACH ROW EXECUTE FUNCTION public.openings_gesture_on_approve();

-- Public columns only. Rolling openings (deadline NULL) stay until rejected.
CREATE OR REPLACE VIEW public.openings_live AS
SELECT id, title, organisation, kind, beat, summary, open_to, pay, location, url, deadline,
       found_by, moderated_at AS published_at
FROM public.openings
WHERE status = 'approved'
  AND (deadline IS NULL OR deadline >= current_date);

-- The completeness gate. An approved event with a bare-region location or a junk organiser is
-- held back from the public grid (still approved in the table; fix the fields and it reappears).
CREATE OR REPLACE VIEW public.gatherings_live AS
SELECT id, title, slug, description, date, start_time, end_time, end_date, location, virtual_link,
       organizer, cost, url, tags, image_url
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

GRANT SELECT ON public.openings_live TO anon, authenticated, service_role;
GRANT SELECT ON public.gatherings_live TO anon, authenticated, service_role;
