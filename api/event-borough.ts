// Event borough (events-door links spec, item C, 12 Nov 2026). Not a route: no default export,
// so server.ts's api/ loader imports it without registering anything (same as image-finder.ts).
//
// Places an in-person event in its local authority from the free-text location:
//   1. a UK postcode in the text → postcodes.io → admin_district
//   2. otherwise OpenStreetMap Nominatim (GB only, one request a second per its usage policy)
//      → coordinates → postcodes.io reverse lookup → admin_district
// Online events and locations too vague to place ("London", "East London", "TBA") get NULL.
// fillEventBoroughs() runs hourly from server.ts over approved events not yet checked.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const NOMINATIM_UA = 'BLKOUT Events (https://events.blkoutuk.com; hello@blkoutuk.com)';

export type BoroughResult = { borough: string | null; reason: string; transient?: boolean };

const ONLINE = /^(via\s+)?(zoom|online|virtual|teams|google meet)\b/i;
const VAGUE = /^(uk|tba|tbc|location tba|venue tba|england|united kingdom|great britain|((central|north|south|east|west|north[- ]?east|north[- ]?west|south[- ]?east|south[- ]?west)\s+)?london)(,?\s*(uk|england|united kingdom))?$/i;
// Full postcode: upper case may run straight into the next word ("N16 7XNClosest stations"), so
// the case-sensitive pattern has no trailing word boundary; the case-insensitive one needs it.
const POSTCODE_UPPER = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/;
const POSTCODE_ANY = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;
// Outward code alone ("Stanley Arts SE25"), upper case only; used only when it lies in one district.
const OUTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\b(?!\s*\d[A-Z]{2})/;
// Scraper debris and placeholders that a map search would happily 'find' ("TBD" → TBD Morris, Loughborough).
const JUNK = /^(tbd|tbc|tba|checkout|various.*|secret location.*|"?y-m-d"?,?|west|east|north|south|central)$/i;
const LONDONISH = /\b(london|LONDON|London)\b|\b(E|EC|N|NW|SE|SW|W|WC)\d/; // postcode areas upper case only
// Nominatim hits this coarse can't name a borough (a hit on "London" itself would land in Westminster).
const COARSE = new Set(['country', 'state', 'region', 'province', 'county', 'state_district']);

let lastNominatim = 0;
// Greater London bounding box, for names with no place in them ("Studio 338", "Century Club").
const LONDON_BOX = '-0.52,51.70,0.34,51.28';
// A bare name found inside London must be a venue, not a same-named street or estate ("The Keep" is in East Sussex).
const VENUE_TYPES = new Set(['amenity', 'building', 'club', 'tourism', 'shop', 'leisure', 'office', 'historic', 'craft']);
const PLACE_TYPES = new Set(['city', 'town', 'village', 'suburb', 'hamlet', 'neighbourhood', 'quarter']);

async function nominatim(q: string, londonOnly = false): Promise<{ lat: number; lon: number; addresstype: string; name: string } | null | 'error'> {
  const wait = lastNominatim + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatim = Date.now();
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=gb${londonOnly ? `&viewbox=${LONDON_BOX}&bounded=1` : ''}&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': NOMINATIM_UA },
    });
    if (!r.ok) return 'error';
    const hits = (await r.json()) as { lat: string; lon: string; addresstype?: string; name?: string }[];
    if (!hits[0]) return null;
    return { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon), addresstype: hits[0].addresstype || '', name: hits[0].name || '' };
  } catch {
    return 'error';
  }
}

async function districtAtPoint(lat: number, lon: number): Promise<{ district: string; region: string } | null | 'error'> {
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=1&radius=2000`);
    if (!r.ok) return 'error';
    const j = (await r.json()) as { result?: { admin_district?: string; region?: string }[] | null };
    const hit = j.result?.[0];
    return hit?.admin_district ? { district: hit.admin_district, region: hit.region || '' } : null;
  } catch {
    return 'error';
  }
}

export async function boroughFor(location: string | null, virtualLink?: string | null): Promise<BoroughResult> {
  const loc = String(location || '').replace(/\s+/g, ' ').trim();
  if (!loc || VAGUE.test(loc)) return { borough: null, reason: 'too vague to place' };
  if (ONLINE.test(loc)) return { borough: null, reason: virtualLink ? 'online' : 'online (no link)' };

  const pc = loc.match(POSTCODE_UPPER) || loc.match(POSTCODE_ANY);
  if (pc) {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc[1].replace(/\s+/g, ''))}`);
      if (r.ok) {
        const j = (await r.json()) as { result?: { admin_district?: string } };
        if (j.result?.admin_district) return { borough: j.result.admin_district, reason: `postcode ${pc[1].toUpperCase()}` };
      } else if (r.status >= 500) return { borough: null, reason: 'postcodes.io error', transient: true };
    } catch {
      return { borough: null, reason: 'postcodes.io unreachable', transient: true };
    }
    // An unknown or retired postcode falls through to the place-name lookup.
  }

  // A full postcode that didn't resolve still has a usable outward code ("Kingsley Hall E3 3JH" → E3).
  const oc = pc ? [pc[0], pc[1].replace(/\s+/g, '').slice(0, -3)] : loc.match(OUTCODE);
  let outcodeDistricts: string[] = [];
  if (oc) {
    try {
      const r = await fetch(`https://api.postcodes.io/outcodes/${oc[1]}`);
      if (r.ok) {
        const j = (await r.json()) as { result?: { admin_district?: string[] } };
        const ds = j.result?.admin_district || [];
        outcodeDistricts = ds;
        if (ds.length === 1) return { borough: ds[0], reason: `outcode ${oc[1]}` };
      } else if (r.status >= 500) return { borough: null, reason: 'postcodes.io error', transient: true };
    } catch {
      return { borough: null, reason: 'postcodes.io unreachable', transient: true };
    }
  }

  // Map search: the cleaned text, then the venue part alone ("London, Tate Institute Silvertown").
  const cleaned = loc.replace(POSTCODE_ANY, ' ').replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\.?/gi, ' ').replace(/\b\d{4}\b/g, ' ').replace(/^(at|the venue is)\s+/i, '').replace(/[\s,;:.]+$/, '').replace(/\s+/g, ' ').trim();
  const core = cleaned.replace(/(^|,)\s*(london|uk|united kingdom|england)\s*(?=,|$)/gi, '$1').replace(/^[\s,]+|[\s,]+$/g, '').trim();
  if (!core || core.replace(/[^a-z]/gi, '').length < 4 || JUNK.test(core)) return { borough: null, reason: 'too vague to place' };
  const spelled = (t: string) => t.replace(/\bSaint\b/g, 'St').replace(/\bRd\b\.?/g, 'Road').replace(/'s\b/g, 's');
  const queries = [...new Set([cleaned, LONDONISH.test(loc) && core !== cleaned ? `${core}, London` : core, spelled(cleaned)])].filter(Boolean).slice(0, 3);
  // No comma and no London marker: a bare name ("The Keep"). Search inside Greater London; outside it,
  // accept only a hit that is itself a town or city ("Norwich"), never a same-named building elsewhere.
  const bare = !cleaned.includes(',') && !LONDONISH.test(loc);

  let reason = 'no map match';
  for (const q of queries) {
    let hit = await nominatim(q, bare);
    if (bare && hit !== 'error') {
      // A bare name is searched both inside London and UK-wide. A town or city wins ("Edinburgh" is not
      // the Duke of Edinburgh pub); a name that is also a venue outside London is ambiguous
      // ("Loughborough University" has a London campus) and stays unplaced.
      const inLondon = hit && VENUE_TYPES.has(hit.addresstype) ? hit : null;
      const wide = await nominatim(q);
      if (wide === 'error') hit = 'error';
      else if (wide && PLACE_TYPES.has(wide.addresstype)) hit = wide;
      else if (inLondon && wide) {
        const wd = await districtAtPoint(wide.lat, wide.lon);
        if (wd && wd !== 'error' && wd.region !== 'London') { reason = `ambiguous: ${q} in London and in ${wd.district}`; continue; }
        hit = inLondon;
      } else hit = inLondon;
    }
    if (hit === 'error') return { borough: null, reason: 'nominatim error', transient: true };
    if (!hit) continue;
    if (COARSE.has(hit.addresstype) || (hit.addresstype === 'city' && /^(greater )?london$/i.test(hit.name))) {
      reason = `map match too coarse (${hit.addresstype} ${hit.name})`;
      continue;
    }
    const d = await districtAtPoint(hit.lat, hit.lon);
    if (d === 'error') return { borough: null, reason: 'postcodes.io reverse error', transient: true };
    if (!d) { reason = `no postcode near map match (${hit.name})`; continue; }
    if (outcodeDistricts.length && !outcodeDistricts.includes(d.district)) { reason = `map match outside ${oc?.[1]} (${hit.name}, ${d.district})`; continue; }
    // A venue hit must be the venue asked for: most of the query's words in its name
    // ("London Performance Studios" once matched Empire Performance Studios, Enfield).
    if (VENUE_TYPES.has(hit.addresstype) && !/^\d/.test(q)) {
      const ws = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1 && w !== 'the');
      const asked = ws(q.split(',').find((part) => !/^\s*(london|uk|england)\s*$/i.test(part)) || q);
      const got = new Set(ws(hit.name));
      const share = asked.filter((w) => got.has(w)).length / Math.max(1, asked.length);
      const contained = got.size > 0 && [...got].every((w) => asked.includes(w));
      if (share < 0.75 && !contained) { reason = `map match is a different venue (${hit.name})`; continue; }
    }
    if (LONDONISH.test(loc) && d.region !== 'London') { reason = `map match outside London (${hit.name}, ${d.district})`; continue; }
    // Outside London a named town must agree ("Saint Peters House, Manchester" once landed in Stockport).
    const town = !LONDONISH.test(loc) ? cleaned.split(',').slice(1).map((t) => t.trim()).filter((t) => /^[a-z][a-z .'-]{3,}$/i.test(t)).pop() : undefined;
    if (town && !d.district.toLowerCase().includes(town.toLowerCase().replace(/^city of /, ''))) { reason = `map match not in ${town} (${hit.name}, ${d.district})`; continue; }
    return { borough: d.district, reason: `map match ${hit.addresstype} "${hit.name}"` };
  }
  return { borough: null, reason };
}

function rest(pathAndQuery: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

/** Look up approved events never checked. Transient failures leave the row unchecked for the next run. */
export async function fillEventBoroughs(limit = 40): Promise<{ checked: number; placed: number; failed: string[] }> {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  const r = await rest(`events?select=id,title,location,virtual_link&status=in.(approved,published)&borough_checked_at=is.null&order=date.desc&limit=${limit}`);
  if (!r.ok) throw new Error(`events read ${r.status}: ${await r.text()}`);
  const rows = (await r.json()) as { id: string; title: string; location: string | null; virtual_link: string | null }[];
  let placed = 0;
  const failed: string[] = [];
  for (const e of rows) {
    const res = await boroughFor(e.location, e.virtual_link);
    if (res.transient) {
      failed.push(`${e.title}: ${res.reason}`);
      continue;
    }
    const w = await rest(`events?id=eq.${e.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ borough: res.borough, borough_checked_at: new Date().toISOString() }),
    });
    if (!w.ok) failed.push(`${e.title}: write ${w.status}`);
    else if (res.borough) placed++;
  }
  return { checked: rows.length, placed, failed };
}
