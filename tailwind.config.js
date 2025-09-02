/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blkout: {
          primary: '#D4261A',      // Bold red
          secondary: '#F4A261',    // Warm gold  
          accent: '#2A9D8F',       // Teal
          warm: '#E76F51',         // Orange
          deep: '#264653',         // Forest green
        },
        realness: {
          amber: '#F59E0B',
          orange: '#EA580C', 
          rose: '#E11D48',
          purple: '#7C3AED',
        },
        pride: {
          red: '#E40303',
          orange: '#FF8C00', 
          yellow: '#FFED00',
          green: '#008018',
          blue: '#004CFF',
          purple: '#732982',
          pink: '#FFB3DA',
          cyan: '#00D4FF',
          black: '#000000'
        }
      },
      backgroundImage: {
        'blkout-gradient': 'linear-gradient(to bottom right, #D4261A, #E76F51, #F4A261)',
        'function-liberation': 'linear-gradient(135deg, rgb(124 58 237), rgb(225 29 72), rgb(245 158 11), rgb(16 185 129))'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pride-wave': 'prideWave 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
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
