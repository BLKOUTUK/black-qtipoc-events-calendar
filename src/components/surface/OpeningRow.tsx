import { Opening } from '../../types/surface';

interface OpeningRowProps {
  opening: Opening;
}

const KIND_LABELS: Record<Opening['kind'], string> = {
  job: 'Job',
  commission: 'Commission',
  residency: 'Residency',
  bursary: 'Bursary',
  fund: 'Fund',
  call: 'Call',
  panel: 'Panel',
  training: 'Training',
  research: 'Research',
  other: 'Other',
};

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${deadline}T00:00:00`);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function formatDeadlineDate(deadline: string): string {
  const d = new Date(`${deadline}T00:00:00`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function OpeningRow({ opening }: OpeningRowProps) {
  const rolling = !opening.deadline;
  const days = opening.deadline ? daysUntil(opening.deadline) : null;
  const closingSoon = days !== null && days <= 7;

  return (
    <div className="border-b border-events/20 py-4 md:flex md:items-start md:gap-6">
      {/* Left: deadline */}
      <div className="md:w-40 shrink-0 mb-2 md:mb-0 font-meta text-xs uppercase tracking-wide">
        {rolling ? (
          <span className="text-[#f5f1e8]/70">Rolling</span>
        ) : (
          <>
            <span className="text-[#f5f1e8]/70">Closes {formatDeadlineDate(opening.deadline as string)}</span>
            <br />
            <span className={closingSoon ? 'text-events/100' : 'text-[#f5f1e8]/50'}>
              {closingSoon ? 'Closing soon' : `${days} days`}
            </span>
          </>
        )}
      </div>

      {/* Middle: content */}
      <div className="flex-1 min-w-0 mb-2 md:mb-0">
        <h3 className="font-semibold text-[#f5f1e8]">{opening.title}</h3>
        <p className="text-sm text-[#f5f1e8]/60">{opening.organisation}</p>
        {opening.summary && <p className="text-sm text-[#f5f1e8]/60 mt-1 line-clamp-2">{opening.summary}</p>}
        {opening.open_to && (
          <p className="text-sm text-[#f5f1e8]/50 mt-1">
            <span className="text-[#f5f1e8]/70">open to:</span> {opening.open_to}
          </p>
        )}
        {opening.pay && <p className="text-sm text-[#f5f1e8]/50 mt-1">{opening.pay}</p>}
      </div>

      {/* Right: kind, found by, apply */}
      <div className="md:w-44 shrink-0 flex flex-row md:flex-col items-start md:items-end gap-2 md:gap-1.5 md:text-right">
        <span className="font-meta text-xs uppercase tracking-wide border border-events/50 px-2 py-0.5 text-[#f5f1e8]/70">
          {KIND_LABELS[opening.kind]}
        </span>
        {opening.found_by && (
          <span className="font-disrupt italic text-sm text-[#f5f1e8]/60">Found by {opening.found_by}</span>
        )}
        <a
          href={opening.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-meta text-xs uppercase tracking-wide text-events/100 hover:underline"
        >
          Apply →
        </a>
      </div>
    </div>
  );
}
