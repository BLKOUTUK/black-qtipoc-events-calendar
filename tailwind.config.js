/**
 * Events Calendar - Tailwind Configuration
 *
 * Uses local BLKOUT preset for standalone deployment.
 * Preset copied from @blkout/shared for Coolify builds.
 */

/** @type {import('tailwindcss').Config} */
export default {
  // Use local BLKOUT design system preset (for standalone builds)
  presets: [require('./tailwind.preset')],

  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      // App-specific extensions (beyond shared preset)
      animation: {
        'scale-in': 'scaleIn 0.3s ease-out',
        'pride-wave': 'prideWave 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        prideWave: {
          '0%, 100%': {
            background: 'linear-gradient(45deg, #E40303, #FF8C00, #FFED00, #008018, #004CFF, #732982)'
          },
          '50%': {
            background: 'linear-gradient(225deg, #732982, #004CFF, #008018, #FFED00, #FF8C00, #E40303)'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
};
