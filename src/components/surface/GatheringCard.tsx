import { MapPin } from 'lucide-react';
import { eventPath } from '../../lib/eventLink';
import { Gathering } from '../../types/surface';

interface GatheringCardProps {
  gathering: Gathering;
}

// Adults-only marker — matches intent, never subject matter (see EventCard.tsx for the
// fuller rationale: 'sex'/'sexual' deliberately excluded so sexual-health listings don't
// get flagged as adult content).
const ADULTS_ONLY_TAGS = ['18+', 'adults only', 'adult', '18 plus', 'over 18', 'kink', 'fetish', 'play party', 'nsfw'];

function isAdultsOnly(tags: string[] | null): boolean {
  if (!tags) return false;
  return tags.some((t) => ADULTS_ONLY_TAGS.includes(t.toLowerCase()));
}

function formatTime(time: string): string {
  const [hStr, mStr = '00'] = time.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return mStr === '00' ? `${h}${period}` : `${h}.${mStr}${period}`;
}

function formatDateLine(gathering: Gathering): string {
  const date = new Date(`${gathering.date}T00:00:00`);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (!gathering.start_time) return dateStr;
  return `${dateStr} · ${formatTime(gathering.start_time)}`;
}

function formatCost(cost: string | null): string {
  if (!cost) return 'price on the link';
  const trimmed = cost.trim();
  if (!trimmed || /^see link$/i.test(trimmed)) return 'price on the link';
  return trimmed;
}

export function GatheringCard({ gathering }: GatheringCardProps) {
  const adultsOnly = isAdultsOnly(gathering.tags);

  return (
    <div className="bg-[#14141f] border border-events/30 hover:border-events/80 hover:-translate-y-0.5 transition-all duration-200 rounded-sharp flex flex-col">
      {/* The bold adults-only banner from the old cards, back by Rob's choice (26 Oct 2026). */}
      {adultsOnly && (
        <div className="bg-purple-600 border-b-2 border-purple-800 px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-white font-black text-sm tracking-widest">XXX</span>
          <span className="text-white font-bold text-xs tracking-wide">SEX RATED</span>
          <span className="text-white font-black text-sm tracking-widest">XXX</span>
        </div>
      )}
      {gathering.image_url && (
        <div className="aspect-video overflow-hidden">
          <img src={gathering.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <p className="font-meta uppercase text-xs tracking-wide text-events/100 mb-2">
          {formatDateLine(gathering)}
        </p>
        <h3 className="text-[18px] font-semibold text-[#f5f1e8] leading-snug line-clamp-2 mb-2">{gathering.title}</h3>
        <p className="text-[13px] text-[#f5f1e8]/60 mb-2">{gathering.organizer}</p>
        <p className="text-sm text-[#f5f1e8]/60 mb-2">
          <MapPin size={14} className="inline-block -mt-0.5 mr-1 text-events/100" />
          {gathering.location}
        </p>
        <div className="pt-2 flex items-center justify-between gap-2">
          <span className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/70">
            {formatCost(gathering.cost)}
          </span>
          {/* Plain link, not a router link: Surface renders outside a router for design review (render-fixture.mjs) */}
          <a
            href={eventPath(gathering)}
            className="font-meta text-xs uppercase tracking-wide text-events/100 hover:underline"
          >
            Details →
          </a>
        </div>
      </div>
    </div>
  );
}
