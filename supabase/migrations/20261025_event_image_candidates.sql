-- Event images found on organisers' pages, held for a person to approve (Rob, 25 Oct 2026).
-- The finder (lib/eventImages.ts, run by server.ts) writes a pending row and a copy of the image
-- in the event-images bucket; approving in Comms /admin/events sets events.image_url to that copy.
-- Service role only: no anon or authenticated grants, no RLS policies.
create table if not exists public.event_image_candidates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  source_page text not null,
  original_url text not null,
  stored_url text not null,
  width integer,
  height integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  found_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  unique (event_id, original_url)
);
create index if not exists event_image_candidates_pending on public.event_image_candidates (status) where status = 'pending';
alter table public.event_image_candidates enable row level security;
revoke all on public.event_image_candidates from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;
