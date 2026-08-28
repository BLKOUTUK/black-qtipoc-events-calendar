import { useState } from 'react';

/**
 * Ask AIvor — the page's front door for "what's happening?".
 * Hands the question to AIvor on blkoutuk.com (?chat=open&q=…), tagged so ivor-core knows it came
 * from the events surface. AIvor answers from the same live data this page shows
 * (gatherings_live, openings_live, /places.json) — see ivor-core DataContextService.
 */
const AIVOR = 'https://blkoutuk.com/?chat=open&utm_source=events-surface&utm_medium=ask-aivor';

const PROMPTS = [
  "what's on this month for Black queer men in London?",
  'where do Black queer men meet in Manchester?',
  'what can I apply for before the end of October?',
];

const askUrl = (q: string) => `${AIVOR}&utm_campaign=${encodeURIComponent(q.slice(0, 40))}&q=${encodeURIComponent(q)}`;

export function AskAIvor() {
  const [q, setQ] = useState('');
  return (
    <section id="ask" className="border-t-4 border-events/100 pt-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <p className="font-meta text-[13px] uppercase tracking-[0.2em] text-events/100">Ask AIvor</p>
        <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50">answers from this page's own data</p>
      </div>
      <h2 className="font-signature text-3xl md:text-4xl font-black uppercase tracking-tight leading-[0.95] text-[#f5f1e8] mt-2">
        What&rsquo;s happening?
      </h2>
      <p className="font-disrupt italic text-[#f5f1e8]/70 text-lg mt-3 max-w-[58ch]">
        ask in your own words — a borough, a month, a kind of thing. AIvor reads the same gatherings, openings and places you see here.
      </p>
      <form
        className="mt-6 flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const question = q.trim();
          if (question) window.open(askUrl(question), '_blank', 'noopener');
        }}
      >
        <label className="sr-only" htmlFor="ask-aivor">Ask AIvor what&rsquo;s happening</label>
        <input
          id="ask-aivor"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="what's on in Lambeth this month?"
          className="flex-1 min-h-[52px] px-4 bg-[#14141f] border border-events/40 focus:border-events/100 outline-none text-[#f5f1e8] placeholder:text-[#f5f1e8]/40 font-sans"
        />
        <button
          type="submit"
          className="min-h-[52px] px-8 bg-events/100 text-[#0a0a14] font-signature font-black uppercase tracking-tight text-[17px] hover:-translate-y-0.5 transition-transform"
        >
          Ask AIvor
        </button>
      </form>
      <ul className="mt-4 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <li key={p}>
            <a
              href={askUrl(p)}
              target="_blank"
              rel="noopener"
              className="inline-block font-meta text-xs uppercase tracking-wide px-3 py-2 border border-events/30 text-[#f5f1e8]/80 hover:border-events/100 hover:text-events/100"
            >
              {p}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
