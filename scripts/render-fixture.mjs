#!/usr/bin/env node
/**
 * Renders <Header/><Surface/> (no Footer — out of scope for this build) to static HTML
 * for design review, per spec §3 "Render fixture for review". No client JS runs, so the
 * beat-filter chips render in their default ("All") state and nothing is interactive —
 * that's expected for a critic PNG.
 *
 * Run:
 *   npx tailwindcss -c tailwind.config.js -i src/index.css -o render/fixture.css --minify
 *   npx tsx scripts/render-fixture.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Header from '../src/components/Header.tsx';
import { Surface } from '../src/components/surface/Surface.tsx';
import { fullFixture, quietFixture } from './fixtures/surface.fixture.ts';

// tsx/esbuild resolves its JSX transform from the nearest ancestor tsconfig.json, which
// (from this repo's cwd) is the project-references-only root tsconfig.json — no `jsx`
// option, so esbuild falls back to the classic transform and compiles Header.tsx's JSX to
// bare `React.createElement(...)` calls even though that file never imports React itself
// (it relies on Vite's automatic runtime at normal build time). Publishing `React` as a
// global here — before Header is ever invoked below — satisfies that reference without
// touching Header.tsx or the shared tsconfig.
globalThis.React = React;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'render');
mkdirSync(outDir, { recursive: true });

const FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;900&family=Fraunces:ital,wght@1,400;1,500;1,700&family=IBM+Plex+Mono:wght@400;500&display=swap" />';

function page(title, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${FONTS_LINK}
<link rel="stylesheet" href="./fixture.css" />
<title>${title}</title>
</head>
<body class="noise" style="background:#0a0a14;color:#f5f1e8;margin:0;">
<div id="root">${bodyHtml}</div>
</body>
</html>
`;
}

function renderVariant(name, fixture) {
  const noop = () => {};
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Header),
      React.createElement('div', { className: 'h-16' }),
      React.createElement(Surface, { ...fixture, onOpenEventForm: noop, onOpenOpeningForm: noop })
    )
  );
  const outPath = path.join(outDir, `fixture-${name}.html`);
  writeFileSync(outPath, page(`Surface fixture — ${name}`, html));
  console.log('wrote', outPath);
}

renderVariant('full', fullFixture);
renderVariant('quiet', quietFixture);
