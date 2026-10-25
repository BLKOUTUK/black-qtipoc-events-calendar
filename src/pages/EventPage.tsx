/**
 * EventPage — one gathering at /e/<id>/<slug> (events redesign spec 02, Part A).
 *
 * Reads gatherings_live, so only approved, complete, upcoming gatherings have a page.
 * server.ts serves the same address with the event's own title, preview and Event schema,
 * the calendar file (/e/<id>/calendar.ics) and the map position (/api/event-location/<id>).
 * Hosted RSVP and Zeffy tickets come later; today the action is the organiser's own link.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, ExternalLink, MapPin, Navigation, Share2, Video } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchGathering } from '../services/surfaceService';
import { Gathering } from '../types/surface';

// Same markers as GatheringCard: intent, never subject matter.
const ADULTS_ONLY_TAGS = ['18+', 'adults only', 'adult', '18 plus', 'over 18', 'kink', 'fetish', 'play party', 'nsfw'];

function formatTime(time: string): string {
  const [hStr, mStr = '00'] = time.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return mStr === '00' ? `${h}${period}` : `${h}.${mStr}${period}`;
}

function formatWhen(g: Gathering): string {
  const date = new Date(`${g.date}T00:00:00`);
  const day = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let when = day;
  if (g.end_date && g.end_date !== g.date) {
    const end = new Date(`${g.end_date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    when = `${day} – ${end}`;
  }
  if (g.start_time) when += ` · ${formatTime(g.start_time)}${g.end_time ? `–${formatTime(g.end_time)}` : ''}`;
  return when;
}

function formatCost(cost: string | null): string {
  const trimmed = (cost || '').trim();
  if (!trimmed || /^see link$/i.test(trimmed)) return 'Price on the organiser’s page';
  if (/^\d+(\.\d{1,2})?$/.test(trimmed)) return `£${trimmed}`;
  return trimmed;
}

/** Descriptions arrive as plain text or scraped HTML; show paragraphs, never markup. */
function paragraphs(description: string | null): string[] {
  if (!description) return [];
  return description
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function compactDate(date: string): string {
  return date.replace(/-/g, '');
}

function googleCalendarLink(g: Gathering, pageUrl: string): string {
  let dates: string;
  if (g.start_time) {
    const start = `${compactDate(g.date)}T${g.start_time.slice(0, 5).replace(':', '')}00`;
    const endTime = g.end_time ? g.end_time.slice(0, 5).replace(':', '') : null;
    const startHour = parseInt(g.start_time.slice(0, 2), 10);
    const end = endTime
      ? `${compactDate(g.end_date || g.date)}T${endTime}00`
      : startHour <= 21
        ? `${compactDate(g.date)}T${String(startHour + 2).padStart(2, '0')}${g.start_time.slice(3, 5)}00`
        : start;
    dates = `${start}/${end}`;
  } else {
    const last = new Date(`${g.end_date || g.date}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    dates = `${compactDate(g.date)}/${last.toISOString().slice(0, 10).replace(/-/g, '')}`;
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: g.title,
    dates,
    ctz: 'Europe/London',
    location: g.location,
    details: `${g.organizer}\n${pageUrl}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface MapPoint {
  lat: number;
  lon: number;
}

export function EventPage() {
  const { id = '' } = useParams();
  const [gathering, setGathering] = useState<Gathering | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [point, setPoint] = useState<MapPoint | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data, error } = await fetchGathering(id);
      if (!live) return;
      if (error) return setState('error');
      if (!data) return setState('missing');
      setGathering(data);
      setState('ready');
      document.title = `${data.title} · BLKOUT Events`;
    })();
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    if (!gathering || gathering.virtual_link) return;
    fetch(`/api/event-location/${gathering.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p && typeof p.lat === 'number' && setPoint({ lat: p.lat, lon: p.lon }))
      .catch(() => {});
  }, [gathering]);

  const pageUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const share = async () => {
    if (!gathering) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: gathering.title, url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      setShareNote('Link copied');
    } catch {
      setShareNote(null);
    }
  };

  if (state !== 'ready' || !gathering) {
    return (
      <div className="min-h-screen bg-[#0a0a14] noise">
        <Header />
        <div className="h-16" />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          {state === 'loading' ? (
            <div className="w-8 h-8 border-2 border-events border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#f5f1e8] mb-3">
                {state === 'error' ? 'We couldn’t load this gathering just now.' : 'This gathering isn’t listed, or it has already happened.'}
              </h1>
              <Link to="/gatherings" className="font-meta text-xs uppercase tracking-wide text-events hover:underline">
                See what’s on →
              </Link>
            </>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const g = gathering;
  const adultsOnly = (g.tags || []).some((t) => ADULTS_ONLY_TAGS.includes(t.toLowerCase()));
  const tags = (g.tags || []).filter((t) => !t.startsWith('confidence:') && !ADULTS_ONLY_TAGS.includes(t.toLowerCase()));
  const host = hostOf(g.url);
  // Some listings carry 'Zoom (online)' as the location with no virtual_link (KIN Town Hall, 25 Oct).
  const online = Boolean(g.virtual_link) || /^(zoom|online|virtual)\b/i.test(g.location.trim());
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(g.location)}`;
  const mapSrc = point
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${point.lon - 0.006},${point.lat - 0.003},${point.lon + 0.006},${point.lat + 0.003}&layer=mapnik&marker=${point.lat},${point.lon}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a14] noise">
      <Header />
      <div className="h-16" />

      <main className="max-w-3xl mx-auto px-4 pt-14 md:pt-20 pb-10">
        <Link to="/gatherings" className="inline-flex items-center gap-1 font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/60 hover:text-events mb-8">
          <ArrowLeft size={14} /> All gatherings
        </Link>

        {g.image_url && (
          <div className="aspect-video overflow-hidden border border-events/30 rounded-sharp mb-8">
            <img src={g.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {g.image_url?.includes('/event-images/') && (
          <p className="-mt-6 mb-8 text-xs text-[#f5f1e8]/50">Image: {g.organizer}</p>
        )}

        <p className="font-meta uppercase text-xs tracking-wide text-events mb-3">
          {formatWhen(g)}
          {adultsOnly && (
            <span className="font-meta text-xs uppercase tracking-wide border border-events/50 px-1.5 py-0.5 text-[#f5f1e8]/70 ml-2">18+</span>
          )}
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-[#f5f1e8] leading-tight mb-3">{g.title}</h1>
        <p className="text-[#f5f1e8]/70 mb-8">{g.organizer}</p>

        {/* The action, cost and the small tools, together so nobody hunts for them */}
        <section className="border border-events/30 bg-[#14141f] rounded-sharp p-5 mb-10">
          <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/60 mb-1">Cost</p>
          <p className="text-[#f5f1e8] mb-5">{formatCost(g.cost)}</p>

          <a
            href={g.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-events text-[#0a0a14] font-semibold py-3 rounded-sharp hover:opacity-90 transition-opacity"
          >
            Book or find out more <ExternalLink size={16} />
          </a>
          {host && <p className="text-center text-xs text-[#f5f1e8]/50 mt-2">on {host}, the organiser’s page</p>}

          <div className="flex flex-wrap gap-3 mt-5">
            <div className="relative">
              <button
                onClick={() => setCalendarOpen(!calendarOpen)}
                className="inline-flex items-center gap-2 border border-[#f5f1e8]/20 text-[#f5f1e8] px-3 py-2 text-sm rounded-sharp hover:border-events"
              >
                <CalendarPlus size={16} /> Add to calendar
              </button>
              {calendarOpen && (
                <div className="absolute z-20 mt-1 w-52 bg-[#0a0a14] border border-[#f5f1e8]/20 rounded-sharp">
                  <a href={googleCalendarLink(g, pageUrl)} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-sm text-[#f5f1e8] hover:bg-[#14141f]">
                    Google Calendar
                  </a>
                  <a href={`/e/${g.id}/calendar.ics`} className="block px-3 py-2 text-sm text-[#f5f1e8] hover:bg-[#14141f]">
                    Apple, Outlook and others (.ics)
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={share}
              className="inline-flex items-center gap-2 border border-[#f5f1e8]/20 text-[#f5f1e8] px-3 py-2 text-sm rounded-sharp hover:border-events"
            >
              <Share2 size={16} /> {shareNote || 'Share'}
            </button>
          </div>
        </section>

        {paragraphs(g.description).length > 0 && (
          <section className="mb-10">
            <h2 className="font-meta text-xs uppercase tracking-wide text-events mb-3">About</h2>
            {paragraphs(g.description).map((p, i) => (
              <p key={i} className="text-[#f5f1e8]/85 leading-relaxed mb-4 whitespace-pre-line">{p}</p>
            ))}
          </section>
        )}

        <section className="mb-10">
          <h2 className="font-meta text-xs uppercase tracking-wide text-events mb-3">Where</h2>
          {online ? (
            <p className="text-[#f5f1e8] flex items-center gap-2">
              <Video size={16} className="text-events" /> Online
              {g.location && !/^(online|virtual|zoom)/i.test(g.location) ? ` · ${g.location}` : ''}
            </p>
          ) : (
            <>
              <p className="text-[#f5f1e8] mb-3 flex items-start gap-2">
                <MapPin size={16} className="text-events mt-1 shrink-0" /> {g.location}
              </p>
              {mapSrc && (
                <div className="aspect-[16/9] border border-events/30 rounded-sharp overflow-hidden mb-3">
                  <iframe title={`Map: ${g.location}`} src={mapSrc} className="w-full h-full" loading="lazy" />
                </div>
              )}
              <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-meta text-xs uppercase tracking-wide text-events hover:underline">
                <Navigation size={14} /> Directions
              </a>
            </>
          )}
        </section>

        <section className="mb-10">
          <h2 className="font-meta text-xs uppercase tracking-wide text-events mb-3">Access</h2>
          <p className="text-[#f5f1e8]/80">
            The organiser hasn’t told us about access yet. Check their page, or ask them before you go.
          </p>
        </section>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {tags.map((t) => (
              <span key={t} className="font-meta text-[11px] uppercase tracking-widest border border-events/50 text-events px-2 py-[2px]">{t}</span>
            ))}
          </div>
        )}

        <p className="text-xs text-[#f5f1e8]/50 border-t border-[#f5f1e8]/10 pt-6">
          Listed on BLKOUT Events and checked by a person. Something wrong with this listing? Email hello@blkoutuk.com.
        </p>
      </main>

      <Footer />
    </div>
  );
}
