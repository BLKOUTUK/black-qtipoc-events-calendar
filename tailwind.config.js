/**
 * Events Calendar - Tailwind Configuration
 *
 * One Platform Design pilot. Imports the shared design-system preset via
 * relative path (per DESIGN_COLOUR_ARCHITECTURE.md §10 fallback) — keeps
 * a single canonical preset without depending on workspace-dep resolution
 * which is currently messy (nested @blkout/design-system isn't a clean
 * workspace target). App-specific extensions stay here.
 */

import sharedPreset from '../../packages/shared/design-system/tailwind.preset.js'

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
