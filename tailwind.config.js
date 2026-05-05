/**
 * Events Calendar - Tailwind Configuration
 *
 * One Platform Design pilot. PR #8's relative-path import was the §10 plan
 * but Coolify's Docker build can't see outside the events-calendar repo
 * (`../../packages/...` resolves outside container /app). Falling back to
 * the documented §10 fallback: vendored local preset, kept manually in sync
 * with packages/shared/design-system/tailwind.preset.js — same pattern as
 * community-platform / news-blkout / comms-blkout.
 *
 * To re-sync after a shared-preset update:
 *   cp ../../packages/shared/design-system/tailwind.preset.js ./tailwind.preset.js
 */

import sharedPreset from './tailwind.preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedPreset],

  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      // Sharp edges by default for events-calendar (per-app opt-in,
      // matches community-platform Round 2 + DESIGN_COLOUR_ARCHITECTURE.md §10).
      // Bare `rounded` resolves to 0; explicit rounded-md/lg/xl/full still soften.
      borderRadius: {
        DEFAULT: '0',
      },

      // App-specific animations (kept after preset migration).
      animation: {
        'scale-in': 'scaleIn 0.3s ease-out',
        'pride-wave': 'prideWave 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        prideWave: {
          '0%, 100%': {
            background: 'linear-gradient(45deg, #E40303, #FF8C00, #FFED00, #008018, #004CFF, #732982)',
          },
          '50%': {
            background: 'linear-gradient(225deg, #732982, #004CFF, #008018, #FFED00, #FF8C00, #E40303)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
