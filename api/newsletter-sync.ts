// Newsletter opt-in sync (13 Nov 2026). Not a route: no default export, so server.ts's api/
// loader imports it without registering anything (same as event-borough.ts).
//
// Borough-door sign-ups carry a separate, unticked "monthly letter" box (event_interest.newsletter_opt_in).
// SendFox's own form is reCAPTCHA-protected, so the page can't post to it; this runs every 15 min
// from server.ts and adds ticked rows to SendFox list 631882 through the API. API-created contacts
// are unconfirmed: SendFox emails them to confirm, which is the double opt-in we want.
// Each row is stamped: newsletter_synced_at + a note ("sendfox contact <id>" or "FAILED ...").
// Transient failures (network, 429, 5xx) stay unstamped and retry on the next run.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const NEWSLETTER_LIST = 631882;

function rest(pathAndQuery: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

async function stamp(id: string, note: string) {
  const w = await rest(`event_interest?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ newsletter_synced_at: new Date().toISOString(), newsletter_sync_note: note }),
  });
  if (!w.ok) throw new Error(`stamp ${id} ${w.status}`);
}

export async function syncNewsletterOptIns(limit = 25): Promise<{ checked: number; added: number; failed: string[] }> {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  const r = await rest(`event_interest?select=id,email,name&newsletter_opt_in=is.true&newsletter_synced_at=is.null&order=signed_up_at.asc&limit=${limit}`);
  if (!r.ok) throw new Error(`event_interest read ${r.status}: ${await r.text()}`);
  const rows = (await r.json()) as { id: string; email: string | null; name: string | null }[];
  if (!rows.length) return { checked: 0, added: 0, failed: [] };

  // Same vault secret metrics-snapshot uses; metrics_secret is service-role only.
  const k = await rest('rpc/metrics_secret', { method: 'POST', body: JSON.stringify({ p_name: 'sendfox_api_key' }) });
  if (!k.ok) throw new Error(`vault sendfox_api_key ${k.status}`);
  const key = (await k.json()) as string;
  if (!key) throw new Error('vault sendfox_api_key: not set');

  let added = 0;
  const failed: string[] = [];
  for (const row of rows) {
    if (!row.email || !row.email.includes('@')) {
      await stamp(row.id, 'FAILED no email');
      failed.push(`${row.id}: no email`);
      continue;
    }
    try {
      const res = await fetch('https://api.sendfox.com/contacts', {
        method: 'POST',
        // metrics-snapshot sends curl's UA: SendFox's edge refuses some default fetch agents.
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'curl/8.5.0' },
        body: JSON.stringify({ email: row.email, first_name: (row.name || '').trim().split(/\s+/)[0] || undefined, lists: [NEWSLETTER_LIST] }),
      });
      const body = await res.text();
      if (res.ok) {
        let id = '';
        try { id = String(JSON.parse(body).id ?? ''); } catch {}
        await stamp(row.id, `sendfox contact ${id || '?'} → list ${NEWSLETTER_LIST}`);
        added++;
      } else if (res.status === 429 || res.status >= 500) {
        failed.push(`${row.id}: sendfox ${res.status} (will retry)`);
      } else {
        await stamp(row.id, `FAILED sendfox ${res.status}: ${body.slice(0, 200)}`);
        failed.push(`${row.id}: sendfox ${res.status}`);
      }
    } catch (e) {
      failed.push(`${row.id}: ${(e as Error).message} (will retry)`);
    }
  }
  return { checked: rows.length, added, failed };
}
