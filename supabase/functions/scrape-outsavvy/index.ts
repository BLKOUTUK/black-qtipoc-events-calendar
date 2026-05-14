// DEPRECATED — 15 May 2026
//
// This Edge Function used to do its own HTML scraping of OutSavvy and write
// rows with `source: 'OutSavvy'`. It produced 272 lifetime rows (86 approved,
// 186 rejected) but stopped firing on its own around 1 May 2026 — likely
// because the orchestrator that called it stopped running.
//
// The OutSavvy ingestion path has been replaced by the JSON-LD extractor
// at `scraper/outsavvyJsonLdExtractor.js`, invoked by the Tavily discovery
// pipeline (`scraper/tavilyEventDiscovery.js`). Rows from that path carry
// the canonical source label `'OutSavvy (JSON-LD)'`.
//
// This stub stays in place rather than being deleted because we don't have
// visibility into every cron / pg_cron / external scheduler that might still
// invoke this URL. Returning a successful no-op keeps any unknown caller
// graceful while ensuring the legacy `'OutSavvy'` source label can never be
// produced again.
//
// Surfaced by the 15 May 2026 queue audit at:
//   projects/events-calendar/spikes/2026-05-14-data-source-spike.md
// (Finding 1 — two parallel OutSavvy source labels in production.)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEPRECATION_NOTICE = {
  success: true,
  deprecated: true,
  events_found: 0,
  events_added: 0,
  message:
    'scrape-outsavvy is deprecated. OutSavvy events now flow through ' +
    'tavilyEventDiscovery + outsavvyJsonLdExtractor (source: "OutSavvy (JSON-LD)"). ' +
    'See projects/events-calendar/spikes/2026-05-14-data-source-spike.md.',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[scrape-outsavvy] DEPRECATED — invocation ignored, returning no-op');

  return new Response(JSON.stringify(DEPRECATION_NOTICE), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
