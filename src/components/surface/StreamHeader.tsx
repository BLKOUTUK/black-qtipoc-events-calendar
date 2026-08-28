/**
 * StreamHeader — the repeated header pattern for all three streams (spec §3):
 * a 4px lemon rule, "NN — SECTION" with a state chip, the H2, and a Fraunces
 * italic one-liner. Identical structure for 01 Gatherings, 02 Openings, 03 Places.
 */

interface StreamHeaderProps {
  id: string;
  index: string; // '01' | '02' | '03'
  section: string; // 'GATHERINGS'
  heading: string; // 'THINGS TO GO TO'
  tagline: string; // Fraunces italic one-liner
  chipLabel: string; // 'ALL QUIET' or '4 coming up · checked 22 Aug'
}

export function StreamHeader({ id, index, section, heading, tagline, chipLabel }: StreamHeaderProps) {
  return (
    <div id={id} className="border-t-4 border-events/100 pt-6 scroll-mt-20">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="font-meta text-[13px] uppercase tracking-widest text-events/100">
          {index} — {section}
        </p>
        <span className="font-meta text-xs uppercase tracking-wide border border-events/100 px-3 py-1 text-[#f5f1e8]">
          {chipLabel}
        </span>
      </div>
      <h2 className="font-signature font-black uppercase text-3xl md:text-4xl tracking-tight mt-2 text-[#f5f1e8]">
        {heading}
      </h2>
      <p className="font-disrupt italic text-[#f5f1e8]/70 mt-2 max-w-[58ch]">{tagline}</p>
    </div>
  );
}
