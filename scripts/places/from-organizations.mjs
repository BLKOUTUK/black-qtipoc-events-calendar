#!/usr/bin/env node
// Places: candidates from Rob's CRM `organizations` table (the real source — 172 curated rows),
// not the 2025 markdown directory. Writes scripts/places/checked/part-3-organizations.json prefilled;
// a grading pass then sets centres/region/status with evidence, and merge.mjs publishes.
// Needs SUPABASE_URL/VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment (source .env.local).
// Usage: node scripts/places/from-organizations.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const URL_ = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error('FAILED: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }

const never = JSON.parse(readFileSync(join(here, 'never-list.json'), 'utf8')).never;
const already = new Set();
for (const f of readdirSync(join(here, 'checked')).filter((f) => /^part-[12]\.json$/.test(f)))
  for (const p of JSON.parse(readFileSync(join(here, 'checked', f), 'utf8'))) already.add(p.name.toLowerCase());

const TYPES = ['grassroots_community', 'media_cultural', 'healthcare_provider', 'policy_advocacy'];
const q = `${URL_}/rest/v1/organizations?select=id,name,org_type,sector,geography_scope,country,website,address,social_media,notes,relationship_status,created_at&org_type=in.(${TYPES.join(',')})&order=name`;
const res = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
if (!res.ok) { console.error('FAILED: PostgREST', res.status, await res.text()); process.exit(1); }
const rows = await res.json();

const slug = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const KIND = { grassroots_community: 'group', media_cultural: 'collective', healthcare_provider: 'service', policy_advocacy: 'organisation' };
const yearHit = (t) => (t || '').match(/\b(2025|2026)\b/);
const cityOf = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.venue, addr.street, addr.city || addr.town, addr.postcode].filter(Boolean).join(', ');
};
const regionOf = (text) => {
  const t = text.toLowerCase();
  if (/\b(london|brixton|hackney|croydon|lambeth|soho|peckham|lewisham|southwark|e\d{1,2}\b|se\d{1,2}\b|sw\d{1,2}\b|n\d{1,2}\b|w\d{1,2}\b)/.test(t)) return 'london';
  if (/\b(manchester|leeds|sheffield|bradford|liverpool|newcastle|york|hull|salford)\b/.test(t)) return 'north';
  if (/\b(birmingham|nottingham|leicester|coventry|wolverhampton|derby)\b/.test(t)) return 'midlands';
  if (/\b(bristol|bath|plymouth|exeter|cornwall|devon|somerset)\b/.test(t)) return 'south-west';
  if (/\b(brighton|luton|reading|oxford|southampton|kent|sussex|essex|milton keynes)\b/.test(t)) return 'south-east';
  if (/\b(cardiff|swansea|wales|cymru)\b/.test(t)) return 'wales';
  if (/\b(glasgow|edinburgh|scotland|dundee|aberdeen)\b/.test(t)) return 'scotland';
  return 'uk-wide';
};

const out = []; let skippedNever = 0, skippedDup = 0, skippedEnded = 0;
for (const r of rows) {
  const name = r.name.trim();
  if (never.some((n) => name.toLowerCase().includes(n.match))) { skippedNever++; continue; }
  if (already.has(name.toLowerCase())) { skippedDup++; continue; }
  if (r.relationship_status === 'ended') { skippedEnded++; continue; }
  const notes = (r.notes || '').replace(/\s+/g, ' ').trim();
  const addr = cityOf(r.address);
  const whereText = [addr, r.geography_scope, name, notes.slice(0, 160)].join(' ');
  const hit = yearHit(notes);
  const ig = r.social_media && typeof r.social_media === 'object' ? (r.social_media.instagram || r.social_media.ig || null) : null;
  out.push({
    id: slug(name),
    org_id: r.id,
    name,
    what: notes.split(/(?<=\.)\s/)[0].replace(/^[⚠️🔍]+\s*VERIFY:?\s*/u, '').slice(0, 110),
    where: addr || (r.geography_scope === 'national' || r.geography_scope === 'uk_wide' ? 'UK-wide' : ''),
    region: regionOf(whereText),
    kind: KIND[r.org_type] || 'organisation',
    url: r.website || undefined,
    instagram: ig || undefined,
    centres: 'qtipoc',            // TO GRADE — placeholder
    checked: '2026-08',
    evidence: hit ? `CRM notes (Rob) mention ${hit[1]}: "${notes.slice(0, 140)}"` : `CRM notes: "${notes.slice(0, 140)}" — no 2025/26 date in notes; currency to check`,
    status: hit && !/VERIFY/i.test(notes) ? 'live' : 'unclear',
    sector: r.sector, org_type: r.org_type, geography_scope: r.geography_scope, notes_full: notes,
  });
}
const target = join(here, 'checked', 'part-3-organizations.json');
writeFileSync(target, JSON.stringify(out, null, 2));
console.log(`organizations rows ${rows.length} → ${out.length} candidates written to ${target}`);
console.log(`skipped: never-list ${skippedNever}, already in parts 1–2 ${skippedDup}, ended ${skippedEnded}`);
console.log('prefilled status:', Object.fromEntries(['live', 'unclear'].map((s) => [s, out.filter((o) => o.status === s).length])));
console.log('region guess:', Object.fromEntries([...new Set(out.map((o) => o.region))].map((r) => [r, out.filter((o) => o.region === r).length])));
console.log('sample address shapes:', JSON.stringify(rows.slice(0, 3).map((r) => r.address)));
console.log('sample social shapes:', JSON.stringify(rows.filter((r) => r.social_media).slice(0, 2).map((r) => r.social_media)));
