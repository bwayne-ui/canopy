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
      },
    },
  },
  plugins: [],
};
export default config;
