#!/usr/bin/env node
// Doors as data: writes public/doors.json from every door's data file, so AIvor can
// read what each door says (same pattern as public/places.json). Called at the end of
// build-borough-doors.mjs; safe to run on its own: node scripts/borough-doors/emit-doors-json.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, 'data');
const PUBLIC = join(here, '..', '..', 'public');
const ring = (r) => (r?.entries ?? []).map(({ name, url, note, centres }) => ({ name, url, note, centres }));

export function emitDoorsJson() {
  const doors = [];
  const sitemap = readFileSync(join(PUBLIC, 'sitemap.xml'), 'utf8');
  for (const f of readdirSync(DATA).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()) {
    const slug = f.replace(/\.json$/, '');
    if (!existsSync(join(PUBLIC, slug, 'index.html'))) continue; // only doors that are built
    if (!sitemap.includes(`/${slug}/<`)) continue; // listed doors only: unlisted drafts (e.g. Birmingham) stay out
    const d = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    if (!d.canonicalUrl?.startsWith('https://events.blkoutuk.com/')) continue;
    const borough = (d.hero?.heading ?? '').replace(/^BLKOUT in\s+/i, '') || slug;
    doors.push({
      slug, borough, url: d.canonicalUrl, lastChecked: d.lastChecked,
      history: d.numbers?.history ?? d.history?.body ?? d.history ?? '',
      here: ring(d.here), besideUs: ring(d.besideUs), worthTheJourney: ring(d.worthTheJourney),
      services: ring(d.services),
      quietNote: d.here?.quietNote,
    });
  }
  writeFileSync(join(PUBLIC, 'doors.json'), JSON.stringify({ generated: new Date().toISOString(), source: 'https://events.blkoutuk.com/', doors }, null, 1));
  return doors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const d of emitDoorsJson())
    console.log(`${d.slug}: here ${d.here.length} · beside ${d.besideUs.length} · journey ${d.worthTheJourney.length} · services ${d.services.length} · history ${typeof d.history === 'string' ? d.history.length : 'NOT-STRING'}`);
}
