/**
 * surfaceService — data fetching for the events.blkoutuk.com surface.
 *
 * Reads the three anon-readable views (gatherings_live, openings_live,
 * events_page_note) via the existing `supabase` client. Every call returns
 * `{ data, error }` so the page can render the Note's failure sentence on a
 * failed fetch rather than a false zero (spec §3, "the Note" section).
 */

import { supabase } from '../lib/supabase';
import { Gathering, Opening, PageNote } from '../types/surface';

export interface FetchResult<T> {
  data: T;
  error: string | null;
}

export async function fetchGatherings(): Promise<FetchResult<Gathering[]>> {
  // `supabase` is typed as a union with the no-op fallback client (src/lib/supabase.ts),
  // whose `.then` shape TS won't accept as directly awaitable — the same cast used
  // throughout the existing services (e.g. supabaseEventService.ts) for this query pattern.
  const { data, error } = await (supabase.from('gatherings_live').select('*').order('date') as any);

  if (error) {
    console.error('surfaceService: gatherings_live fetch failed', error);
    return { data: [], error: error.message };
  }
  return { data: (data as Gathering[]) ?? [], error: null };
}

export async function fetchOpenings(): Promise<FetchResult<Opening[]>> {
  const { data, error } = await (supabase
    .from('openings_live')
    .select('*')
    .order('deadline', { ascending: true, nullsFirst: false }) as any);

  if (error) {
    console.error('surfaceService: openings_live fetch failed', error);
    return { data: [], error: error.message };
  }
  return { data: (data as Opening[]) ?? [], error: null };
}

export async function fetchPageNote(): Promise<FetchResult<PageNote | null>> {
  const query = supabase.from('events_page_note').select('*') as any;
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('surfaceService: events_page_note fetch failed', error);
    return { data: null, error: error.message };
  }
  return { data: (data as PageNote) ?? null, error: null };
}
