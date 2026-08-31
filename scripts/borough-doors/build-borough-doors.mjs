#!/usr/bin/env node
/**
 * Borough-door template — THE production renderer (adopted 31 Aug 2026).
 *
 * Reads data/<slug>.json, writes public/<slug>/. Built as a parallel design for
 * comparison against the original template, then adopted on Rob's call.
 * The superseded renderer is kept as build-borough-doors-v1.mjs — the three
 * doors opened before adoption were produced by it and have NOT been
 * re-rendered; retrofitting them changes three live pages and is a separate call.
 *
 * Grammar: TYPOGRAPHIC POSTER (scrollcraft §2.5). Chosen because Sound Ethics'
 * design IS type-as-architecture, and because findimg found no BLKOUT-owned
 * photography of this borough — the grammar scrollcraft names for exactly that.
 *
 * Fingerprint (differs >=4/6 from every registry row):
 *   grammar   typographic poster        (movement=split stage; enterprise=chaptered editorial)
 *   nav       index set at composition scale, jumps — answers Derek Aidoo's
 *             28 Aug note that vital sections get lost on one long page
 *   hero      borough name at extreme scale, real <h1> behind it
 *   close     the door COMPLETES the signature move (not a colophon — that is taken)
 *   signature THE GUESS BEFORE THE NUMBER (Rob's idea, 31 Aug 2026). The figure is
 *             masked until the visitor commits a guess; the field then paints their
 *             guess against the census estimate and names the gap. Public data only,
 *             nothing recorded, nothing sent. Replaces the cut Roll Call.
 *
 *   cut       The Roll Call (dots lighting as men signed the door) was removed on
 *             Rob's instruction, 31 Aug 2026: displaying a per-borough tally of the
 *             people we hold runs against the privacy maxim the door itself states.
 *             The dot field survives as a picture of the CENSUS estimate only — public
 *             data about a population, never our own record of individuals. No
 *             replacement gimmick has been invented to fill the slot.
 *
 * Constraints held deliberately:
 *   - flexbox only. No grid, no :has, no sticky — wkhtmltoimage (the render
 *     check) supports none of them, and both templates must stay verifiable.
 *   - degrades without JS: reveals are opt-IN via a .js class on <html>, so a
 *     no-JS reader gets the whole page at full opacity.
 *   - palette is the ratified brand: black ground, sovereignty gold, white.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// Places directory (scripts/places/merge.mjs output) — doors read the same data the
// Places page shows, which is also where the never-list gate is enforced.
const placesAll = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'places', 'places.json'), 'utf8'));
const slugify = (b) => String(b ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const placesIn = (slug) => placesAll.filter((pl) => pl.published && slugify(pl.borough) === slug);
const DATA = join(HERE, 'data');
const OUT = join(HERE, '..', '..', 'public');

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const paras = (s) => String(s ?? '').split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('\n');
const DESTINATION_GRADES = new Set(['black-queer-men', 'black-lgbtq']);
const num = (n) => String(n).padStart(2, '0');
const fmt = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function ringList(entries = []) {
  if (!entries.length) return '';
  return `<ul class="ring">
${entries
  .map(
    (e) => `      <li class="reveal">
        <a class="ring-name" href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a>
        <p>${esc(e.note)}</p>
        <span class="stamp">${e.currencyChecked ? 'checked' : 'listed, not yet re-checked'}</span>
      </li>`
  )
  .join('\n')}
    </ul>`;
}




// Photographic grounds, ported from src/components/foundation/FoundationLayer.tsx.
// Same 33 curated images, same per-image anchors (eyes first, hands if no eye line),
// same background-size:cover mechanism. Dark sections only: a photograph under the
// bone or gold plates would muddy both.
const ground = (img, anchor) => `      <div class="ground" aria-hidden="true" style="background-image:url('../images/foundation/${img}'); background-position:${anchor}"></div>
      <div class="scrim" aria-hidden="true"></div>`;

function plate(n, kicker, heading, bodyHtml, extraClass = '', id = null, bg = null) {
  return `  <section class="plate ${extraClass}${bg ? ' has-bg' : ''}" id="${id ?? `s-${n}`}">
${bg ? ground(bg[0], bg[1]) : ''}
    <div class="plate-head reveal">
      <span class="numeral">(##)</span>
      <span class="kicker">${esc(kicker)}</span>
    </div>
    <h2 class="display reveal">${esc(heading)}</h2>
    <div class="plate-body reveal">
${bodyHtml}
    </div>
  </section>`;
}

function build(slug) {
  const d = JSON.parse(readFileSync(join(DATA, `${slug}.json`), 'utf8'));
  const census = JSON.parse(readFileSync(join(DATA, '_census.json'), 'utf8'));
  const row = census.rows.find((r) => r.borough.toLowerCase() === slug.toLowerCase());

  const split = (entries = []) => {
    const kept = [], skipped = [];
    for (const e of entries) (DESTINATION_GRADES.has(e.centres) ? kept : skipped).push(e);
    return { kept, skipped };
  };
  const hereSplit = split(d.here?.entries);
  const journeySplit = split(d.worthTheJourney?.entries);
  const skipped = [...hereSplit.skipped, ...journeySplit.skipped];
  const unchecked = [...(d.besideUs?.entries ?? []), ...journeySplit.kept, ...hereSplit.kept].filter(
    (e) => !e.currencyChecked
  );

  // THE ROLL CALL — signature move. Upper bound of the published estimate.
  const estUpper = row ? parseInt(String(row.estBqm).split('–').pop().replace(/[^0-9]/g, ''), 10) : 0;
  const estLower = row ? parseInt(String(row.estBqm).split('–')[0].replace(/[^0-9]/g, ''), 10) : 0;
  const namedHere = hereSplit.kept.length;

  const boroughWord = d.brandForm.replace(/^BLKOUT in\s+/i, '');

  // ---- sections -----------------------------------------------------------
  const sections = [];
  let n = 0;

  sections.push(
    plate(
      ++n,
      'The record',
      'It started here',
      paras(d.numbers?.history) +
        (d.numbers?.body ? `\n<p class="aside">${esc(d.numbers.body)}</p>` : ''),
      '',
      'the-record',
      ['power-09.jpg', '50% 25%']
    )
  );

  // authored silence before the peak (scrollcraft: one peak, silence before it)
  const silence = `  <section class="silence" aria-hidden="true"></section>`;

  const rings = [];
  if (hereSplit.kept.length || d.here?.quietNote) {
    rings.push(
      plate(
        ++n,
        'In the borough',
        d.here.heading,
        (d.here.intro ? `<p>${esc(d.here.intro)}</p>` : '') +
          (hereSplit.kept.length
            ? ringList(hereSplit.kept)
            : `<p class="quiet">${esc(d.here.quietNote ?? '')}</p>`) +
          // Past events are rot-proof: what already happened here never goes stale.
          (d.here.recently?.length
            ? `\n      <div class="recently">
        <h3>Recently in the borough</h3>
        <ul>
${d.here.recently.map((r) => `          <li><span class="when">${esc(r.when)}</span> ${esc(r.what)}</li>`).join('\n')}
        </ul>
${d.here.recentlyNote ? `        <p class="recently-note">${esc(d.here.recentlyNote)}</p>` : ''}
      </div>`
            : '') +
          ((pls) => pls.length
            ? `\n      <div class="directory">
        <h3>In the directory — ${esc(d.brandForm ?? d.slug)}</h3>
        <ul>
${pls.map((pl) => `          <li><strong>${pl.url ? `<a href="${esc(pl.url)}" rel="noopener">${esc(pl.name)}</a>` : esc(pl.name)}</strong> — ${esc(pl.what)}</li>`).join('\n')}
        </ul>
        <p class="directory-note">From the BLKOUT Places directory — <a href="https://events.blkoutuk.com/places">every entry checked for activity in the last year</a>.</p>
      </div>`
            : '')(placesIn(d.slug)) +
          `\n      <div class="calendar-card">
        <h3><a href="https://events.blkoutuk.com/?utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Gatherings across London — the BLKOUT events calendar</a></h3>
        <p>Fewer and truer: what's actually on for Black queer London, checked by people, never padded.</p>
      </div>`,
        '',
        'in-the-borough'
      )
    );
  }
  if (d.besideUs?.entries?.length) {
    rings.push(
      plate(++n, 'Neighbours', d.besideUs.heading, `<p>${esc(d.besideUs.intro)}</p>` + ringList(d.besideUs.entries))
    );
  }
  if (journeySplit.kept.length) {
    rings.push(
      plate(
        ++n,
        'Further out',
        d.worthTheJourney.heading,
        `<p>${esc(d.worthTheJourney.intro)}</p>` + ringList(journeySplit.kept)
      )
    );
  }
  if (d.services?.entries?.length) {
    rings.push(
      plate(++n, 'Health', d.services.heading, `<p>${esc(d.services.intro)}</p>` + ringList(d.services.entries), 'invert')
    );
  }

  const rollcall = `  <section class="plate rollcall" id="the-count">
    <div class="plate-head reveal">
      <span class="numeral">(##)</span>
      <span class="kicker">The count nobody keeps</span>
    </div>
    <h2 class="display reveal" id="count-figure" data-figure="${esc(fmt(estUpper))}">${esc(fmt(estUpper))}</h2>
    <div class="plate-body reveal">
      <div class="guess" id="guess" hidden>
        <label class="guess-q" for="guess-input">Before you look — how many Black queer men do you think live in ${esc(
          boroughWord
        )}?</label>
        <input type="range" id="guess-input" min="0" max="${estUpper * 2}" step="25" value="${Math.round(
    estUpper / 4
  )}">
        <p class="guess-read"><output id="guess-out">${fmt(Math.round(estUpper / 4))}</output></p>
        <button class="submit" type="button" id="guess-go">Show me the estimate</button>
        <p class="guess-note">Your guess stays in this browser.</p>
      </div>
      <p class="guess-result" id="guess-result" hidden></p>
      <p class="rollcall-lede" id="count-lede">One dot for every Black queer man the census estimate puts in ${esc(
        boroughWord
      )} — between ${esc(fmt(estLower))} and ${esc(fmt(estUpper))} of us.</p>
      <div class="field" id="rollfield" data-total="${estUpper}"></div>
      <div class="table-wrap"><table class="census">
        <caption>${esc(census.note)}</caption>
        <thead><tr><th>Borough</th><th>Black residents (2021)</th><th>Black queer men (est.)</th></tr></thead>
        <tbody>
${census.rows.map((r) => `          <tr${r.borough === boroughWord ? ' class="self"' : ''}><td>${esc(r.borough)}</td><td>${esc(r.blackResidents)}</td><td>${esc(r.estBqm)}</td></tr>`).join('\n')}
        </tbody>
      </table></div>
      <p class="census-source">${esc(census.source)}</p>
      <p class="rollcall-note">Nobody keeps this number. Not the council, not the NHS, not the people who commission work in this borough. The estimate is ours, built from the 2021 Census, because a population nobody counts is a population nobody plans for.</p>
    </div>
  </section>`;


  const quiz = d.quiz
    ? plate(
        ++n,
        'Test yourself',
        d.quiz.heading,
        `<p>${esc(d.quiz.sub)}</p>
${d.quiz.questions
  .map(
    (q, i) => `      <div class="q">
        <p class="q-q"><span class="q-n">${num(i + 1)}</span> ${esc(q.q)}</p>
        <div class="q-options">
${q.options.map((o) => `          <button type="button" data-correct="${o.correct ? 1 : 0}">${esc(o.t)}</button>`).join('\n')}
        </div>
        <p class="q-reveal">${esc(q.reveal)}</p>
      </div>`
  )
  .join('\n')}
      <p class="q-score" id="q-score"></p>`,
        'gold'
      )
    : '';

  const biblio = d.bibliography?.entries?.length
    ? plate(
        ++n,
        'Read further',
        'Reading the borough',
        `<p>${esc(d.bibliography.intro)}</p>
      <ul class="biblio">
${d.bibliography.entries
  .map(
    (b) => `        <li><em>${esc(b.title)}</em>${b.author ? ` — ${esc(b.author)}` : ''}${
      b.year ? `, ${esc(b.year)}` : ''
    }${b.note ? `. ${esc(b.note)}` : ''}${
      b.url ? ` <a href="${esc(b.url)}" rel="noopener">${esc(b.urlLabel ?? 'Open')}</a>` : ''
    }</li>`
  )
  .join('\n')}
      </ul>` +
          (d.archive
            ? `\n      <div class="archive"><h3>From the BLKOUT archive</h3><p>${esc(d.archive.intro)}</p>${
                d.archive.entries?.length
                  ? `<ul class="biblio">${d.archive.entries
                      .map(
                        (e) =>
                          `<li><em><a href="${esc(e.url)}" rel="noopener">${esc(e.title)}</a></em>${
                            e.when ? ` — ${esc(e.when)}` : ''
                          }</li>`
                      )
                      .join('')}</ul>`
                  : ''
              }<a class="ghost" href="https://blkoutuk.com/?tab=stories&utm_source=borough-door&utm_campaign=${esc(
                d.slug
              )}" rel="noopener">Browse the story archive</a></div>`
            : '')
      )
    : '';

  const faq = d.faq?.length
    ? plate(
        ++n,
        'Questions',
        'Asked, answered',
        d.faq
          .map(
            (f) => `      <details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`
          )
          .join('\n')
      )
    : '';

  const doorN = ++n;
  const door = `  <section class="plate door has-bg" id="s-door">
${ground('joy-09.jpg', '50% 30%')}
    <div class="plate-head">
      <span class="numeral">(##)</span>
      <span class="kicker">The door</span>
    </div>
    <h2 class="display">${esc(d.door.heading)}</h2>
    <p class="tender">${esc(d.door.tender)}</p>
    <p>${esc(d.door.intro)}</p>
    <form id="door-form" novalidate>
${d.door.options
  .map(
    (o, i) => `      <label class="option"><input type="radio" name="interest" value="${esc(o.value)}"${
      i === 0 ? ' checked' : ''
    }><span class="opt-text"><strong>${esc(o.title)}</strong><span>${esc(o.body)}</span></span></label>`
  )
  .join('\n')}
      <label class="field-l" for="f-name">Your name</label>
      <input id="f-name" type="text" autocomplete="name" required>
      <label class="field-l" for="f-email">Your email</label>
      <input id="f-email" type="email" autocomplete="email" required>
      <label class="holder"><input id="f-holder" type="checkbox"> ${esc(d.door.holderLabel)}</label>
      <button class="submit" type="submit">Walk through</button>
      <p class="msg" id="door-msg"></p>
    </form>
  </section>`;

  // These were missing from the first draft of this template and restored from v1;
  // a section dropped here is a section that silently vanishes from every door.
  const nextDoor = d.neighbours?.length
    ? plate(++n, 'The other doors', 'Next door',
        `<p>The doors are opening borough by borough. Step through, or help us open the next one.</p>
      <div class="pills">
${d.neighbours
  .map((nb) =>
    existingSlugs.has(nb.slug)
      ? `        <a class="pill open" href="../${esc(nb.slug)}/">${esc(nb.name)}</a>`
      : `        <span class="pill closed">${esc(nb.name)} — no door yet</span>`
  )
  .join('\n')}
      </div>`, '', 'next-door')
    : '';

  const hubN = ++n;
  const hub = `  <section class="plate invert" id="join">
    <div class="plate-head reveal">
      <span class="numeral">(##)</span>
      <span class="kicker">The members' room</span>
    </div>
    <h2 class="display reveal">Step inside</h2>
    <div class="plate-body reveal">
      <p class="tender">The door is how we find each other. BLKOUTHUB is where we live.</p>
      <p>The members' room: Black queer men across the UK, owned by the men in it. Why knock:</p>
      <ul class="reasons">
        <li><strong>Real connection.</strong> Nearly four in five members say they came to find it — and found it.</li>
        <li><strong>No algorithm, no ads, nothing sold onward.</strong> A room that doesn't monetise you. Your attention is yours; we're after your company.</li>
        <li><strong>Where things actually start.</strong> Occasions, groups, and the knowledge that never gets written down — passed man to man, the way it always has been.</li>
        <li><strong>Owned by us.</strong> A co-operative with an asset lock: what we build together stays ours, and passes to the men who come after.</li>
      </ul>
      <a class="ghost" href="https://blkouthub.com/?utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Join BLKOUTHUB</a>
      <div class="aivor">
        <p>And don't just read about <strong>AIvor</strong> — talk with him. Our own voice, named for the man whose name is over every door. Ask him about BLKOUT, about Black queer life, about ${esc(boroughWord)} — he answers.</p>
        <a class="ghost" href="https://blkoutuk.com/?chat=open&utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Talk with AIvor now</a>
        <video controls preload="none" playsinline poster="../images/aivor-poster.jpg">
          <source src="https://blkoutuk.com/videos/onboarding/Ask%20Ivor%20%E2%80%91%20Made%20with%20FlexClip.mp4" type="video/mp4">
          Your browser doesn't support video — <a href="https://blkoutuk.com/intro" rel="noopener">meet AIvor at blkoutuk.com/intro</a>.
        </video>
        <p class="aivor-more"><a href="https://blkoutuk.com/intro" rel="noopener">Prefer to meet him first? The full introduction</a></p>
      </div>
    </div>
  </section>`;

  const workN = ++n;
  const workWithUs = `  <section class="plate invert" id="working-with-us">
    <div class="plate-head reveal">
      <span class="numeral">(##)</span>
      <span class="kicker">For professionals</span>
    </div>
    <h2 class="display reveal">If you work here</h2>
    <div class="plate-body reveal">
      <p>This page is for Black queer men first. But if you serve this borough — NHS, social prescribing, council, community sector, creative health, or you run a room — there's a door for you too.</p>
      <ul class="reasons">
        <li><strong>Refer.</strong> Supporting a Black queer man who could use his people? Send him this page — that is a referral, and every knock gets answered by a human.</li>
        <li><strong>Commission or partner.</strong> Working on Black queer men's health, culture or connection in ${esc(boroughWord)}? We're the community-owned, by-and-for partner — and the evidence base is already on this page. Write to <a href="mailto:rob@blkoutuk.com">rob@blkoutuk.com</a>.</li>
        <li><strong>List us.</strong> Maintain a directory, a support page, a signposting service? Our entry, ready to paste:
          <code class="listing">BLKOUT — the UK's community-owned co-operative for Black queer men. In your neighbourhood: ${esc(d.canonicalUrl)} · blkoutuk.com · rob@blkoutuk.com</code>
        </li>
        <li><strong>Run a room.</strong> A venue, night or group our men should know about? <a href="#s-truer">Tell us</a> — the page gets truer, and it points at you.</li>
      </ul>
      <p class="closing-note">We list our neighbours and our neighbours list us. That's how a borough works.</p>
    </div>
  </section>`;

  const truer = d.truer
    ? `  <section class="plate truer" id="s-truer">
    <div class="plate-head">
      <span class="numeral">(##)</span>
      <span class="kicker">Corrections</span>
    </div>
    <h2 class="display">${esc(d.truer.heading)}</h2>
    <p>${esc(d.truer.intro)}</p>
    <form id="truer-form" novalidate>
      <label class="field-l" for="t-note">What should we know?</label>
      <textarea id="t-note" rows="4" placeholder="${esc(d.truer.placeholder)}" required></textarea>
      <label class="field-l" for="t-name">Your name</label>
      <input id="t-name" type="text" autocomplete="name">
      <label class="field-l" for="t-email">Your email</label>
      <input id="t-email" type="email" autocomplete="email">
      <button class="submit" type="submit">Send it</button>
      <p class="msg" id="truer-msg"></p>
    </form>
  </section>`
    : '';

  const gallery = d.gallery?.images?.length
    ? plate(++n, 'On this ground', d.gallery.heading,
        `<p>${esc(d.gallery.intro ?? '')}</p>
      <div class="gallery">
${d.gallery.images.map((g) => `        <figure><img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy"><figcaption>${esc(g.caption ?? '')}</figcaption></figure>`).join('\n')}
      </div>`)
    : '';

  const assembled = [sections[0], ...rings, gallery, nextDoor, silence, rollcall, quiz, biblio, faq, door, hub, truer, workWithUs]
    .filter(Boolean)
    .join('\n\n');
  // Numerals are stamped here, in document order — never at construction time.
  let seq = 0;
  const body = assembled.replace(/\(##\)/g, () => `(${num(++seq)})`);

  // index/nav — composition scale, jumps. Derek Aidoo's note, answered.
  const indexItems = [
    ['the-record', 'The record'],
    ...(hereSplit.kept.length || d.here?.quietNote ? [['in-the-borough', 'In the borough']] : []),
    ['the-count', 'The count'],
    ['s-door', 'The door'],
    ['join', 'BLKOUTHUB'],
    ['working-with-us', 'If you work here'],
  ];

  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)}</title>
<meta name="description" content="${esc(d.metaDescription)}">
<link rel="canonical" href="${esc(d.canonicalUrl)}">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    ...(d.faq?.length
      ? [{ '@type': 'FAQPage', mainEntity: d.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }]
      : []),
    { '@type': 'Organization', '@id': 'https://blkoutuk.com/#org', name: 'BLKOUT UK', url: 'https://blkoutuk.com',
      description: 'Community-owned co-operative (Community Benefit Society) for Black queer men in the UK.',
      sameAs: ['https://events.blkoutuk.com', 'https://blkouthub.com'] },
    { '@type': 'WebPage', '@id': d.canonicalUrl, url: d.canonicalUrl, name: d.title,
      description: d.metaDescription, about: { '@id': 'https://blkoutuk.com/#org' },
      dateModified: new Date().toISOString().slice(0, 10) },
  ],
})}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,400;0,500;0,600;0,800;0,900;1,400&family=Fraunces:ital,wght@1,400;1,600;1,700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#ffffff; --bg:#000000; --gold:#FFD700; --gold-deep:#D4AF37;
    --dim:#b9b4a8; --line:#2a2721; --shell:#0b0b0b; --bone:#f4f1ea;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    background:var(--bg); color:var(--ink);
    font-family:'Work Sans',system-ui,-apple-system,sans-serif;
    font-size:17px; line-height:1.62; -webkit-font-smoothing:antialiased;
    overflow-x:hidden; overflow-x:clip;
  }
  a{color:var(--gold); text-decoration:none; border-bottom:1px solid rgba(255,215,0,.35)}
  a:hover{color:#fff; border-bottom-color:#fff}

  /* animated film grain — Sound Ethics' signature texture, brand palette */
  .grain{position:fixed; inset:0; pointer-events:none; z-index:90; opacity:.05;
    background-image:radial-gradient(circle at 1px 1px, #fff 1px, transparent 0);
    background-size:3px 3px; animation:grain .6s steps(3) infinite}
  @keyframes grain{
    0%,100%{transform:translate(0,0)} 33%{transform:translate(-1px,1px)} 66%{transform:translate(1px,-1px)}
  }

  .wrap{max-width:1180px; margin:0 auto; padding:0 5vw}

  /* ---- HERO: type as architecture ---- */
  header.hero{padding:7rem 0 3.5rem; border-bottom:1px solid var(--line)}
  .eyebrow{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    letter-spacing:.16em; font-size:.9rem; color:var(--gold); margin:0 0 1rem}
  h1.mega{
    font-family:'Work Sans',system-ui,sans-serif; font-weight:900;
    text-transform:uppercase; letter-spacing:-.025em; line-height:.9;
    font-size:5.5rem; font-size:clamp(2.6rem,10vw,7.5rem); margin:0; color:var(--ink);
  }
  h1.mega .of{display:block; font-size:.24em; letter-spacing:.06em; color:var(--gold); line-height:1.1; margin-bottom:.4em}
  .standfirst{font-family:'Fraunces',Georgia,serif; font-style:italic;
    font-size:1.2rem; font-size:clamp(1.05rem,1.7vw,1.35rem); color:var(--dim); max-width:56ch; margin:7.5rem 0 0}
  /* minimal media: the one drawing this grammar allows, and it stays subordinate to type */
  header.hero{position:relative; overflow:hidden; min-height:44rem}
  /* Scrim between the palace and the type: same z-index as the image but later in
     paint order, so it darkens the drawing without touching the copy above it. */
  header.hero::after{content:''; position:absolute; left:0; top:0; right:0; bottom:0;
    z-index:0; pointer-events:none;
    background-image:linear-gradient(90deg, rgba(0,0,0,.94) 0%, rgba(0,0,0,.86) 34%, rgba(0,0,0,.45) 62%, rgba(0,0,0,0) 88%)}
  .hero-row{}
  .hero-type{position:relative; z-index:1; max-width:56%}
  img.landmark{position:absolute; right:-4%; bottom:-3%; width:42rem; height:52.1rem;
    max-width:none; object-fit:contain; opacity:.95; z-index:0; pointer-events:none}
  .standfirst{position:relative; z-index:1}
  @media (max-width:760px){
    .hero-type{max-width:100%}
    img.landmark{width:19rem; height:23.6rem; opacity:.45; right:-12%; bottom:0}
  }

  /* ---- INDEX: nav at composition scale, and it jumps ---- */
  nav.index{display:flex; flex-wrap:wrap; padding:1.6rem 0; border-bottom:1px solid var(--line)}
  nav.index a{margin:0 2rem .4rem 0; font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    font-size:1.05rem; font-size:clamp(.95rem,1.5vw,1.15rem); font-weight:600; letter-spacing:.01em; border:0; color:var(--dim)}
  nav.index a:hover{color:var(--gold)}

  /* ---- PLATES ---- */
  .plate{padding:5.5rem 0; border-bottom:1px solid var(--line)}
  .plate-head{display:flex; align-items:baseline; gap:1rem; margin-bottom:.8rem}
  .numeral{font-family:'Work Sans',system-ui,sans-serif; color:var(--gold); font-size:1.1rem; letter-spacing:.08em}
  .kicker{text-transform:uppercase; letter-spacing:.18em; font-size:.72rem; color:var(--dim)}
  h2.display{
    font-family:'Work Sans',system-ui,sans-serif; font-weight:900; text-transform:uppercase;
    letter-spacing:-.02em; line-height:1.0; font-size:2.6rem; font-size:clamp(1.8rem,4.6vw,3.3rem); margin:0 0 1.6rem; color:var(--ink);
  }
  .plate-body{max-width:66ch}
  .plate p{margin:0 0 1.1rem; color:var(--dim); max-width:66ch}
  .plate-body > p:first-child{color:var(--ink); font-family:'Fraunces',Georgia,serif; font-style:italic; font-size:1.2rem}
  .aside{border-left:3px solid var(--gold); padding-left:1.2rem}
  .quiet{border:1px solid var(--line); padding:1.2rem 1.4rem; color:var(--dim)}

  ul.ring{list-style:none; padding:0; margin:1.1rem 0 0; display:flex; flex-direction:column}
  ul.ring li{border-top:1px solid var(--line); padding:1.4rem 0}
  .ring-name{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    font-size:1.3rem; font-size:clamp(1.1rem,1.9vw,1.4rem); font-weight:700; border:0; display:inline-block}
  ul.ring p{margin:.4rem 0 .5rem}
  .stamp{text-transform:uppercase; letter-spacing:.14em; font-size:.65rem; color:var(--gold-deep)}


  /* Inverted plates mark progress through the page — and, for "If you work here",
     signal a different reader. Tokens flip; gold stays gold. */
  .plate.invert{background:var(--bone); color:#111; margin-left:-50vw; margin-right:-50vw; padding-left:50vw; padding-right:50vw}
  .plate.invert h2.display,.plate.invert .plate-body > p:first-child{color:#111}
  .plate.invert p,.plate.invert li{color:#3a352c}
  .plate.invert .kicker{color:#6b6355}
  .plate.invert .numeral{color:#8a6d00}
  .plate.invert .ring-name{color:#111; border-bottom-color:rgba(0,0,0,.3)}
  .plate.invert .ring-name:hover{color:#8a6d00}
  .plate.invert ul.ring li{border-top-color:rgba(0,0,0,.14)}
  .plate.invert .stamp{color:#8a6d00}
  .plate.invert a{color:#8a6d00; border-bottom-color:rgba(138,109,0,.4)}
  .plate.invert a:hover{color:#111}
  .plate.invert .aside{border-left-color:#8a6d00}
  .plate.invert .reasons li strong{color:#111}
  .plate.gold{background:var(--gold); color:#000; margin-left:-50vw; margin-right:-50vw; padding-left:50vw; padding-right:50vw}
  .plate.gold h2.display,.plate.gold p,.plate.gold li,.plate.gold .kicker{color:#000}
  .plate.gold .numeral{color:#000}
  .plate.gold a{color:#000; border-bottom-color:rgba(0,0,0,.4)}
  .plate.gold .q-options button{border-color:rgba(0,0,0,.25); color:#000}
  .plate.gold .q-options button.right{background:rgba(0,0,0,.12); border-color:#000}
  .plate.gold .q-reveal{border-left-color:#000}
  .plate.gold .q-score{color:#000}
  .plate.gold .q-n{color:#000}


  /* Flat planes get a wash and a splash so the colour has weather in it.
     Layered background-image over background-color: an engine that ignores
     gradients or SVG still gets the flat brand colour, never a broken surface. */
  .plate.gold{
    background-color:var(--gold);
    background-image:
      radial-gradient(70% 55% at 14% 6%, #FFF0A6 0%, rgba(255,240,166,0) 62%),
      linear-gradient(146deg, #FFE45C 0%, #FFD700 40%, #F0BC06 74%, #D9A303 100%);
  }
  .plate.invert{
    background-color:var(--bone);
    background-image:
      radial-gradient(66% 52% at 86% 8%, #FFFCF4 0%, rgba(255,252,244,0) 60%),
      linear-gradient(146deg, #FBF8F0 0%, #F4F1EA 38%, #E7E0CE 76%, #DAD0B6 100%);
  }
  /* .q-q, .tender and .q-reveal carry !important for the dark ground, so an
     inverted plate must out-shout them or the type goes white-on-gold / white-on-cream.
     This block was lost once in a CSS rewrite — keep it adjacent to the invert rules. */
  .plate.gold .q-q,.plate.gold .tender,.plate.gold .q-reveal,
  .plate.gold .q-score,.plate.gold .q-n{color:#000 !important}
  .plate.invert .q-q,.plate.invert .tender,.plate.invert .q-reveal{color:#111 !important}
  .plate.invert .guess-result,.plate.gold .guess-result{color:#111 !important}
  /* Blurred hard, so it reads as weather in the colour rather than a shape
     sitting on top of it. Sized and pushed off-edge so only part of it lands. */
  /* NOTE: .plate.gold > * is two classes, so it outranks a bare element+class
     selector and was forcing the splash back into normal flow, pushing every
     section down by its own height. Match the parent to win on specificity.
     The svg is wrapped in a div because old engines do not position inline svg. */
  .plate{position:relative}

  /* Photographic ground + scrim. Higher specificity than .plate > * so these are
     not dragged back into normal flow. Scrim is left-heavy because the type
     column sits left; the picture stays readable on the right. */
  .plate.has-bg{position:relative}
  .plate > div.ground{position:absolute; left:0; right:0; top:0; bottom:0; z-index:0;
    background-size:cover; background-repeat:no-repeat; opacity:.30; pointer-events:none}
  .plate > div.scrim{position:absolute; left:0; right:0; top:0; bottom:0; z-index:0;
    pointer-events:none;
    background-image:linear-gradient(90deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,.78) 42%, rgba(0,0,0,.30) 78%, rgba(0,0,0,.12) 100%)}
  @media (max-width:760px){
    .plate > div.ground{opacity:.20}
    .plate > div.scrim{background-image:linear-gradient(180deg, rgba(0,0,0,.80) 0%, rgba(0,0,0,.88) 60%)}
  }

  .plate > *{position:relative; z-index:1}


  /* ---- STICK ----
     Each section's display heading holds at the top of the viewport while its
     body scrolls under it, so a section grips instead of flowing past. Needs a
     higher-specificity selector than .plate > *, and needs the section NOT to
     clip its overflow — overflow:hidden kills position:sticky in a descendant. */
  /* Sticky headings only on the DARK plates. A pinned heading needs a background
     so body copy does not scroll through it — and on a gradient ground any such
     background reads as a mismatched rectangle, whatever colour you pick. On black
     it fades to transparent invisibly. The colour plates are short, self-contained
     blocks; they do not need the grip. */
  .plate:not(.gold):not(.invert):not(.has-bg) > h2.display{
    position:sticky; position:-webkit-sticky; top:.5rem; z-index:2;
    background-image:linear-gradient(180deg, rgba(0,0,0,.92) 62%, rgba(0,0,0,0) 100%);
    padding-top:.6rem; padding-bottom:1rem}
  .plate:not(.gold):not(.invert):not(.has-bg) > div.plate-head{
    position:sticky; position:-webkit-sticky; top:0; z-index:3;
    background-color:rgba(0,0,0,.92)}

  /* the photographic grounds sit still while the page moves over them */
  .plate > div.ground{background-attachment:fixed}
  @media (max-width:760px){
    /* fixed attachment is unreliable on mobile engines; fall back to normal */
    .plate > div.ground{background-attachment:scroll}
    .plate:not(.gold):not(.invert):not(.has-bg) > h2.display,
    .plate:not(.gold):not(.invert):not(.has-bg) > div.plate-head{position:static}
  }

  /* ---- SILENCE before the peak ---- */
  .silence{height:14rem}

  /* ---- THE COUNT NOBODY KEEPS: census scale, not a tally of us ---- */
  .rollcall{border-bottom:1px solid var(--line)}
  .rollcall h2.display{color:var(--gold); font-size:6rem; font-size:clamp(3rem,11vw,8rem)}
  .rollcall-lede{max-width:60ch}
  .field{display:flex; flex-wrap:wrap; margin:2.2rem 0; max-width:100%}
  .mark{display:block; width:7px; height:7px; margin:0 3px 3px 0; background:#1e1c18; border-radius:50%}
  .mark.guessed{background:var(--gold-deep); opacity:.85}
  .rollcall-cut{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    font-size:1.25rem; font-size:clamp(1.05rem,1.9vw,1.4rem); color:var(--ink); letter-spacing:.01em; line-height:1.1; margin:.4rem 0}
  .rollcall-cut strong{color:var(--gold)}
  .rollcall-cut.dim{color:var(--dim)}

  /* ---- quiz ---- */
  .q{border-top:1px solid var(--line); padding:1.6rem 0}
  .q-q{color:var(--ink) !important; font-weight:600}
  .q-n{color:var(--gold); font-family:'Work Sans',system-ui,sans-serif; margin-right:.5rem}
  .q-options{display:flex; flex-direction:column; gap:.5rem; margin:.8rem 0}
  .q-options button{background:transparent; border:1px solid var(--line); color:var(--ink);
    font:inherit; text-align:left; padding:.7rem 1rem; cursor:pointer}
  .q-options button:hover{border-color:var(--gold)}
  .q-options button.right{border-color:var(--gold); background:rgba(255,215,0,.1)}
  .q-options button.wrong{opacity:.45}
  .q-reveal{display:none; border-left:3px solid var(--gold); padding-left:1.2rem}
  .q.done .q-reveal{display:block}
  .q-score{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    font-size:1.4rem; color:var(--gold)}

  ul.biblio{list-style:none; padding:0}
  ul.biblio li{color:var(--dim); margin-bottom:.9rem; padding-left:1.2rem; text-indent:-1.2rem}
  ul.biblio li::before{content:'— '; color:var(--gold)}
  ul.biblio em{color:var(--ink); font-family:'Fraunces',Georgia,serif}
  .archive{border:2px solid var(--gold); padding:1.4rem; margin-top:2rem}
  .archive h3{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    letter-spacing:.12em; color:var(--gold); margin:0 0 .5rem; font-size:1rem}
  .ghost{display:inline-block; border:1px solid var(--gold); padding:.5rem 1.2rem; margin-top:.6rem}

  details.faq{border-top:1px solid var(--line); padding:.9rem 0}
  details.faq summary{cursor:pointer; font-weight:600; list-style:none}
  details.faq summary::-webkit-details-marker{display:none}
  details.faq summary::before{content:'▸ '; color:var(--gold)}
  details.faq[open] summary::before{content:'▾ '}

  /* ---- forms ---- */
  form{margin-top:1.4rem; max-width:44rem}
  .option{display:flex; align-items:flex-start; border:1px solid var(--line); padding:.9rem 1.1rem; margin-bottom:.55rem; cursor:pointer}
  .option:hover{border-color:var(--gold)}
  .option input{flex:none; margin:.25rem .8rem 0 0}
  .opt-text{display:block}
  .opt-text strong{display:block; text-transform:uppercase; letter-spacing:.05em; font-size:.9rem}
  .opt-text span{color:var(--dim); font-size:.92rem}
  input[type=radio],input[type=checkbox]{-webkit-appearance:none; appearance:none; width:17px; height:17px;
    border:2px solid var(--dim); background:transparent; cursor:pointer}
  input[type=radio]{border-radius:50%}
  input[type=radio]:checked{border-color:var(--gold); background:var(--gold); box-shadow:inset 0 0 0 3px #000}
  input[type=checkbox]:checked{border-color:var(--gold); background:var(--gold)}
  .field-l{display:block; margin:1.1rem 0 .35rem; text-transform:uppercase; letter-spacing:.1em; font-size:.7rem; color:var(--dim)}
  input[type=text],input[type=email],textarea{width:100%; padding:.75rem .9rem; background:var(--shell);
    border:1px solid var(--line); color:var(--ink); font:inherit}
  input:focus,textarea:focus{outline:2px solid var(--gold)}
  .holder{display:block; margin:1.1rem 0; color:var(--dim); font-size:.93rem; cursor:pointer}
  button.submit{background:var(--gold); color:#000; border:0; padding:.85rem 2.2rem;
    font-family:'Work Sans',system-ui,sans-serif; font-size:1.25rem; text-transform:uppercase;
    letter-spacing:.06em; font-weight:900; cursor:pointer}
  button.submit:hover{background:#fff}
  button.submit:disabled{opacity:.5; cursor:wait}
  .msg{display:none; margin-top:1rem; padding:.9rem 1.1rem}
  .msg.ok{display:block; border-left:4px solid var(--gold); color:var(--ink)}
  .msg.err{display:block; border:1px solid #7a2b2b; color:#f0b9b9}
  .tender{font-family:'Fraunces',Georgia,serif; font-style:italic; font-size:1.25rem; color:var(--ink) !important}


  ul.reasons{list-style:none; padding:0; margin:1.4rem 0}
  ul.reasons li{border-top:1px solid var(--line); padding:.9rem 0; color:var(--dim)}
  ul.reasons li strong{color:var(--ink); display:block}
  .pills{display:flex; flex-wrap:wrap; margin-top:1rem}
  .pill{display:inline-block; margin:0 .5rem .5rem 0; border:1px solid var(--line); padding:.45rem 1rem; font-size:.9rem; color:var(--dim)}
  a.pill:hover{border-color:var(--gold); color:var(--gold)}
  .pill.closed{opacity:.55}
  .aivor{border-top:1px solid var(--line); margin-top:1.6rem; padding-top:1.4rem}
  .aivor video{width:100%; max-width:34rem; height:auto; display:block; margin:1.2rem 0; background:#000}
  .aivor-more{font-size:.9rem}
  nav.index a.home{color:var(--gold); border-bottom:1px solid rgba(255,215,0,.4)}

  .guess{border:1px solid var(--line); padding:1.5rem; margin-bottom:2rem; max-width:38rem}
  .guess-q{display:block; font-family:'Fraunces',Georgia,serif; font-style:italic;
    font-size:1.2rem; color:var(--ink); margin-bottom:1.2rem}

  .guess input[type=range]{-webkit-appearance:none; appearance:none; accent-color:var(--gold);
    width:100%; height:4px; background:#3a352b; border-radius:2px; outline:none; margin:1rem 0}
  .guess input[type=range]::-webkit-slider-thumb{-webkit-appearance:none; appearance:none;
    width:22px; height:22px; border-radius:50%; background:var(--gold); border:0; cursor:pointer}
  .guess input[type=range]::-moz-range-thumb{width:22px; height:22px; border-radius:50%;
    background:var(--gold); border:0; cursor:pointer}
  .guess input[type=range]::-moz-range-track{height:4px; background:#3a352b; border-radius:2px}

  .guess-read{margin:.2rem 0 1rem !important}
  .guess-read output{font-family:'Work Sans',system-ui,sans-serif; font-weight:900;
    font-size:2.4rem; color:var(--gold); letter-spacing:-.02em}
  .guess-note{font-size:.85rem; margin-top:1rem !important}
  .guess-result{border-left:3px solid var(--gold); padding-left:1.2rem;
    font-family:'Work Sans',system-ui,sans-serif; font-weight:600;
    font-size:1.1rem; color:var(--ink) !important; margin-bottom:1.6rem !important}
  #count-figure.masked{color:var(--dim)}

  /* Dots arrive rather than appear — the fill is the animation. */
  .mark{opacity:0; animation:dotin .5s ease forwards}
  @keyframes dotin{from{opacity:0; transform:scale(.4)} to{opacity:1; transform:scale(1)}}
  #count-figure{transition:color .4s ease}
  @media (prefers-reduced-motion:reduce){
    .mark{opacity:1; animation:none}
  }



  .directory{border-top:1px solid var(--line); margin-top:1.8rem; padding-top:1.2rem}
  .directory h3{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    letter-spacing:.14em; font-size:.72rem; color:var(--gold); margin:0 0 .8rem}
  .directory ul{list-style:none; padding:0; margin:0}
  .directory li{color:var(--dim); padding:.4rem 0; font-size:.95rem}
  .directory li strong{color:var(--ink)}
  .directory-note{font-size:.85rem; margin-top:.8rem !important}

  /* The restored sections arrive a piece at a time rather than all at once:
     the census table builds row by row, and the borough's own row lights after
     it lands — you appear inside the table you are being shown. */
  .reveal.armed .gallery figure,
  .reveal.armed .recently li,
  .reveal.armed .directory li{opacity:0; transform:translateY(.6rem)}
  .reveal.armed.in .gallery figure,
  .reveal.armed.in .recently li,
  .reveal.armed.in .directory li{opacity:1; transform:none;
    transition:opacity .55s ease, transform .55s ease}
  .reveal.armed.in .gallery figure:nth-child(1){transition-delay:0.07s}
  .reveal.armed.in .gallery figure:nth-child(2){transition-delay:0.14s}
  .reveal.armed.in .gallery figure:nth-child(3){transition-delay:0.21s}
  .reveal.armed.in .gallery figure:nth-child(4){transition-delay:0.28s}
  .reveal.armed.in .gallery figure:nth-child(5){transition-delay:0.35s}
  .reveal.armed.in .gallery figure:nth-child(6){transition-delay:0.42s}
  .reveal.armed.in .gallery figure:nth-child(7){transition-delay:0.49s}
  .reveal.armed.in .gallery figure:nth-child(8){transition-delay:0.56s}
  .reveal.armed.in .recently li:nth-child(1),
  .reveal.armed.in .directory li:nth-child(1){transition-delay:0.05s}
  .reveal.armed.in .recently li:nth-child(2),
  .reveal.armed.in .directory li:nth-child(2){transition-delay:0.10s}
  .reveal.armed.in .recently li:nth-child(3),
  .reveal.armed.in .directory li:nth-child(3){transition-delay:0.15s}
  .reveal.armed.in .recently li:nth-child(4),
  .reveal.armed.in .directory li:nth-child(4){transition-delay:0.20s}
  .reveal.armed.in .recently li:nth-child(5),
  .reveal.armed.in .directory li:nth-child(5){transition-delay:0.25s}
  .reveal.armed.in .recently li:nth-child(6),
  .reveal.armed.in .directory li:nth-child(6){transition-delay:0.30s}
  .reveal.armed.in .recently li:nth-child(7),
  .reveal.armed.in .directory li:nth-child(7){transition-delay:0.35s}
  .reveal.armed.in .recently li:nth-child(8),
  .reveal.armed.in .directory li:nth-child(8){transition-delay:0.40s}
  @media (prefers-reduced-motion:reduce){
      .reveal.armed .gallery figure,
    .reveal.armed .recently li,
    .reveal.armed .directory li{opacity:1; transform:none; transition:none}
  }

  /* Next door: the pills arrive one at a time — doors that exist land and take
     the gold, doors that do not stay dark. The section is about opening them
     borough by borough, so it is the one that should move. */
  .reveal.armed .pills > *{opacity:0; transform:translateY(.5rem) scale(.97)}
  .reveal.armed.in .pills > *{opacity:1; transform:none;
    transition:opacity .5s ease, transform .5s ease, border-color .5s ease, color .5s ease}
  .reveal.armed.in .pills > *:nth-child(1){transition-delay:0.10s}
  .reveal.armed.in .pills > *:nth-child(2){transition-delay:0.20s}
  .reveal.armed.in .pills > *:nth-child(3){transition-delay:0.30s}
  .reveal.armed.in .pills > *:nth-child(4){transition-delay:0.40s}
  .reveal.armed.in .pills > *:nth-child(5){transition-delay:0.50s}
  .reveal.armed.in .pills > *:nth-child(6){transition-delay:0.60s}
  .reveal.armed.in .pills > *:nth-child(7){transition-delay:0.70s}
  .reveal.armed.in .pills > *:nth-child(8){transition-delay:0.80s}
  .reveal.armed.in .pill.open{animation:dooropen 1.1s ease both}
  .reveal.armed.in .pill.open:nth-child(1){animation-delay:0.40s}
  .reveal.armed.in .pill.open:nth-child(2){animation-delay:0.50s}
  .reveal.armed.in .pill.open:nth-child(3){animation-delay:0.60s}
  .reveal.armed.in .pill.open:nth-child(4){animation-delay:0.70s}
  .reveal.armed.in .pill.open:nth-child(5){animation-delay:0.80s}
  .reveal.armed.in .pill.open:nth-child(6){animation-delay:0.90s}
  .reveal.armed.in .pill.open:nth-child(7){animation-delay:1.00s}
  .reveal.armed.in .pill.open:nth-child(8){animation-delay:1.10s}
  @keyframes dooropen{
    0%{border-color:var(--line); color:var(--dim)}
    45%{border-color:var(--gold); color:var(--gold); box-shadow:0 0 12px rgba(255,215,0,.35)}
    100%{border-color:var(--gold); color:var(--gold); box-shadow:0 0 0 rgba(255,215,0,0)}
  }
  @media (prefers-reduced-motion:reduce){
    .reveal.armed .pills > *{opacity:1; transform:none; transition:none}
    .reveal.armed.in .pill.open{animation:none; border-color:var(--gold); color:var(--gold)}
  }
  .census-source{font-size:.82rem; margin-top:-1rem !important}
  code.listing{display:block; margin:.6rem 0 0; padding:.7rem .9rem; background:var(--shell);
    border:1px solid var(--line); color:var(--ink); font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:.82rem; white-space:pre-wrap; word-break:break-word}
  .plate.invert code.listing{background:rgba(0,0,0,.05); border-color:rgba(0,0,0,.15); color:#111}
  .closing-note{font-size:.9rem; margin-top:1.2rem !important}
  .calendar-card{border:1px solid var(--line); padding:1.1rem 1.3rem; margin-top:1.6rem}
  .calendar-card h3{margin:0 0 .4rem; font-size:1.05rem}
  .calendar-card p{margin:0; font-size:.92rem}
  .recently{border-top:1px solid var(--line); margin-top:1.8rem; padding-top:1.2rem}
  .recently h3{font-family:'Work Sans',system-ui,sans-serif; text-transform:uppercase;
    letter-spacing:.14em; font-size:.72rem; color:var(--gold); margin:0 0 .8rem}
  .recently ul{list-style:none; padding:0; margin:0}
  .recently li{color:var(--dim); padding:.35rem 0; font-size:.95rem}
  .recently .when{color:var(--gold-deep); text-transform:uppercase; letter-spacing:.08em; font-size:.72rem; margin-right:.6rem}
  .recently-note{font-size:.88rem; margin-top:.8rem !important}
  .table-wrap{overflow-x:auto; margin:1.8rem 0}
  table.census{border-collapse:collapse; width:100%; min-width:30rem; font-size:.92rem}
  table.census caption{text-align:left; color:var(--dim); font-size:.82rem; padding-bottom:.7rem}
  table.census th{text-align:left; text-transform:uppercase; letter-spacing:.1em; font-size:.68rem; color:var(--dim); border-bottom:1px solid var(--line); padding:.5rem .8rem .5rem 0}
  table.census td{color:var(--dim); border-bottom:1px solid var(--line); padding:.5rem .8rem .5rem 0}
  table.census tr.self td{color:var(--gold); font-weight:600; background:rgba(255,215,0,.07)}
  .gallery{display:flex; flex-wrap:wrap; margin-top:1.4rem}
  .gallery figure{margin:0 1rem 1rem 0; flex:1 1 15rem; max-width:20rem}
  .gallery img{width:100%; height:auto; display:block; border:1px solid var(--line)}
  .gallery figcaption{color:var(--dim); font-size:.85rem; padding-top:.5rem}
  .rollcall-note{max-width:58ch}
  .rollcall .field{max-height:none}

  footer{padding:4.5rem 0 7rem; color:var(--dim)}
  footer .line{max-width:60ch}
  footer nav{display:flex; flex-wrap:wrap; gap:1.4rem; margin:1.5rem 0}
  .checked{font-size:.8rem; text-transform:uppercase; letter-spacing:.1em}
  .neighbours{display:flex; flex-wrap:wrap; gap:.5rem; margin-top:1.5rem}
  .neighbours a,.neighbours span{border:1px solid var(--line); padding:.35rem .9rem; font-size:.85rem; color:var(--dim)}

  /* Reveals are armed BY JS, per element, only after the observer is live.
     Nothing is hidden by CSS alone — if the script throws, or the engine lacks
     IntersectionObserver, every .reveal simply stays visible. Hiding content
     that needs working JS to come back is how a page silently ships blank. */
  .reveal.armed{opacity:0; filter:blur(6px); transform:translateY(1.4rem)}
  .reveal.armed.in{opacity:1; filter:blur(0); transform:none;
    transition:opacity .7s ease, filter .7s ease, transform .7s ease}
  @media (prefers-reduced-motion:reduce){
    .reveal.armed{opacity:1; filter:none; transform:none}
    .grain{animation:none}
  }
</style>
</head>
<body>
<div class="grain"></div>
<div class="wrap">

<header class="hero">
  <div class="hero-row">
    <div class="hero-type">
      <p class="eyebrow">${esc(d.hero.kicker)}</p>
      <h1 class="mega"><span class="of">BLKOUT in</span>${esc(boroughWord)}</h1>
    </div>
${
  d.landmark
    ? `    <img class="landmark" src="${esc(d.landmark.src)}" alt="${esc(d.landmark.alt)}" width="760" height="943">`
    : ''
}
  </div>
  <p class="standfirst">${esc(d.hero.standfirst)}</p>
</header>

<nav class="index">
${indexItems.map(([id, label]) => `  <a href="#${id}">${esc(label)}</a>`).join('\n')}
  <a class="home" href="https://blkoutuk.com" rel="noopener">BLKOUT home &rarr;</a>
</nav>

<main>
${body}
</main>

<footer>
  <p class="line">${esc(d.footer.line)}</p>
  <nav>${d.footer.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' ')}</nav>
${
  d.neighbours?.length
    ? `  <div class="neighbours">${d.neighbours
        .map((nb) =>
          existingSlugs.has(nb.slug)
            ? `<a href="../${esc(nb.slug)}/">${esc(nb.name)}</a>`
            : `<span>${esc(nb.name)}</span>`
        )
        .join('')}</div>`
    : ''
}
  <p class="checked">Listings checked ${esc(d.lastChecked)}. When it's quiet, we say so — nothing here is padded.</p>
</footer>

</div>
<script>
(function () {
  var SB_URL = ${JSON.stringify(d.supabase.url)};
  var SB_KEY = ${JSON.stringify(d.supabase.anonKey)};

  // ---- THE COUNT NOBODY KEEPS ----
  // Draws the census estimate as dots, and offers a guess first. Reads no data about
  // real people and writes none: the total comes from _census.json and the guess never
  // leaves the browser. Enhancement only — with JS off, the figure and the whole
  // argument are already in the HTML and simply stay visible.
  var fieldEl = document.getElementById('rollfield');
  var total = fieldEl ? parseInt(fieldEl.getAttribute('data-total'), 10) || 0 : 0;

  var raf = window.requestAnimationFrame
    ? function (f) { window.requestAnimationFrame(f); }
    : function (f) { setTimeout(f, 16); };

  // The field FILLS rather than appearing — the accumulation is the point.
  function paintDots(upTo, cls, done) {
    if (!fieldEl || upTo <= 0) { if (done) done(); return; }
    var placed = 0;
    var batch = Math.max(6, Math.round(upTo / 55));
    function step() {
      var frag = document.createDocumentFragment();
      var end = Math.min(upTo, placed + batch);
      for (; placed < end; placed++) {
        var sp = document.createElement('span');
        sp.className = cls;
        frag.appendChild(sp);
      }
      fieldEl.appendChild(frag);
      if (placed < upTo) raf(step);
      else if (done) done();
    }
    step();
  }

  function countUp(el, to, ms) {
    var t0 = null;
    function frame() {
      if (t0 === null) t0 = Date.now();
      var t = Math.min(1, (Date.now() - t0) / ms);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = group(Math.round(to * eased));
      if (t < 1) raf(frame);
    }
    raf(frame);
  }

  var figure = document.getElementById('count-figure');
  var guessBox = document.getElementById('guess');
  var slider = document.getElementById('guess-input');
  var out = document.getElementById('guess-out');
  var go = document.getElementById('guess-go');
  var result = document.getElementById('guess-result');

  function group(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  if (fieldEl && figure && guessBox && slider && out && go && result) {
    // arm the guess: mask the answer, reveal the question
    figure.textContent = '?';
    figure.className += ' masked';
    // the lede states the range, so it would give the answer away before the guess
    var lede = document.getElementById('count-lede');
    if (lede) lede.hidden = true;
    guessBox.hidden = false;
    out.textContent = group(slider.value);
    slider.addEventListener('input', function () { out.textContent = group(slider.value); });

    go.addEventListener('click', function () {
      var guessed = parseInt(slider.value, 10) || 0;
      guessBox.hidden = true;
      figure.className = figure.className.replace(' masked', '');
      countUp(figure, total, 1100);
      if (lede) lede.hidden = false;
      var mine = Math.min(guessed, total);
      paintDots(mine, 'mark guessed', function () {
        paintDots(Math.max(0, total - guessed), 'mark');
      });
      var diff = total - guessed;
      result.textContent =
        diff > 0
          ? 'You guessed ' + group(guessed) + '. The estimate is up to ' + group(total) +
            ' — ' + group(diff) + ' more of us than you pictured.'
          : diff < 0
            ? 'You guessed ' + group(guessed) + '. The estimate is up to ' + group(total) +
              '. Higher than most people manage — and still nobody counts it.'
            : 'You guessed ' + group(guessed) + '. That is the estimate exactly.';
      result.hidden = false;
    });
  } else {
    paintDots(total, 'mark');
  }

  // ---- reveals ----
  // Plain index loops throughout: NodeList.prototype.forEach does not exist in
  // older engines, and a throw here used to leave every plate body hidden.
  try {
    if ('IntersectionObserver' in window) {
      var rev = document.querySelectorAll('.reveal');
      var io = new IntersectionObserver(function (es) {
        for (var k = 0; k < es.length; k++) {
          if (es[k].isIntersecting) { es[k].target.className += ' in'; io.unobserve(es[k].target); }
        }
      }, { rootMargin: '0px 0px -12% 0px' });
      for (var r = 0; r < rev.length; r++) { rev[r].className += ' armed'; io.observe(rev[r]); }
      setTimeout(function () {
        for (var q = 0; q < rev.length; q++) { rev[q].className += ' in'; }
      }, 3000);
    }
  } catch (err) { /* nothing was armed, so everything stays visible */ }

  function submitRow(row, form, msg, texts, hideOnSuccess, onOk) {
    var btn = form.querySelector('button.submit');
    btn.disabled = true; msg.className = 'msg';
    fetch(SB_URL + '/rest/v1/event_interest', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    }).then(function (r) {
      if (r.ok) {
        if (hideOnSuccess) {
          form.querySelectorAll('.option, .field-l, input, textarea, .holder, button').forEach(function (el) { el.style.display = 'none'; });
        } else {
          form.querySelectorAll('input, textarea').forEach(function (el) { el.value = ''; });
          btn.disabled = false;
        }
        msg.textContent = texts.ok; msg.className = 'msg ok';
        if (onOk) onOk();
      } else if (r.status === 409) {
        msg.textContent = texts.dup; msg.className = 'msg ok'; btn.disabled = false;
        if (onOk) onOk();
      } else { throw new Error('insert failed: ' + r.status); }
    }).catch(function () {
      msg.textContent = texts.err; msg.className = 'msg err'; btn.disabled = false;
    });
  }

  var params = new URLSearchParams(location.search);
  var utm = { utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'), utm_campaign: params.get('utm_campaign') };

  var doorForm = document.getElementById('door-form');
  doorForm.addEventListener('submit', function (e) {
    e.preventDefault();
    submitRow(
      Object.assign({
        event_slug: ${JSON.stringify(d.door.eventSlug)},
        name: document.getElementById('f-name').value.trim(),
        email: document.getElementById('f-email').value.trim().toLowerCase(),
        interest_level: doorForm.querySelector('input[name=interest]:checked').value,
        could_help_organise: document.getElementById('f-holder').checked,
        notes: null,
      }, utm),
      doorForm, document.getElementById('door-msg'),
      { ok: ${JSON.stringify(d.door.successMessage)}, dup: ${JSON.stringify(d.door.duplicateMessage)}, err: ${JSON.stringify(d.door.errorMessage)} },
      true
    );
  });

  var truerForm = document.getElementById('truer-form');
  if (truerForm) {
    truerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitRow(
        Object.assign({
          event_slug: ${JSON.stringify(d.truer ? d.truer.eventSlug : '')},
          name: document.getElementById('t-name').value.trim(),
          email: document.getElementById('t-email').value.trim().toLowerCase(),
          interest_level: 'keep-informed', could_help_organise: false,
          notes: document.getElementById('t-note').value.trim(),
        }, utm),
        truerForm, document.getElementById('truer-msg'),
        { ok: ${JSON.stringify(d.truer ? d.truer.thanks : '')}, dup: ${JSON.stringify(d.truer ? d.truer.thanks : '')}, err: ${JSON.stringify(d.truer ? d.truer.error : '')} },
        false
      );
    });
  }

  var score = 0, answered = 0;
  var qs = document.querySelectorAll('.q');
  var scores = ${JSON.stringify(d.quiz ? d.quiz.scores : null)};
  qs.forEach(function (q) {
    q.querySelectorAll('.q-options button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (q.classList.contains('done')) return;
        q.classList.add('done');
        answered++;
        var correct = btn.getAttribute('data-correct') === '1';
        if (correct) score++;
        q.querySelectorAll('.q-options button').forEach(function (b) {
          b.className = b.getAttribute('data-correct') === '1' ? 'right' : (b === btn ? 'wrong' : '');
        });
        if (answered === qs.length && scores) {
          var el = document.getElementById('q-score');
          el.textContent = score === qs.length ? scores.three : (score === qs.length - 1 ? scores.two : scores.low);
        }
      });
    });
  });
})();
</script>
</body>
</html>
`;

  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`built public/${slug}/index.html`);
  if (skipped.length)
    console.log(
      `  ⚠ SKIPPED ${skipped.length} destination entries that don't centre Black queer men: ${skipped
        .map((e) => `${e.name} [${e.centres ?? 'no grade'}]`)
        .join(' · ')}`
    );
  if (unchecked.length)
    console.log(
      `  ⚠ ${unchecked.length} entries NOT currency-checked — do not deploy until verified: ${unchecked
        .map((e) => e.name)
        .join(' · ')}`
    );
}

const existingSlugs = new Set(
  readdirSync(DATA).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => f.replace(/\.json$/, ''))
);

const targets = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const buildAll = process.argv.includes('--all');
const allSlugs = readdirSync(DATA)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => f.replace(/\.json$/, ''));

// Deliberately NOT build-everything-by-default. Croydon, Lambeth and Enfield were
// opened on the v1 template and their committed HTML is v1 output; a bare run that
// re-rendered them would silently reskin three live pages. Name the slugs, or pass
// --all once the retrofit has actually been agreed.
if (!targets.length && !buildAll) {
  console.error('Usage: node build-borough-doors.mjs <slug> [<slug>…]   |   --all');
  console.error(`Doors with data files: ${allSlugs.join(' · ')}`);
  console.error('Refusing to rebuild every door implicitly — that would reskin live pages.');
  process.exit(1);
}
for (const slug of buildAll ? allSlugs : targets) build(slug);
