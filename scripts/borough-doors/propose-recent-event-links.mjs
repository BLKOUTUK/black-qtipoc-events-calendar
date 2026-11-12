#!/usr/bin/env node
// Propose eventId links for each door's here.recently entries (events-door links spec, item B).
// Reads gatherings_page (anon, the same view the event page reads), matches each entry by month
// window + title words, and prints proposals for review. It never edits a data file: an accepted
// match is added by hand as "eventId" on the entry, then the door is rebuilt.
//
//   node scripts/borough-doors/propose-recent-event-links.mjs [--json out.json]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
const ROOT = join(HERE, '..', '..');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
);
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from .env');

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "Nov 2025", "Sep–Oct 2025" → [firstDay, lastDay] as YYYY-MM-DD, or null.
function windowOf(when) {
  const m = String(when).toLowerCase().match(/([a-z]{3})[a-z]*(?:\s*[–-]\s*([a-z]{3})[a-z]*)?\s+(\d{4})/);
  if (!m) return null;
  const a = MONTHS.indexOf(m[1]);
  const b = m[2] ? MONTHS.indexOf(m[2]) : a;
  if (a < 0 || b < 0) return null;
  const y = Number(m[3]);
  const pad = (n) => String(n).padStart(2, '0');
  const last = new Date(Date.UTC(y, b + 1, 0)).getUTCDate();
  return [`${y}-${pad(a + 1)}-01`, `${y}-${pad(b + 1)}-${pad(last)}`];
}

const STOP = new Set('the a an and of at in on for with to by from its our your this that — – - a black queer lgbt lgbtq'.split(' '));
const words = (s) =>
  new Set(
    String(s)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );

async function eventsBetween(from, to) {
  const q = `${URL_}/rest/v1/gatherings_page?select=id,title,date,location&date=gte.${from}&date=lte.${to}&order=date`;
  const r = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`gatherings_page ${r.status}: ${await r.text()}`);
  return r.json();
}

const proposals = [];
for (const file of readdirSync(DATA).filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const slug = file.replace(/\.json$/, '');
  const d = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
  for (const [i, r] of (d.here?.recently || []).entries()) {
    const w = windowOf(r.when);
    const row = { door: slug, index: i, when: r.when, what: r.what, current: r.eventId || null, candidates: [] };
    if (w) {
      const want = words(r.what);
      for (const e of await eventsBetween(...w)) {
        const got = words(`${e.title} ${e.location}`);
        const shared = [...want].filter((x) => got.has(x));
        const score = shared.length / Math.max(1, Math.min(want.size, got.size));
        if (shared.length >= 2) row.candidates.push({ id: e.id, title: e.title, date: e.date, location: e.location, score: +score.toFixed(2), shared });
      }
      row.candidates.sort((a, b) => b.score - a.score);
      row.candidates = row.candidates.slice(0, 3);
    }
    proposals.push(row);
  }
}

for (const p of proposals) {
  const top = p.candidates[0];
  console.log(`\n[${p.door} #${p.index}] ${p.when} — ${p.what.slice(0, 90)}`);
  if (p.current) console.log(`   already linked: ${p.current}`);
  if (!top) console.log('   no candidate (stays plain text)');
  for (const c of p.candidates) console.log(`   ${c.score.toFixed(2)}  ${c.date}  ${c.title.slice(0, 70)}  ·  ${c.id}`);
}
const out = process.argv.indexOf('--json');
if (out > -1) writeFileSync(process.argv[out + 1], JSON.stringify(proposals, null, 2));
console.log(`\n${proposals.length} entries · ${proposals.filter((p) => p.candidates.length).length} with a candidate`);
