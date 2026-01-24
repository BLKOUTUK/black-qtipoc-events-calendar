/**
 * Events Calendar - Tailwind Configuration
 * Uses BLKOUT Liberation Design System (centralized)
 */

/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('../../packages/shared/design-system/tailwind.preset')],

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared/design-system/components/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // App-specific animations
      animation: {
        'pride-wave': 'prideWave 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
};
