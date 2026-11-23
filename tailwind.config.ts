import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', lg: '1.5rem' }, screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        // Halal Shodai palette from the logo: green #106635, gold #dda91f, cream #fbf7ee (kept in sync with the admin theme)
        brand: {
          50: '#eef7f1',
          100: '#d5ecdc',
          200: '#aed8bc',
          300: '#7bbd94',
          400: '#47996a',
          500: '#237d4c',
          600: '#136a3a',
          700: '#10582f',
          800: '#0f4728',
          900: '#0d3a22',
          950: '#062014',
        },
        earth: {
          50: '#faf6f0',
          100: '#f2e9da',
          200: '#e4d1b3',
          300: '#d3b385',
          400: '#c39461',
          500: '#b67e4b',
          600: '#a0663f',
          700: '#854f36',
          800: '#6d4131',
          900: '#5a372b',
        },
        honey: { 300: '#f1d27e', 400: '#e7bb45', 500: '#dda91f', 600: '#c4921a' },
        // Surfaces & accents (Halal Shodai)
        cream: '#fbf7ee', // logo background (header logo badge, accent cards)
        page: '#f4f7f4', // page background: soft green-tinted off-white
        mint: '#e9f4ec', // alternate section background
        sand: '#f8faf8', // product card info area
        forest: { 600: '#187440', 700: '#136a3a', 800: '#0f5a30', 900: '#0c4a27' },
        gold: { 400: '#e7bb45', 500: '#dda91f', 600: '#c4921a', 700: '#a57914' },
      },
      fontFamily: {
        sans: ['var(--font-bn)', 'var(--font-en)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,16,.04), 0 6px 20px rgba(16,24,16,.06)',
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'slide-in': 'slide-in .25s ease-out',
        'slide-in-left': 'slide-in-left .25s ease-out',
        'fade-in': 'fade-in .2s ease-out',
      },
    },
  },
  plugins: [typography],
};

export default config;
