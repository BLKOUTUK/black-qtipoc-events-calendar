/**
 * FoundationLayer — the "people at heart" background layer.
 *
 * Renders one of 33 curated photographs (11 × {joy, power, vulnerability}) as a
 * decorative bg layer behind hero sections. Defaults to 20% opacity per the
 * community-web-design skill's three-layer structure (Foundation → Shell →
 * Disruption).
 *
 * Per-image anchors per Rob's framing rule: centre the eyes; if no clear eye
 * line, centre the hands; close-ups read well at low opacity. Each image was
 * audited individually — see FOUNDATION_ANCHORS map below. Default for any
 * unmapped image is `'center 30%'` (eyes-first for typical portraits).
 *
 * Use:
 *   <section className="relative">
 *     <FoundationLayer category="power" />
 *     <div className="relative z-10">…hero content…</div>
 *   </section>
 */

import React, { useMemo } from 'react';

const POOL: Record<'joy' | 'power' | 'vulnerability', readonly string[]> = {
  joy: Array.from({ length: 11 }, (_, i) => `/images/foundation/joy-${String(i + 1).padStart(2, '0')}.jpg`),
  power: Array.from({ length: 11 }, (_, i) => `/images/foundation/power-${String(i + 1).padStart(2, '0')}.jpg`),
  vulnerability: Array.from({ length: 11 }, (_, i) => `/images/foundation/vulnerability-${String(i + 1).padStart(2, '0')}.jpg`),
} as const;

// Per-image objectPosition. Tuned by walking each source and asking: where
// are the eyes (or hands)? Most portraits land at `'center 30%'` — eyes
// in the upper-third — but a few want different treatment.
const FOUNDATION_ANCHORS: Record<string, string> = {
  // Joy — celebrations, gatherings, smiles
  '/images/foundation/joy-01.jpg': '50% 35%', // 2 figures conversing, faces upper-third
  '/images/foundation/joy-02.jpg': '50% 25%', // close-up smile + glasses
  '/images/foundation/joy-03.jpg': '50% 25%', // profile smile, head upper
  '/images/foundation/joy-04.jpg': '50% 30%', // head + shoulders portrait
  '/images/foundation/joy-05.jpg': '50% 25%', // smiling man, head upper
  '/images/foundation/joy-06.jpg': '50% 25%', // close-up smile + dreads
  '/images/foundation/joy-07.jpg': '50% 30%', // 3 men laughing
  '/images/foundation/joy-08.jpg': '50% 30%', // 3 men selfie at Pride
  '/images/foundation/joy-09.jpg': '50% 30%', // 2 figures with BLKOUT fan
  '/images/foundation/joy-10.jpg': '50% 40%', // 2 men selfie, faces near vertical centre
  '/images/foundation/joy-11.jpg': '50% 30%', // small portrait, head upper

  // Power — protests, direct gazes, raised fists, claimed space
  '/images/foundation/power-01.jpg': 'center', // BLKOUT picket signs (signs ARE the subject)
  '/images/foundation/power-02.jpg': '50% 30%', // step-and-repeat portrait
  '/images/foundation/power-03.jpg': '50% 25%', // figure with fan + B sign
  '/images/foundation/power-04.jpg': 'center', // selfie + Baldwin portrait, both heads visible
  '/images/foundation/power-05.jpg': '50% 35%', // BLKOUT flag onstage, full figure
  '/images/foundation/power-06.jpg': '50% 30%', // figure with fan
  '/images/foundation/power-07.jpg': '50% 35%', // raised hands at sea — hands are the subject
  '/images/foundation/power-08.jpg': 'center', // graphic with text band
  '/images/foundation/power-09.jpg': '50% 25%', // 3 men "MAKE SPACE FOR US"
  '/images/foundation/power-10.jpg': '50% 25%', // 3 men in forest, central figure
  '/images/foundation/power-11.jpg': 'center', // close-up of pride-fist t-shirt graphic

  // Vulnerability — quieter portraits, embraces, tender moments
  '/images/foundation/vulnerability-01.jpg': '50% 35%', // 2-figure selfie
  '/images/foundation/vulnerability-02.jpg': '50% 30%', // hand-over-mouth close-up
  '/images/foundation/vulnerability-03.jpg': '50% 25%', // embrace, faces upper-third
  '/images/foundation/vulnerability-04.jpg': '50% 30%', // extreme close-up of eyes
  '/images/foundation/vulnerability-05.jpg': '50% 25%', // 3 figures embracing in water
  '/images/foundation/vulnerability-06.jpg': '50% 30%', // back tattoo, face peeking over shoulder
  '/images/foundation/vulnerability-07.jpg': '50% 30%', // figure being held, head upper
  '/images/foundation/vulnerability-08.jpg': '50% 30%', // BAFTA tender moment
  '/images/foundation/vulnerability-09.jpg': '50% 30%', // embrace, both faces upper
  '/images/foundation/vulnerability-10.jpg': 'center', // 2 faces in water, vertical spread
  '/images/foundation/vulnerability-11.jpg': 'center', // 2 faces side-by-side mid-frame
};

interface FoundationLayerProps {
  /** Bias selection. Omit for random across all 33. */
  category?: 'joy' | 'power' | 'vulnerability';
  /** Pin a specific image path. Overrides category + seed. */
  src?: string;
  /** Stable string → deterministic image (e.g. page slug). Otherwise random per render. */
  seed?: string;
  /** 0–1, default 0.2 per skill's "20–30% opacity" guidance. */
  opacity?: number;
  /** Override the per-image default anchor. Default reads from FOUNDATION_ANCHORS, falls back to 'center 30%'. */
  anchor?: string;
  className?: string;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const FoundationLayer: React.FC<FoundationLayerProps> = ({
  category,
  src,
  seed,
  opacity = 0.2,
  anchor,
  className = '',
}) => {
  const chosen = useMemo(() => {
    if (src) return src;
    const pool = category ? POOL[category] : [...POOL.joy, ...POOL.power, ...POOL.vulnerability];
    const idx = seed ? hashSeed(seed) % pool.length : Math.floor(Math.random() * pool.length);
    return pool[idx];
  }, [src, category, seed]);

  // Per-image anchor first (centre eyes); then explicit override; then eyes-first fallback.
  const resolvedAnchor = anchor ?? FOUNDATION_ANCHORS[chosen] ?? 'center 30%';

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `url('${chosen}')`,
        backgroundSize: 'cover',
        backgroundPosition: resolvedAnchor,
        opacity,
      }}
    />
  );
};

export default FoundationLayer;
