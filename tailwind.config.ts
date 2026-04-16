import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lighthouse: {
          green: '#00C97B',
          teal: '#1B3A4B',
          signal: '#00A866',
          glow: '#E6F9F0',
        },
        brand: {
          DEFAULT: '#00AA6C',
          hover:   '#008F5A',
          light:   '#F0FBF6',
          ink:     '#005868',
          inkDeep: '#004747',
        },
        canopy: {
          bg:      '#FAFAFA',
          surface: '#FFFFFF',
          muted:   '#f3f4f6',
          border:  '#e5e7eb',
          text:    '#1a1a1a',
          sub:     '#6b7280',
          faint:   '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};
export default config;
