-- 20261007_openings_anon_read.sql
-- Restores the public Openings stream on events.blkoutuk.com.
-- Applied directly via mcp__supabase__execute_sql on 7 Oct 2026; this file is the record.
--
-- Why: openings_live had been switched to security_invoker=true, so it reads public.openings
-- with the caller's own rights. anon had no SELECT on the table, so the public page got
-- "permission denied for table openings" and showed no openings, even though they were approved.
--
-- Keeps the 20260828 principle (found_by_contact is never public) with column-level grants:
-- anon may read only the columns openings_live exposes, plus status for its WHERE clause.
-- found_by_contact, moderated_by, moderation_reason, source, gesture_id stay unreadable.

GRANT SELECT (id, title, organisation, kind, beat, summary, open_to, pay, location, url,
              deadline, found_by, status, moderated_at)
  ON public.openings TO anon;

CREATE POLICY "Anon can read approved openings"
  ON public.openings FOR SELECT TO anon
  USING (status = 'approved');
