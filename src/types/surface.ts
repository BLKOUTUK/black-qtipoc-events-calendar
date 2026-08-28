/**
 * Types for the events.blkoutuk.com surface (spec: events-surface-spec-v1.md §2).
 *
 * Gathering / Opening / PageNote mirror the anon-readable views exactly
 * (gatherings_live, openings_live, events_page_note) — no extra fields, so a
 * schema drift shows up as a type error rather than a silent `any`.
 */

export interface Gathering {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  end_date: string | null;
  location: string;
  virtual_link: string | null;
  organizer: string;
  cost: string | null;
  url: string;
  tags: string[] | null;
  image_url: string | null;
}

export type OpeningKind =
  | 'job'
  | 'commission'
  | 'residency'
  | 'bursary'
  | 'fund'
  | 'call'
  | 'panel'
  | 'training'
  | 'research'
  | 'other';

export type OpeningBeat =
  | 'arts-film'
  | 'writing-publishing'
  | 'jobs-training'
  | 'money'
  | 'study-research'
  | 'community-organising';

export interface Opening {
  id: string;
  title: string;
  organisation: string;
  kind: OpeningKind;
  beat: OpeningBeat;
  summary: string | null;
  open_to: string | null;
  pay: string | null;
  location: string | null;
  url: string;
  deadline: string | null; // YYYY-MM-DD, null = rolling
  found_by: string | null; // public credit
  published_at: string | null;
}

export interface TurnedAwayReason {
  reason: string;
  n: number;
}

export interface FeedStatus {
  feed: string;
  last_delivered: string | null;
  days_since: number | null;
  automated: boolean;
}

export interface PageNote {
  gatherings_live: number;
  gatherings_held: number;
  last_human_check: string | null;
  turned_away_30d: number;
  turned_away_reasons: TurnedAwayReason[];
  feeds: FeedStatus[];
  openings_open: number;
  openings_closing_7d: number;
  openings_waiting: number;
  generated_at: string;
}

export type PlaceRegion =
  | 'london'
  | 'south-east'
  | 'south-west'
  | 'midlands'
  | 'north'
  | 'wales'
  | 'scotland'
  | 'uk-wide';

export type PlaceKind =
  | 'organisation'
  | 'group'
  | 'venue'
  | 'club-night'
  | 'collective'
  | 'service'
  | 'network';

export type PlaceCentres =
  | 'black-queer-men'
  | 'black-lgbtq'
  | 'qtipoc'
  | 'lgbtq-broad'
  | 'general';

export interface Place {
  id: string;
  name: string;
  what: string;
  where: string;
  region: PlaceRegion;
  kind: PlaceKind;
  regular?: string;
  url?: string;
  instagram?: string;
  centres: PlaceCentres;
  checked: string; // 'YYYY-MM'
  evidence: string; // one line: dated activity inside the last 12 months + where seen
  /** London borough (or local authority) so the borough doors can read across — e.g. Ajamu Studios → Lambeth */
  borough?: string;
  /** stated audience excludes men — never published on a page for Black queer men */
  excludesMen?: boolean;
  status: 'live' | 'unclear' | 'dormant' | 'closed';
}
