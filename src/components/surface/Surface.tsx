/**
 * Surface — the pure-presentation events.blkoutuk.com page (spec §3).
 *
 * Props in, nothing else: no fetching, no `import.meta.env`, no `window` at module
 * scope, no framer-motion — so it can be rendered with `react-dom/server` for design
 * review (scripts/render-fixture.mjs). SurfacePage.tsx owns fetching and modal state.
 */

import { useState } from 'react';
import FoundationLayer from '../foundation/FoundationLayer';
import { StreamHeader } from './StreamHeader';
import { GatheringCard } from './GatheringCard';
import { OpeningRow } from './OpeningRow';
import { PlaceRow } from './PlaceRow';
import { TheNote } from './TheNote';
import { FeedThePage } from './FeedThePage';
import { Gathering, Opening, Place, PageNote, OpeningBeat, PlaceRegion } from '../../types/surface';

export interface SurfaceProps {
  gatherings: Gathering[];
  openings: Opening[];
  places: Place[];
  placesHeld: number;
  note: PageNote | null;
  state: { noteError: string | null };
  onOpenEventForm: () => void;
  onOpenOpeningForm: () => void;
}

const BEATS: { value: OpeningBeat; label: string }[] = [
  { value: 'arts-film', label: 'Arts & film' },
  { value: 'writing-publishing', label: 'Writing & publishing' },
  { value: 'jobs-training', label: 'Jobs & training' },
  { value: 'money', label: 'Money' },
  { value: 'study-research', label: 'Study & research' },
  { value: 'community-organising', label: 'Community & organising' },
];

const REGION_ORDER: PlaceRegion[] = [
  'london',
  'south-east',
  'south-west',
  'midlands',
  'north',
  'wales',
  'scotland',
  'uk-wide',
];

const REGION_LABELS: Record<PlaceRegion, string> = {
  london: 'London',
  'south-east': 'South East',
  'south-west': 'South West',
  midlands: 'Midlands',
  north: 'North',
  wales: 'Wales',
  scotland: 'Scotland',
  'uk-wide': 'UK-wide & online',
};

function formatCheckedDate(iso: string): string {
  // last_human_check comes as an ISO timestamp — 'checked 22 Aug'.
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function sortOpenings(openings: Opening[]): Opening[] {
  return [...openings].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1; // rolling last
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
}

function monthLabel(dateStr: string): string {
  const now = new Date();
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? 'this-month' : 'later';
}

function checkedLabel(places: Place[]): string {
  if (places.length === 0) return '';
  const max = places.reduce((acc, p) => (p.checked > acc ? p.checked : acc), places[0].checked);
  const [year, month] = max.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function Surface({
  gatherings,
  openings,
  places,
  placesHeld,
  note,
  state,
  onOpenEventForm,
  onOpenOpeningForm,
}: SurfaceProps) {
  const [activeBeat, setActiveBeat] = useState<OpeningBeat | 'all'>('all');

  const sortedOpenings = sortOpenings(openings);
  const filteredOpenings =
    activeBeat === 'all' ? sortedOpenings : sortedOpenings.filter((o) => o.beat === activeBeat);

  const checkedDate = note?.last_human_check ? formatCheckedDate(note.last_human_check) : null;

  const gatheringsChip =
    gatherings.length === 0
      ? 'All quiet'
      : `${gatherings.length} coming up${checkedDate ? ` · checked ${checkedDate}` : ''}`;
  const openingsChip =
    openings.length === 0 ? 'All quiet' : `${openings.length} open${checkedDate ? ` · checked ${checkedDate}` : ''}`;
  const placesChip = places.length === 0 ? 'All quiet' : `${places.length} places`;

  const thisMonth = gatherings.filter((g) => monthLabel(g.date) === 'this-month');
  const later = gatherings.filter((g) => monthLabel(g.date) === 'later');
  const showGroupLabels = thisMonth.length > 0 && later.length > 0;

  const placesByRegion = REGION_ORDER.map((region) => ({
    region,
    entries: places.filter((p) => p.region === region),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="text-[#f5f1e8]">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 md:py-24">
        <FoundationLayer category="joy" seed="events-surface-hero" opacity={0.25} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14]/40 via-[#0a0a14]/60 to-[#0a0a14]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-meta text-xs uppercase tracking-widest text-[#f5f1e8]/60">
            events.blkoutuk.com — checked by hand
          </p>
          <h1 className="font-signature font-black uppercase tracking-tight leading-[0.9] text-5xl md:text-7xl mt-4">
            <span className="block text-events/100">What's on.</span>
            <span className="block text-[#f5f1e8]">What's open.</span>
            <span className="block text-[#f5f1e8]">Where we are.</span>
          </h1>
          <p className="font-disrupt italic text-[#f5f1e8]/70 mt-6 max-w-[58ch] text-lg">
            a short list you can trust beats a long one you can't. every listing here has been looked at by a
            person — and a quiet week is shown as a quiet week.
          </p>
          <nav className="font-meta text-xs uppercase tracking-wide mt-8 flex flex-wrap gap-4 text-[#f5f1e8]/60">
            <a href="#gatherings" className="hover:text-events/100 transition-colors">
              01 gatherings
            </a>
            <span aria-hidden>·</span>
            <a href="#openings" className="hover:text-events/100 transition-colors">
              02 openings
            </a>
            <span aria-hidden>·</span>
            <a href="#places" className="hover:text-events/100 transition-colors">
              03 places
            </a>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
        {/* 01 Gatherings */}
        <section>
          <StreamHeader
            id="gatherings"
            index="01"
            section="Gatherings"
            heading="Things to go to"
            tagline="fewer, and true. a real place, a real date, a named organiser, a working link — or it does not go up."
            chipLabel={gatheringsChip}
          />

          {gatherings.length === 0 ? (
            <p className="font-disrupt italic text-[#f5f1e8]/70 mt-8 max-w-[58ch]">
              nothing listed for the next month — and we checked. know of something? add it below.
            </p>
          ) : (
            <div className="mt-8 space-y-8">
              {showGroupLabels && thisMonth.length > 0 && (
                <div>
                  <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mb-3">This month</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {thisMonth.map((g) => (
                      <GatheringCard key={g.id} gathering={g} />
                    ))}
                  </div>
                </div>
              )}
              {showGroupLabels && later.length > 0 && (
                <div>
                  <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mb-3">Later</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {later.map((g) => (
                      <GatheringCard key={g.id} gathering={g} />
                    ))}
                  </div>
                </div>
              )}
              {!showGroupLabels && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gatherings.map((g) => (
                    <GatheringCard key={g.id} gathering={g} />
                  ))}
                </div>
              )}
              <a
                href="/api/calendar"
                className="font-meta text-xs uppercase tracking-wide text-events/100 hover:underline inline-block"
              >
                subscribe to the calendar (.ics)
              </a>
            </div>
          )}
        </section>

        {/* 02 Openings */}
        <section>
          <StreamHeader
            id="openings"
            index="02"
            section="Openings"
            heading="Things to go after"
            tagline="jobs, commissions, residencies, bursaries, funds, calls — open to Black queer people in the UK, with a deadline and a link."
            chipLabel={openingsChip}
          />

          {openings.length === 0 ? (
            <p className="font-disrupt italic text-[#f5f1e8]/70 mt-8 max-w-[58ch]">
              the board is new. nothing listed yet — the first curators are being invited this month. found
              one? it takes ten minutes.
            </p>
          ) : (
            <div className="mt-8">
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setActiveBeat('all')}
                  className={`appearance-none inline-block mr-2 mb-2 font-meta text-xs uppercase tracking-wide px-3 py-1 border rounded-sharp transition-colors ${
                    activeBeat === 'all' ? 'border-events/100 text-events/100' : 'border-events/30 text-[#f5f1e8]/60'
                  }`}
                >
                  All
                </button>
                {BEATS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setActiveBeat(b.value)}
                    className={`appearance-none inline-block mr-2 mb-2 font-meta text-xs uppercase tracking-wide px-3 py-1 border rounded-sharp transition-colors ${
                      activeBeat === b.value ? 'border-events/100 text-events/100' : 'border-events/30 text-[#f5f1e8]/60'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="text-right mb-4">
                <button
                  type="button"
                  onClick={onOpenOpeningForm}
                  className="appearance-none font-meta text-xs uppercase tracking-wide text-events/100 hover:underline"
                >
                  Add an opening →
                </button>
              </div>

              <div>
                {filteredOpenings.map((o) => (
                  <OpeningRow key={o.id} opening={o} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 03 Places */}
        <section>
          <StreamHeader
            id="places"
            index="03"
            section="Places"
            heading="Where we are"
            tagline="organisations, groups, venues and regular rooms — standing things you can find when you need them, checked this summer."
            chipLabel={placesChip}
          />

          {places.length === 0 ? (
            <p className="font-disrupt italic text-[#f5f1e8]/70 mt-8 max-w-[58ch]">
              nothing checked and current yet — know of somewhere? tell us what's changed.
            </p>
          ) : (
            <div className="mt-8 space-y-8">
              {placesByRegion.map(({ region, entries }) => (
                <div key={region}>
                  <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mb-2">
                    {REGION_LABELS[region]}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {entries.map((p) => (
                      <PlaceRow key={p.id} place={p} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50">
                checked {checkedLabel(places)} · {places.length} places ·{' '}
                <a href="mailto:info@blkout.org" className="text-events/100 hover:underline">
                  tell us what's changed →
                </a>
              </p>
            </div>
          )}
        </section>

        {/* 04 The Note */}
        <TheNote note={note} noteError={state.noteError} placesCount={places.length} placesHeld={placesHeld} />

        {/* 05 Feed the page */}
        <FeedThePage onOpenEventForm={onOpenEventForm} onOpenOpeningForm={onOpenOpeningForm} />
      </div>
    </div>
  );
}
