#!/usr/bin/env node
// Borough door generator — one static page per borough, from data/<borough>.json.
// The replication-cost thesis made literal: the next borough is a data file, not code.
// Usage: node scripts/borough-doors/build-borough-doors.mjs
// Output: public/<slug>/index.html (served as a real file, ahead of the SPA catch-all).
//
// Design: BLKOUT shell-and-disruption (community-web-design skill) — Work Sans 900
// uppercase shell, gold power borders, sharp corners, Fraunces italic tenderness
// breaking through. Fun (quiz) · useful (rings + services) · reciprocal (make it truer).

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, 'data');
const appRoot = join(here, '..', '..');

const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// The centring rule (Rob, 27 Aug): destination rings ("here", "worthTheJourney") only
// carry places that centre Black queer men or the wider Black LGBTQ+ community. The
// allies ring ("besideUs") and services are exempt — framed as ecosystem/services,
// not promises about who is centred.
const DESTINATION_GRADES = new Set(['black-queer-men', 'black-lgbtq']);
const splitByCentring = (entries) => {
  const kept = [], skipped = [];
  for (const e of entries) (DESTINATION_GRADES.has(e.centres) ? kept : skipped).push(e);
  return { kept, skipped };
};

const entryCard = (e) => `
      <article class="card">
        <h3><a href="${esc(e.url)}" rel="noopener">${esc(e.name)}</a></h3>
        <p>${esc(e.note)}</p>
      </article>`;

const jsonLd = (d) =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      ...(d.faq?.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: d.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]
        : []),
      {
        '@type': 'Organization',
        '@id': 'https://blkoutuk.com/#org',
        name: 'BLKOUT UK',
        url: 'https://blkoutuk.com',
        description:
          'Community-owned co-operative (Community Benefit Society) for Black queer men in the UK.',
        sameAs: ['https://events.blkoutuk.com', 'https://blkouthub.com'],
      },
      {
        '@type': 'WebPage',
        '@id': d.canonicalUrl,
        url: d.canonicalUrl,
        name: d.title,
        description: d.metaDescription,
        about: { '@id': 'https://blkoutuk.com/#org' },
        dateModified: new Date().toISOString().slice(0, 10),
      },
      {
        '@type': 'ItemList',
        name: `Black queer community in and around ${d.brandForm.replace(/^BLKOUT in /, '')}`,
        itemListElement: [...d.besideUs.entries, ...d._journey].map((e, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: e.name,
          url: e.url,
        })),
      },
    ],
  });

const quizSection = (d) =>
  d.quiz
    ? `
  <section id="quiz" class="quiz">
    <h2>${esc(d.quiz.heading)}</h2>
    <p class="intro">${esc(d.quiz.sub)}</p>
    ${d.quiz.questions
      .map(
        (q, qi) => `
    <div class="q" data-q="${qi}">
      <p class="q-text">${esc(q.q)}</p>
      <div class="q-options">
        ${q.options
          .map((o) => `<button type="button" data-correct="${o.correct ? '1' : '0'}">${esc(o.t)}</button>`)
          .join('\n        ')}
      </div>
      <p class="q-reveal">${esc(q.reveal)}</p>
    </div>`,
      )
      .join('')}
    <p class="q-score" id="quiz-score"></p>
  </section>`
    : '';

const page = (d) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)}</title>
<meta name="description" content="${esc(d.metaDescription)}">
<link rel="canonical" href="${esc(d.canonicalUrl)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;900&family=Fraunces:ital,wght@1,300;1,400;1,500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonLd(d)}</script>
<style>
  :root {
    --bg: #0a0a14; --shell: #14141f; --purple: #4a1942;
    --gold: #d4af37; --gold-bright: #FFD700;
    --ink: #f5f1e8; --dim: #b0b0b8; --line: #2a2a3a;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    background-color: var(--bg);
    background-image:
      radial-gradient(1100px 750px at 88% -80px, rgba(74, 25, 66, .30), transparent 62%),
      radial-gradient(950px 700px at -60px 105%, rgba(212, 175, 55, .16), transparent 58%),
      linear-gradient(180deg, #0d0c1c 0%, #0a0a14 45%, #0d0a18 100%);
    background-attachment: fixed;
    color: var(--ink); font-family: 'Work Sans', system-ui, sans-serif; line-height: 1.65;
  }
  main { max-width: 1080px; margin: 0 auto; padding: 0 1.25rem 5rem; }
  main > section { max-width: 800px; margin-left: auto; margin-right: auto; }
  /* Reading rests at measure; poster and conversion moments span — the doorframe restated at the door. */
  main > #gallery, .duo, main > #door, main > #join, main > #truer { max-width: none; }
  .door form, .truer form { max-width: 800px; }
  footer p { max-width: 62ch; }
  a { color: var(--gold-bright); text-decoration-color: var(--gold); }

  .top { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; }
  .top img { height: 2.4rem; }
  .top a.home { font-size: .8rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; text-decoration: none; color: var(--dim); }
  .top a.home:hover { color: var(--gold-bright); }

  /* No photo heroes — the doors must look like each other, and type is the shared identity (Rob, 27 Aug).
     The doorframe is the doors' own signature device — deliberately distinct from other BLKOUT surfaces. */
  header.hero { padding: 2.5rem 0 3rem; }
  .doorframe { border: 4px solid var(--gold); border-top-width: 14px; padding: 3rem 2.5rem 2.75rem; position: relative; overflow: hidden; }
  .doorframe::after { content: ''; position: absolute; right: -9px; top: 44%; width: 14px; height: 14px; background: var(--gold-bright); border-radius: 50%; border: 3px solid var(--bg); }
  .kicker { color: var(--gold); font-size: .8rem; letter-spacing: .18em; text-transform: uppercase; font-weight: 600; }
  h1 { font-size: clamp(3rem, 9.5vw, 6.5rem); font-weight: 900; text-transform: uppercase; letter-spacing: -.02em; line-height: .98; margin: .75rem 0 1.25rem; }
  .standfirst { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 1.3rem; color: var(--ink); max-width: 58ch; }
  .hero-cta { margin-top: 1.75rem; }
  .doorframe { display: flex; align-items: flex-end; }
  .door-text { flex: 1 1 480px; min-width: 0; }
  .landmark { flex: 0 1 440px; width: 440px; max-width: 44%; margin: -1.5rem -0.5rem -2.75rem 2rem; align-self: flex-end; }
  @media (max-width: 700px) { .doorframe { display: block; } .landmark { float: right; width: 180px; max-width: 48%; margin: -1rem -0.25rem .5rem 1rem; } }

  section { padding: 3rem 0; }
  section + section, .duo + section { border-top: 1px solid var(--line); }
  h2 { font-weight: 900; text-transform: uppercase; letter-spacing: -.01em; font-size: 1.65rem; margin-bottom: .6rem; padding-left: 1.5rem; text-indent: -1.5rem; }
  h2::before { content: '— '; color: var(--gold); }
  .quiz h2, .door h2, .join h2, .truer h2 { padding-left: 0; text-indent: 0; }
  .intro { color: var(--dim); margin-bottom: 1.5rem; max-width: 62ch; }
  section > p, .reasons li { max-width: 62ch; }

  .card { background: var(--shell); border-left: 5px solid var(--gold); padding: 1.1rem 1.35rem; margin-bottom: .8rem; transition: transform .15s ease, background .15s ease; }
  .card:hover { transform: translateX(4px); background: #1b1b33; }
  .card h3 { font-size: 1.08rem; font-weight: 600; margin-bottom: .3rem; }
  .card h3 a { color: var(--ink); text-decoration: none; border-bottom: 2px solid var(--gold); }
  .card h3 a:hover { color: var(--gold-bright); }
  .card p { color: var(--dim); font-size: .95rem; }

  .quiet { background: var(--purple); border-left: 5px solid var(--gold); padding: 1.1rem 1.35rem; color: var(--ink); font-size: .95rem; }

  .recent { margin-top: 1.75rem; }
  .recent h3 { color: var(--gold); font-size: .8rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; margin-bottom: .6rem; }
  .recent ul { list-style: none; padding: 0; }
  .recent li { color: var(--dim); font-size: .95rem; margin-bottom: .4rem; max-width: 62ch; }
  .recent li strong { color: var(--ink); font-weight: 600; }
  .recent-note { font-family: 'Fraunces', Georgia, serif; font-style: italic; color: var(--dim); font-size: .9rem; margin-top: .75rem; }

  /* Flexbox, not grid — old WebKit (and the render pipeline) has no grid support. */
  @media (min-width: 900px) {
    .duo { display: flex; align-items: flex-start; }
    .duo > section { flex: 1 1 620px; padding-right: 2.5rem; max-width: none; }
    .duo .side { width: 360px; flex: none; position: sticky; top: 1.5rem; padding-top: 3rem; }
    .duo .quiz { margin-top: 0; }
  }
  .quiz { background: var(--shell); border: 1px solid var(--line); border-left: 5px solid var(--gold); padding: 1.35rem 1.2rem; margin-top: 3rem; }
  .quiz h2 { font-size: 1.35rem; }
  .cards { display: flex; flex-wrap: wrap; align-items: flex-start; margin: 0 -0.4rem; }
  .cards .card { flex: 1 1 300px; margin: .4rem; }
  .quiz h2::before { content: ''; }
  .q { margin-top: 1.5rem; }
  .q-text { font-weight: 600; margin-bottom: .6rem; }
  .q-options { display: flex; flex-direction: column; }
  .q-options button { text-align: left; background: var(--bg); color: var(--ink); border: 1px solid var(--line); padding: .65rem .9rem; font: inherit; font-size: .95rem; cursor: pointer; }
  .q-options button:hover { border-color: var(--gold); }
  .q.done .q-options button { cursor: default; opacity: .45; }
  .q.done .q-options button.correct { background: var(--gold); color: #000; font-weight: 600; opacity: 1; }
  .q.done .q-options button.chosen-wrong { border-color: #7a2b2b; text-decoration: line-through; opacity: .7; }
  .q-reveal { display: none; font-family: 'Fraunces', Georgia, serif; font-style: italic; color: var(--ink); font-size: .98rem; margin-top: .7rem; padding-left: .9rem; border-left: 3px solid var(--gold); }
  .q.done .q-reveal { display: block; }
  .q-score { display: none; margin-top: 1.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; color: var(--gold-bright); }

  /* Uniform-tile grid: cover-cropped tiles, no ragged skyline. (object-fit degrades in the
     render pipeline's old engine; browsers are fine.) */
  .gallery-grid { display: flex; flex-wrap: wrap; margin: 0 -0.4rem; }
  .gallery-grid figure { flex: 1 1 280px; max-width: calc(33.33% - .8rem); margin: .4rem; border: 3px solid var(--gold); background: var(--shell); }
  @media (max-width: 900px) { .gallery-grid figure { max-width: calc(50% - .8rem); } }
  @media (max-width: 600px) { .gallery-grid figure { max-width: 100%; } }
  .gallery-grid img { width: 100%; height: 300px; object-fit: cover; display: block; }
  .gallery-grid figcaption { padding: .5rem .7rem; font-size: .82rem; color: var(--dim); }

  .table-wrap { overflow-x: auto; margin-top: 1.5rem; }
  table.census { width: 100%; border-collapse: collapse; font-size: .88rem; font-family: 'IBM Plex Mono', monospace; }
  table.census caption { font-family: 'Work Sans', system-ui, sans-serif; max-width: 70ch; }
  .history { margin-top: 1.5rem; }
  .history p { max-width: 62ch; color: var(--ink); margin-bottom: 1rem; }
  .history em { font-family: 'Fraunces', Georgia, serif; font-style: italic; }
  table.census caption { caption-side: top; text-align: left; color: var(--dim); font-size: .85rem; padding-bottom: .6rem; }
  table.census th { text-align: left; text-transform: uppercase; font-size: .75rem; letter-spacing: .1em; color: var(--gold); border-bottom: 2px solid var(--gold); padding: .5rem .75rem; }
  table.census td { padding: .45rem .75rem; border-bottom: 1px solid var(--line); color: var(--dim); }
  /* Palette semantics (documented): gold = action/emphasis family (self-row tint #2a2312 derives from gold);
     purple #4a1942 = "the borough's own space" — quiet notes (absence held) and Make It Truer (absence being
     filled). One meaning, two moments of the same conversation. */
  table.census tr.self td { background: #2a2312; color: var(--gold-bright); font-weight: 600; }
  .pills { display: flex; flex-wrap: wrap; max-width: 660px; }
  .pill { display: inline-block; padding: .55rem 1.1rem; margin: 0 .6rem .6rem 0; border: 2px solid var(--gold); color: var(--gold-bright); text-decoration: none; font-weight: 600; font-size: .9rem; text-transform: uppercase; letter-spacing: .05em; }
  a.pill:hover { background: var(--gold); color: #000; }
  .pill.closed { border: 1px dashed var(--line); color: var(--dim); text-transform: none; letter-spacing: 0; font-weight: 400; }

  .archive-box { border: 2px solid var(--gold); padding: 1.5rem 1.5rem 1.75rem; margin-top: 2rem; max-width: 62ch; }
  .archive-box h3 { color: var(--gold); font-size: .85rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; margin-bottom: .5rem; }
  .archive-box p { color: var(--dim); font-size: .95rem; margin-bottom: 1rem; }
  .archive-box .cta { padding: .6rem 1.4rem; font-size: .85rem; }
  .biblio { list-style: none; padding: 0; }
  .biblio li { color: var(--dim); font-size: .95rem; margin-bottom: .7rem; padding-left: 1.2rem; text-indent: -1.2rem; max-width: 70ch; }
  .biblio li::before { content: '— '; color: var(--gold); }
  .biblio em { color: var(--ink); font-family: 'Fraunces', Georgia, serif; }

  .faq-item { border-bottom: 1px solid var(--line); background: transparent; }
  .faq-item summary { padding: .95rem .25rem; font-weight: 600; cursor: pointer; list-style: none; }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::before { content: '▸ '; color: var(--gold); }
  .faq-item[open] summary::before { content: '▾ '; }
  .faq-item[open] summary { color: var(--gold-bright); }
  .faq-item p { padding: 0 1.15rem 1rem; color: var(--dim); font-size: .95rem; }

  .door { border: 5px solid var(--gold); background: var(--shell); padding: 2.25rem 1.75rem; margin-top: 3rem; }
  .door h2 { font-size: 2.2rem; background: var(--gold); color: #000; display: inline-block; padding: .25rem 1.25rem .3rem; margin-bottom: 1rem; }
  .door h2::before { content: ''; }
  .join h2 { font-size: 1.95rem; }
  .tender { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 1.15rem; color: var(--ink); margin: .5rem 0 1.25rem; }
  form .option { display: flex; align-items: flex-start; background: var(--bg); border: 1px solid var(--line); padding: .95rem 1.15rem; margin-bottom: .6rem; cursor: pointer; }
  form .option:hover { border-color: var(--gold); }
  form .option:has(input:checked) { border-color: var(--gold); border-left-width: 5px; }
  form .option input { flex: none; margin: .2rem .8rem 0 0; }
  .opt-text { display: block; }
  form .option strong { display: block; text-transform: uppercase; font-size: .9rem; letter-spacing: .05em; }
  form .option .opt-text > span { color: var(--dim); font-size: .92rem; }
  /* Custom-drawn controls: unselected = empty ring/square, selected = gold. Native discs are state-illegible. */
  form input[type=radio], form input[type=checkbox] { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border: 2px solid var(--dim); background: transparent; cursor: pointer; }
  form input[type=radio] { border-radius: 50%; }
  form input[type=radio]:checked { border-color: var(--gold); background: var(--gold-bright); box-shadow: inset 0 0 0 3px var(--shell); }
  form input[type=checkbox]:checked { border-color: var(--gold); background: var(--gold-bright); }
  .holder input { width: 16px; height: 16px; margin-right: .6rem; vertical-align: -3px; }
  label.field { display: block; margin: 1.1rem 0 .35rem; font-weight: 600; font-size: .85rem; text-transform: uppercase; letter-spacing: .08em; }
  input[type=text], input[type=email], textarea { width: 100%; padding: .75rem .95rem; background: var(--bg); border: 1px solid var(--line); color: var(--ink); font: inherit; }
  input:focus, textarea:focus { outline: 2px solid var(--gold); }
  .holder { display: block; margin: 1.2rem 0; color: var(--dim); font-size: .95rem; cursor: pointer; }
  button.submit { background: var(--gold); color: #000; border: 0; padding: .9rem 2.4rem; font: inherit; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; }
  button.submit:hover { background: var(--gold-bright); }
  button.submit:disabled { opacity: .5; cursor: wait; }
  .msg { margin-top: 1rem; padding: 1rem 1.25rem; display: none; }
  .msg.ok { display: block; border-left: 5px solid var(--gold); background: var(--purple); color: var(--ink); }
  .msg.err { display: block; border: 1px solid #7a2b2b; color: #f0b9b9; }

  .join { background: var(--shell); border-left: 6px solid var(--gold); padding: 2rem 1.75rem; margin-top: 2rem; }
  .join h2::before { content: ''; }
  .reasons { list-style: none; padding: 0; margin-bottom: 1.5rem; }
  .reasons li { color: var(--dim); font-size: .97rem; margin-bottom: .6rem; padding-left: 1.2rem; text-indent: -1.2rem; }
  .reasons li::before { content: '— '; color: var(--gold); }
  .reasons strong { color: var(--ink); }
  a.cta { display: inline-block; background: var(--gold); color: #000; padding: .9rem 2.4rem; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; text-decoration: none; }
  a.cta:hover { background: var(--gold-bright); }
  .aivor { margin-top: 1.5rem; color: var(--dim); font-size: .95rem; border-top: 1px solid var(--line); padding-top: 1.25rem; }
  .aivor strong { color: var(--gold-bright); }
  .aivor video { width: 100%; margin-top: 1rem; border: 3px solid var(--gold); background: #000; display: block; }
  .aivor-more { margin-top: .6rem; font-size: .88rem; }

  .truer { background: rgba(74, 25, 66, .4); border-left: 6px solid var(--purple); padding: 2rem 1.75rem; margin-top: 2rem; }
  .cta.ghost, button.submit.ghost { background: transparent; color: var(--gold-bright); border: 2px solid var(--gold); }
  .cta.ghost:hover, button.submit.ghost:hover { background: var(--gold); color: #000; }
  .truer h2::before { content: ''; }
  .truer .intro { color: var(--ink); }

  code.listing { display: block; background: var(--bg); border: 1px dashed var(--gold); padding: .8rem 1rem; margin-top: .5rem; font-size: .85rem; color: var(--ink); user-select: all; text-indent: 0; }

  footer { padding: 3rem 0 0; color: var(--dim); font-size: .9rem; }
  footer img { height: 2.75rem; margin-bottom: 1rem; }
  @media (max-width: 600px) {
    .standfirst { font-size: 1.05rem; }
    footer nav { flex-direction: column; }
    footer nav a { margin: 0 0 .7rem 0; }
  }
  footer nav { margin-top: .75rem; display: flex; flex-wrap: wrap; }
  footer nav a { text-transform: uppercase; font-size: .8rem; font-weight: 600; letter-spacing: .1em; text-decoration: none; margin: 0 1.75rem .5rem 0; }
  .checked { font-size: .8rem; color: var(--dim); margin-top: 2rem; }
</style>
</head>
<body>
<main>
  <div class="top">
    <img src="../images/blkoutlogo_wht_transparent.png" alt="BLKOUT">
    <a class="home" href="https://blkoutuk.com">blkoutuk.com</a>
  </div>

  <header class="hero">
    <div class="doorframe">
      <div class="door-text">
        <p class="kicker">${esc(d.hero.kicker)}</p>
        <h1>${esc(d.hero.heading)}</h1>
        <p class="standfirst">${esc(d.hero.standfirst)}</p>
        <a class="cta hero-cta" href="#door">Open the door ↓</a>
      </div>
      ${d.landmark ? `<img class="landmark" src="${esc(d.landmark.src)}" alt="${esc(d.landmark.alt)}">` : ''}
    </div>
  </header>
  ${quizSection(d) ? '<div class="duo">' : ''}
  <section id="here">
    <h2>${esc(d.here.heading)}</h2>
    <p class="intro">${esc(d.here.intro)}</p>
    ${d._here.length ? d._here.map(entryCard).join('') : `<p class="quiet">${esc(d.here.quietNote)}</p>`}
    ${
      d.here.recently?.length
        ? `<div class="recent">
      <h3>Recently in the borough</h3>
      <ul>${d.here.recently.map((r) => `<li><strong>${esc(r.when)}</strong> — ${esc(r.what)}</li>`).join('\n      ')}</ul>
      <p class="recent-note">${esc(d.here.recentlyNote ?? '')}</p>
    </div>`
        : ''
    }
    ${quizSection(d) ? '' : `<article class="card">
      <h3><a href="https://events.blkoutuk.com/?utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Gatherings across London — the BLKOUT events calendar</a></h3>
      <p>Fewer and truer: what's actually on for Black queer London, checked by people, never padded.</p>
    </article>`}
  </section>
  ${quizSection(d) ? `<aside class="side">${quizSection(d)}
    <article class="card">
      <h3><a href="https://events.blkoutuk.com/?utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Gatherings across London — the BLKOUT events calendar</a></h3>
      <p>Fewer and truer: what's actually on for Black queer London, checked by people, never padded.</p>
    </article>
  </aside></div>` : ''}

  <section id="beside-us">
    <h2>${esc(d.besideUs.heading)}</h2>
    <p class="intro">${esc(d.besideUs.intro)}</p>
    ${d.besideUs.entries.length ? `<div class="cards">${d.besideUs.entries.map(entryCard).join('')}</div>` : d.besideUs.quietNote ? `<p class="quiet">${esc(d.besideUs.quietNote)}</p>` : ''}
  </section>

  <section id="worth-the-journey">
    <h2>${esc(d.worthTheJourney.heading)}</h2>
    <p class="intro">${esc(d.worthTheJourney.intro)}</p>
    <div class="cards">${d._journey.map(entryCard).join('')}</div>
  </section>

  ${
    d.services
      ? `<section id="services">
    <h2>${esc(d.services.heading)}</h2>
    <p class="intro">${esc(d.services.intro)}</p>
    <div class="cards">${d.services.entries.map(entryCard).join('')}</div>
  </section>`
      : ''
  }

  ${
    d.gallery?.images?.length
      ? `<section id="gallery">
    <h2>${esc(d.gallery.heading)}</h2>
    <p class="intro">${esc(d.gallery.intro ?? '')}</p>
    <div class="gallery-grid">
      ${d.gallery.images
        .map((g) => `<figure><img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy"><figcaption>${esc(g.caption ?? '')}</figcaption></figure>`)
        .join('\n      ')}
    </div>
  </section>`
      : ''
  }

  <section id="numbers">
    <h2>${esc(d.numbers.heading)}</h2>
    <p>${esc(d.numbers.body)}</p>
    ${
      d._census
        ? `<div class="table-wrap"><table class="census">
      <caption>${esc(d._census.note)}</caption>
      <thead><tr><th>Borough</th><th>Black residents (2021)</th><th>Black queer men (est.)</th></tr></thead>
      <tbody>
      ${d._census.rows
        .map(
          (r) =>
            `<tr${r.borough === d.brandForm.replace(/^BLKOUT in /, '') ? ' class="self"' : ''}><td>${esc(r.borough)}</td><td>${esc(r.blackResidents)}</td><td>${esc(r.estBqm)}</td></tr>`,
        )
        .join('\n      ')}
      </tbody>
    </table></div>
    <p class="recent-note">${esc(d._census.source)}</p>`
        : ''
    }
    <div class="history">${d.numbers.history
      .split('\n\n')
      .map((p, i) => {
        if (i === 0) {
          const cut = p.indexOf('. ');
          if (cut > 0) return `<p><em>${esc(p.slice(0, cut + 1))}</em> ${esc(p.slice(cut + 2))}</p>`;
        }
        return `<p>${esc(p)}</p>`;
      })
      .join('')}</div>
  </section>

  ${
    d.neighbours?.length
      ? `<section id="next-door">
    <h2>Next door</h2>
    <p class="intro">The doors are opening borough by borough. Step through, or help us open the next one.</p>
    <div class="pills">
      ${d.neighbours
        .map((n) =>
          n.slug && d._allSlugs.has(n.slug)
            ? `<a class="pill" href="/${esc(n.slug)}/">${esc(n.name)}</a>`
            : `<span class="pill closed">${esc(n.name)} — no door yet</span>`,
        )
        .join('\n      ')}
    </div>
  </section>`
      : ''
  }

  ${
    d.bibliography?.entries?.length || d.archive
      ? `<section id="reading">
    <h2>Reading the borough</h2>
    <p class="intro">${esc(d.bibliography?.intro ?? '')}</p>
    ${
      d.bibliography?.entries?.length
        ? `<ul class="biblio">
      ${d.bibliography.entries
        .map(
          (b) =>
            `<li><em>${esc(b.title)}</em> — ${esc(b.author)}${b.year ? ` (${esc(b.year)})` : ''}. ${esc(b.note ?? '')}${b.url ? ` <a href="${esc(b.url)}" rel="noopener">${esc(b.urlLabel ?? 'Read more')}</a>` : ''}</li>`,
        )
        .join('\n      ')}
    </ul>`
        : ''
    }
    ${
      d.archive
        ? `<div class="archive-box">
      <h3>From the BLKOUT archive</h3>
      <p>${esc(d.archive.intro)}</p>
      ${
        d.archive.entries?.length
          ? `<ul class="biblio">
        ${d.archive.entries.map((e) => `<li><em><a href="${esc(e.url)}" rel="noopener">${esc(e.title)}</a></em>${e.when ? ` — ${esc(e.when)}` : ''}</li>`).join('\n        ')}
      </ul>`
          : ''
      }
      <a class="cta ghost" href="https://blkoutuk.com/?tab=stories&utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Browse the story archive</a>
    </div>`
        : ''
    }
  </section>`
      : ''
  }

  ${
    d.faq?.length
      ? `<section id="faq">
    <h2>Asked, answered</h2>
    ${d.faq
      .map(
        (f) => `<details class="faq-item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`,
      )
      .join('\n    ')}
  </section>`
      : ''
  }

  <section id="door" class="door">
    <h2>${esc(d.door.heading)}</h2>
    ${d.door.tender ? `<p class="tender">${esc(d.door.tender)}</p>` : ''}
    <p class="intro">${esc(d.door.intro)}</p>
    <form id="door-form">
      ${d.door.options
        .map(
          (o) => `<label class="option"><input type="radio" name="interest" value="${esc(o.value)}" required><span class="opt-text"><strong>${esc(o.title)}</strong><span>${esc(o.body)}</span></span></label>`,
        )
        .join('\n      ')}
      <label class="field" for="f-name">Your name</label>
      <input id="f-name" type="text" required autocomplete="name">
      <label class="field" for="f-email">Email</label>
      <input id="f-email" type="email" required autocomplete="email">
      <label class="holder"><input id="f-holder" type="checkbox">${esc(d.door.holderLabel)}</label>
      <button class="submit" type="submit">Open my door</button>
      <p class="msg" id="door-msg"></p>
    </form>
  </section>

  <section id="join" class="join">
    <h2>Step inside</h2>
    <p class="tender">The door is how we find each other. BLKOUTHUB is where we live.</p>
    <p class="intro">The members' room: Black queer men across the UK, owned by the men in it. Why knock:</p>
    <ul class="reasons">
      <li><strong>Real connection.</strong> Nearly four in five members say they came to find it — and found it.</li>
      <li><strong>No algorithm, no ads, nothing sold onward.</strong> A room that doesn't monetise you. Your attention is yours; we're after your company.</li>
      <li><strong>Where things actually start.</strong> Occasions, groups, and the knowledge that never gets written down — passed man to man, the way it always has been.</li>
      <li><strong>Owned by us.</strong> A co-operative with an asset lock: what we build together stays ours, and passes to the men who come after.</li>
    </ul>
    <a class="cta" href="https://blkouthub.com/?utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Join BLKOUTHUB</a>
    <div class="aivor">
      <p>And don't just read about <strong>AIvor</strong> — talk with him. Our own voice, named for the man whose name is over every door. Ask him about BLKOUT, about Black queer life, about ${esc(d.brandForm.replace(/^BLKOUT in /, ''))} — he answers.</p>
      <a class="cta ghost" href="https://blkoutuk.com/?chat=open&utm_source=borough-door&utm_campaign=${esc(d.slug)}" rel="noopener">Talk with AIvor now</a>
      <video controls preload="none" playsinline poster="../images/aivor-poster.jpg">
        <source src="https://blkoutuk.com/videos/onboarding/Ask%20Ivor%20%E2%80%91%20Made%20with%20FlexClip.mp4" type="video/mp4">
        Your browser doesn't support video — <a href="https://blkoutuk.com/intro" rel="noopener">meet AIvor at blkoutuk.com/intro</a>.
      </video>
      <p class="aivor-more"><a href="https://blkoutuk.com/intro" rel="noopener">Prefer to meet him first? The full introduction</a></p>
    </div>
  </section>

  ${
    d.truer
      ? `<section id="truer" class="truer">
    <h2>${esc(d.truer.heading)}</h2>
    <p class="intro">${esc(d.truer.intro)}</p>
    <form id="truer-form">
      <label class="field" for="t-note">What should we know?</label>
      <textarea id="t-note" rows="3" required placeholder="${esc(d.truer.placeholder)}"></textarea>
      <label class="field" for="t-name">Your name</label>
      <input id="t-name" type="text" required autocomplete="name">
      <label class="field" for="t-email">Email</label>
      <input id="t-email" type="email" required autocomplete="email">
      <button class="submit ghost" type="submit">Make it truer</button>
      <p class="msg" id="truer-msg"></p>
    </form>
  </section>`
      : ''
  }

  <section id="working-with-us">
    <h2>If you work here</h2>
    <p class="intro">This page is for Black queer men first. But if you serve this borough — NHS, social prescribing, council, community sector, creative health, or you run a room — there's a door for you too.</p>
    <ul class="reasons">
      <li><strong>Refer.</strong> Supporting a Black queer man who could use his people? Send him this page — that is a referral, and every knock gets answered by a human.</li>
      <li><strong>Commission or partner.</strong> Working on Black queer men's health, culture or connection in ${esc(d.brandForm.replace(/^BLKOUT in /, ''))}? We're the community-owned, by-and-for partner — and the evidence base is already on this page. Write to <a href="mailto:rob@blkoutuk.com">rob@blkoutuk.com</a>.</li>
      <li><strong>List us.</strong> Maintain a directory, a support page, a signposting service? Our entry, ready to paste:
        <code class="listing">BLKOUT — the UK's community-owned co-operative for Black queer men. In your neighbourhood: ${esc(d.canonicalUrl)} · blkoutuk.com · rob@blkoutuk.com</code>
      </li>
      <li><strong>Run a room.</strong> A venue, night or group our men should know about? <a href="#truer">Tell us</a> — the page gets truer, and it points at you.</li>
    </ul>
    <p class="recent-note">We list our neighbours and our neighbours list us. That's how a borough works.</p>
  </section>

  <footer>
    <img src="../images/blkoutlogo_wht_transparent.png" alt="BLKOUT">
    <p>${esc(d.footer.line)}</p>
    <nav>${d.footer.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join('\n    ')}</nav>
    <p class="checked">Listings checked ${esc(d.lastChecked)}. When it's quiet, we say so — nothing here is padded.</p>
  </footer>
</main>
<script>
(function () {
  var SB_URL = ${JSON.stringify(d.supabase.url)};
  var SB_KEY = ${JSON.stringify(d.supabase.anonKey)};

  function submitRow(row, form, msg, texts, hideOnSuccess) {
    var btn = form.querySelector('button.submit');
    btn.disabled = true;
    msg.className = 'msg';
    fetch(SB_URL + '/rest/v1/event_interest', {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    })
      .then(function (r) {
        if (r.ok) {
          if (hideOnSuccess) {
            form.querySelectorAll('.option, .field, input, textarea, .holder, button').forEach(function (el) { el.style.display = 'none'; });
          } else {
            form.querySelectorAll('input, textarea').forEach(function (el) { el.value = ''; });
            btn.disabled = false;
          }
          msg.textContent = texts.ok;
          msg.className = 'msg ok';
        } else if (r.status === 409) {
          msg.textContent = texts.dup;
          msg.className = 'msg ok';
          btn.disabled = false;
        } else {
          throw new Error('insert failed: ' + r.status);
        }
      })
      .catch(function () {
        msg.textContent = texts.err;
        msg.className = 'msg err';
        btn.disabled = false;
      });
  }

  var params = new URLSearchParams(location.search);
  var utm = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };

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
      doorForm,
      document.getElementById('door-msg'),
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
          interest_level: 'keep-informed',
          could_help_organise: false,
          notes: document.getElementById('t-note').value.trim(),
        }, utm),
        truerForm,
        document.getElementById('truer-msg'),
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
        else btn.classList.add('chosen-wrong');
        q.querySelectorAll('button[data-correct="1"]').forEach(function (b) { b.classList.add('correct'); });
        if (scores && answered === qs.length) {
          var el = document.getElementById('quiz-score');
          var text = score === qs.length ? scores.three : score === qs.length - 1 ? scores.two : scores.low;
          el.textContent = score + '/' + qs.length + ' — ' + text;
          el.style.display = 'block';
        }
      });
    });
  });
})();
</script>
</body>
</html>
`;

let built = 0;
const boroughFiles = readdirSync(dataDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const allSlugs = new Set(
  boroughFiles.map((f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8')).slug),
);
let census = null;
try {
  census = JSON.parse(readFileSync(join(dataDir, '_census.json'), 'utf8'));
} catch {
  console.log('  ⚠ no _census.json — census tables omitted');
}
for (const file of boroughFiles) {
  const d = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  d._census = census;
  d._allSlugs = allSlugs;
  const hereSplit = splitByCentring(d.here.entries);
  const journeySplit = splitByCentring(d.worthTheJourney.entries);
  d._here = hereSplit.kept;
  d._journey = journeySplit.kept;
  const outDir = join(appRoot, 'public', d.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), page(d));
  console.log(`built public/${d.slug}/index.html`);
  const miscentred = [...hereSplit.skipped, ...journeySplit.skipped];
  if (miscentred.length) {
    console.log(
      `  ⚠ SKIPPED ${miscentred.length} destination entries that don't centre Black queer men (fix \`centres\` or remove): ${miscentred.map((e) => `${e.name} [${e.centres ?? 'no grade'}]`).join(' · ')}`,
    );
  }
  const unchecked = [...d.besideUs.entries, ...d._journey, ...d._here].filter((e) => !e.currencyChecked);
  if (unchecked.length) {
    console.log(
      `  ⚠ ${unchecked.length} entries NOT currency-checked — do not deploy until verified: ${unchecked.map((e) => e.name).join(' · ')}`,
    );
  }
  built++;
}
if (!built) {
  console.error('NO-REPORT: no data files found in ' + dataDir);
  process.exit(1);
}
