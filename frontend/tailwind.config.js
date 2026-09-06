/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eefbfa',
          100: '#d7f2f1',
          200: '#b4e5e4',
          300: '#83cfcf',
          400: '#4fb0b1',
          500: '#349395', // Primary Cyan/Teal
          600: '#2a7578',
          700: '#265f62',
          800: '#234e51',
          900: '#204144',
          950: '#112527',
        },
        dark: {
          950: '#09090b', // Zinc 950
          900: '#18181b', // Zinc 900
          800: '#27272a', // Zinc 800
          700: '#3f3f46', // Zinc 700
          600: '#52525b', // Zinc 600
        },
        accent: {
          blue: '#3b82f6',
          indigo: '#6366f1',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          teal: '#14b8a6',
        }
      },
      boxShadow: {
        'neon': '0 0 20px rgba(6, 182, 212, 0.4)',
        'neon-indigo': '0 0 20px rgba(99, 102, 241, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'fade-in-up':  'fadeInUp 0.5s ease-out forwards',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'typing':      'typing 1.4s infinite cubic-bezier(0.2, 0.68, 0.18, 1.08)',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        typing:  { 
          '0%': { transform: 'scale(1)', opacity: '0.2' }, 
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0.2' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}


