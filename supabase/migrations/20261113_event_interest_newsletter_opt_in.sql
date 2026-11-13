-- Newsletter opt-in on borough-door sign-ups (13 Nov 2026).
-- Standing rule: every sign-up form carries a separate, unticked newsletter box.
-- The page writes newsletter_opt_in; api/newsletter-sync.ts (events-calendar server,
-- every 15 min) adds ticked rows to SendFox list 631882 and stamps the result here.
alter table public.event_interest
  add column if not exists newsletter_opt_in boolean not null default false,
  add column if not exists newsletter_synced_at timestamptz,
  add column if not exists newsletter_sync_note text;

create index if not exists event_interest_newsletter_pending
  on public.event_interest (signed_up_at)
  where newsletter_opt_in and newsletter_synced_at is null;
