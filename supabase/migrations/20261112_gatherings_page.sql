-- gatherings_page: the view behind one event's page (/e/<id>/<slug>), 12 Nov 2026.
-- Same completeness gate as gatherings_live, but past events stay readable, so a borough
-- door's "recently" strip can link to the gathering it names (events-door links spec, item B).
-- The grid, sitemap and feeds keep reading gatherings_live (upcoming only).

CREATE OR REPLACE VIEW public.gatherings_page
WITH (security_invoker = true) AS
SELECT id, title, slug, description, date, start_time, end_time, end_date, location, virtual_link,
       organizer, cost, url, tags, image_url
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

GRANT SELECT ON public.gatherings_page TO anon, authenticated, service_role;
