import { PageNote } from '../../types/surface';

interface TheNoteProps {
  note: PageNote | null;
  noteError: string | null;
  placesCount: number;
  placesHeld: number;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}, ${time}`;
}

function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function TheNote({ note, noteError, placesCount, placesHeld }: TheNoteProps) {
  const failed = Boolean(noteError) || !note;

  return (
    <div id="the-note" className="border-4 border-events/100 bg-[#14141f] rounded-sharp p-6 md:p-8 scroll-mt-20">
      <p className="font-meta text-[13px] uppercase tracking-widest text-events/100">How this page is kept</p>

      {failed ? (
        <p className="font-meta text-sm text-[#f5f1e8]/70 mt-6">
          The tally is not loading right now, so nothing is shown rather than something out of date.
        </p>
      ) : (
        <>
          {/* Four numbers */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="min-w-[10rem]">
              <p className="font-signature font-black text-[3.5rem] md:text-[4rem] leading-none text-[#f5f1e8]">
                {note.gatherings_live}
              </p>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-1">gatherings live</p>
            </div>
            <div className="min-w-[10rem]">
              <p className="font-signature font-black text-[3.5rem] md:text-[4rem] leading-none text-[#f5f1e8]">
                {note.openings_open}
              </p>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-1">openings open</p>
            </div>
            <div className="min-w-[10rem]">
              <p className="font-signature font-black text-[3.5rem] md:text-[4rem] leading-none text-[#f5f1e8]">
                {placesCount}
              </p>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-1">places</p>
            </div>
            <div className="min-w-[10rem]">
              <p className="font-signature font-black text-[3.5rem] md:text-[4rem] leading-none text-[#f5f1e8]">
                {note.turned_away_30d}
              </p>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-1">turned away in 30 days</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/70 mt-8 mb-3">Checked</p>
              <ul className="space-y-1 text-[#f5f1e8]/70">
                <li>
                  <span className="text-events/100">—</span>{' '}
                  {note.last_human_check ? formatFullDate(note.last_human_check) : 'not yet recorded'}
                </li>
                <li>
                  <span className="text-events/100">—</span> {note.gatherings_held} approved listings are held back
                  until they carry a venue and an organiser
                </li>
                <li>
                  <span className="text-events/100">—</span> {placesHeld} places held pending verification
                </li>
              </ul>
            </div>

            <div>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/70 mt-8 mb-3">
                Turned away, last 30 days
              </p>
              {note.turned_away_reasons.length > 0 ? (
                <ul className="space-y-1 text-[#f5f1e8]/70 max-w-[42rem]">
                  {note.turned_away_reasons.map((r) => (
                    <li key={r.reason}>
                      <span className="text-events/100">—</span> {r.reason} · {r.n}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#f5f1e8]/50">nothing turned away</p>
              )}
            </div>

            <div>
              <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/70 mt-8 mb-3">Feeds</p>
              <ul className="space-y-1 text-[#f5f1e8]/70 max-w-[42rem]">
                {note.feeds.map((f) => {
                  const stale = f.automated && (f.days_since ?? 0) > 21;
                  return (
                    <li key={f.feed}>
                      <span className="text-events/100">—</span> {f.feed} —{' '}
                      {f.last_delivered ? (
                        stale ? (
                          <>
                            last delivered {formatDayMonth(f.last_delivered)}, {f.days_since} days ago — not
                            updating, so nothing new is shown from it rather than something out of date
                          </>
                        ) : (
                          <>last delivered {formatDayMonth(f.last_delivered)}</>
                        )
                      ) : (
                        'no deliveries recorded'
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}

      <p className="text-[#f5f1e8]/70 mt-8 max-w-[70ch]">
        What we list: things for Black queer people in the UK with a real place, a real date, a named organiser
        and a working link. What we turn away: listings pages, boilerplate, anything we cannot verify, and
        anything a scraper dated for us. A thin month is shown as a thin month. When a feed stops, we say so
        rather than show you something out of date.
      </p>

      <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/40 mt-6">
        figures live from the database · generated {note ? formatFullDate(note.generated_at) : 'unavailable'}
      </p>
    </div>
  );
}
