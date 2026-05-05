/**
 * BLKOUT Liberation Design System - Tailwind Preset
 *
 * Complete design system integrating:
 * - Liberation color palette (WCAG AAA compliant)
 * - Trauma-informed spacing and typography
 * - Black queer liberation aesthetic
 * - Accessibility-first approach
 *
 * Usage in app tailwind.config.js:
 * ```js
 * export default {
 *   presets: [require('@blkout/shared/design-system/tailwind.preset')],
 *   content: ['./src/**\/*.{js,ts,jsx,tsx}'],
 * }
 * ```
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      // ================================================================
      // COLORS - Liberation Palette
      // ================================================================
      colors: {
        // Black Liberation Foundation
        'liberation-black': {
          DEFAULT: '#000000',
          pure: '#000000',
          soft: '#0A0A0A',
          charcoal: '#1A1A1A',
          'charcoal-medium': '#2A2A2A',
          'charcoal-light': '#404040',
        },

        // Sovereignty Gold
        'liberation-gold': {
          DEFAULT: '#FFD700',
          divine: '#FFD700',
          rich: '#D4AF37',
          warm: '#F4A261',
          pale: '#FFF8DC',
        },

        // Pride Colors (WCAG AAA compliant on black)
        'liberation-pride': {
          pink: '#FFB3DA',
          'pink-vivid': '#FF69B4',
          purple: '#C084FC',
          'purple-deep': '#9B4DCA',
          blue: '#4DA6FF',
          cyan: '#00D4FF',
          yellow: '#FFD700',
          orange: '#FF8C00',
          red: '#E40303',
          green: '#00D68F',
        },

        // Pan-African Colors
        'liberation-pan-african': {
          red: '#E31E24',
          black: '#000000',
          green: '#00A86B',
          'green-bright': '#00D68F',
        },

        // Healing Colors (Trauma-Informed)
        'liberation-healing': {
          sage: '#A8C69F',
          lavender: '#E6D5FF',
          mint: '#B2F5EA',
          peach: '#FFD4B3',
        },

        // Community Colors
        'liberation-community': {
          warmth: '#F4A460',
          trust: '#4ECCA3',
          wisdom: '#A78BFA',
          joy: '#FFB3DA',
          power: '#FF6B6B',
        },

        // Economic Justice
        'liberation-economic': {
          transparency: '#87CEEB',
          empowerment: '#FFA500',
          solidarity: '#9B4DCA',
        },

        // Neutral Grays
        'liberation-neutral': {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },

        // Semantic UI States
        'liberation-success': '#00D68F',
        'liberation-warning': '#FFA500',
        'liberation-error': '#FF6B6B',
        'liberation-info': '#4DA6FF',

        // Legacy aliases for backward compatibility
        liberation: {
          'black-power': '#000000',
          'gold-divine': '#FFD700',
          'sovereignty-gold': '#D4AF37',
          'pride-purple': '#C084FC',
          'pride-pink': '#FFB3DA',
          'pride-blue': '#4DA6FF',
          'healing-sage': '#A8C69F',
          'healing-lavender': '#E6D5FF',
          'community-warm': '#F4A460',
        },

        // BLKOUT Brand Purple Spectrum (cooperative identity)
        blkout: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },

        // ================================================================
        // SECTION ACCENTS — BLKOUT One Platform Design (locked 26 Apr 2026)
        // Canonical per-section accent for chrome bars, active nav, primary CTAs,
        // body headings/links. Apply via `bg-news`, `text-events`, `border-voices`
        // etc. See docs/DESIGN_COLOUR_ARCHITECTURE.md §5 for assignments.
        // ================================================================
        news:    '#9B4DCA',  // purple — news.blkoutuk.com (= liberation-pride.purple-deep)
        events:  '#FFE600',  // lemon yellow — events.blkoutuk.com (NEW)
        voices:  '#00A86B',  // Pan-African green — voices.blkoutuk.com (= liberation-pan-african.green)
        members: '#E31E24',  // Pan-African red — /account /about (= liberation-pan-african.red)
        shop:    '#FF8C00',  // pride orange — /shop (= liberation-pride.orange)
        aivor:   '#5B9BD5',  // broadcast blue — AIvor channel (NEW)
        cf:      '#FF1493',  // ACT UP pink — critical.blkoutuk.com (NEW)
      },

      // ================================================================
      // TYPOGRAPHY
      // ================================================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        // Legacy aliases
        liberation: ['Inter', 'system-ui', 'sans-serif'],
        celebration: ['Space Grotesk', 'system-ui', 'sans-serif'],
        // BLKOUT One Platform Design signature fonts (locked 26 Apr 2026).
        // Apps adopt by adding the matching Google Fonts <link> in index.html and
        // referencing `font-signature`, `font-disrupt`, `font-meta` in components.
        // Eventual goal: replace `sans` default with Work Sans across all apps;
        // keeping additive for now so existing Inter-based apps don't churn.
        signature: ['Work Sans', 'Inter', 'system-ui', 'sans-serif'],     // display (uppercase 900 tracking-tight)
        disrupt:   ['Fraunces', 'Georgia', 'serif'],                      // italic lowercase tender notes
        meta:      ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],     // metadata + // comment labels
      },

      fontSize: {
        // Display sizes
        'display-xl': ['clamp(3rem, 6vw + 1rem, 5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 5vw + 1rem, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(2rem, 4vw + 1rem, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        // Headings
        'h1': ['clamp(2rem, 3vw + 1rem, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['clamp(1.75rem, 2.5vw + 1rem, 2rem)', { lineHeight: '1.2' }],
        'h3': ['clamp(1.5rem, 2vw + 1rem, 1.75rem)', { lineHeight: '1.2' }],
        'h4': ['clamp(1.25rem, 1.5vw + 0.5rem, 1.5rem)', { lineHeight: '1.2' }],
        'h5': ['clamp(1.125rem, 1vw + 0.5rem, 1.25rem)', { lineHeight: '1.2' }],
        'h6': ['clamp(1rem, 0.5vw + 0.5rem, 1.125rem)', { lineHeight: '1.2' }],
      },

      lineHeight: {
        'display': '1.1',
        'heading': '1.2',
        'body-relaxed': '1.75',
        'body': '1.6',
        'body-snug': '1.5',
      },

      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },

      // ================================================================
      // SPACING - Trauma-Informed
      // ================================================================
      spacing: {
        // Touch targets
        'touch-sm': '2.5rem',   // 40px
        'touch-md': '2.75rem',  // 44px (WCAG AAA)
        'touch-lg': '3rem',     // 48px
        'touch-xl': '3.5rem',   // 56px
        // Extended scale
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
      },

      // ================================================================
      // BORDER RADIUS - Soft Corners
      // ================================================================
      borderRadius: {
        'liberation-sm': '0.375rem',  // 6px
        'liberation-md': '0.5rem',    // 8px
        'liberation-lg': '0.75rem',   // 12px
        'liberation-xl': '1rem',      // 16px
        'liberation-2xl': '1.5rem',   // 24px
        // Legacy aliases
        'blkout': '0.75rem',
        'blkout-lg': '1rem',
        'blkout-xl': '1.5rem',
        // BLKOUT One Platform Design — sharp edges baseline (locked 26 Apr 2026).
        // Use `rounded-sharp` (= 0) for new components per the signature aesthetic.
        // Eventual goal: per-app migration sets `borderRadius: { DEFAULT: '0' }`
        // when ready to drop rounded corners across the board.
        'sharp': '0',
      },

      // ================================================================
      // SHADOWS - Depth & Elevation
      // ================================================================
      boxShadow: {
        'liberation-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'liberation-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'liberation-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'liberation-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'liberation-glow': '0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(155, 77, 202, 0.2)',
        'liberation-pride': '0 0 30px rgba(255, 179, 218, 0.4)',
        // Legacy aliases
        'blkout': '0 4px 6px -1px rgba(168, 85, 247, 0.1), 0 2px 4px -1px rgba(168, 85, 247, 0.06)',
        'blkout-lg': '0 10px 15px -3px rgba(168, 85, 247, 0.1), 0 4px 6px -2px rgba(168, 85, 247, 0.05)',
      },

      // ================================================================
      // ANIMATIONS
      // ================================================================
      animation: {
        // Entrance animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in-down': 'fadeInDown 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in': 'scaleIn 0.3s ease-out',
        // Celebration animations
        'celebration': 'celebration 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'gentle-float': 'gentleFloat 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'liberation-glow': 'liberationGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pride-wave': 'prideWave 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Loading animations
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
        // Legacy aliases
        'slide-up': 'fadeInUp 0.5s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        celebration: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(1.02)' },
          '75%': { transform: 'scale(1.05)' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        liberationGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.3), 0 0 60px rgba(155, 77, 202, 0.2)' },
        },
        prideWave: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        // Legacy keyframes
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // ================================================================
      // BACKGROUND IMAGES / GRADIENTS
      //
      // ⚠ DEPRECATED per BLKOUT One Platform Design (26 Apr 2026):
      // pride-gradient, joy-gradient, power-gradient, healing-gradient,
      // dark-gradient, liberation-gradient are slated for removal as apps
      // migrate. New work expresses identity through section accent + voice
      // + structure, not gradient floods. Only `.noise` (radial pseudo, set
      // in app CSS) is wanted for hero sections. Functional overlays
      // (from-black/80 to-transparent for image legibility) stay.
      //
      // Per-app sweep removes references during migration; once last
      // consumer is gone, these defs come out of the preset.
      // ================================================================
      backgroundImage: {
        // Pride gradient (vertical rainbow)
        'pride-gradient': 'linear-gradient(180deg, #E40303 0%, #FF8C00 17%, #FFD700 33%, #00D68F 50%, #4DA6FF 67%, #C084FC 100%)',
        // Joy gradient (diagonal pink-purple-blue)
        'joy-gradient': 'linear-gradient(135deg, #FFB3DA 0%, #C084FC 50%, #4DA6FF 100%)',
        // Power gradient (gold-red-purple)
        'power-gradient': 'linear-gradient(135deg, #FFD700 0%, #FF6B6B 50%, #9B4DCA 100%)',
        // Healing gradient (sage-mint-lavender)
        'healing-gradient': 'linear-gradient(135deg, #A8C69F 0%, #B2F5EA 50%, #E6D5FF 100%)',
        // Dark gradient (for backgrounds)
        'dark-gradient': 'linear-gradient(to bottom right, #171717, #2A1A4A, #1A3A2A)',
        // Legacy alias
        'liberation-gradient': 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f59e0b 100%)',
      },

      // ================================================================
      // Z-INDEX LAYERS
      // ================================================================
      zIndex: {
        'base': 0,
        'dropdown': 10,
        'sticky': 100,
        'fixed': 500,
        'modal-backdrop': 900,
        'modal': 1000,
        'popover': 1100,
        'tooltip': 1200,
        'notification': 1300,
      },

      // ================================================================
      // CONTAINER WIDTHS
      // ================================================================
      maxWidth: {
        'text-sm': '45ch',
        'text': '65ch',
        'text-lg': '75ch',
      },
    },
  },

  plugins: [],
};
