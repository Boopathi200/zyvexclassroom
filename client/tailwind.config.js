/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zyvex: {
          black: '#0a0a0b',
          charcoal: '#121214',
          gold: '#c9a227',
          goldlight: '#e8d48b',
          muted: '#a1a1aa',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 40px -10px rgba(201, 162, 39, 0.35)',
        card: '0 4px 24px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, transparent, rgb(10 10 11)), radial-gradient(circle at 50% 0%, rgba(201, 162, 39, 0.12), transparent 50%)',
      },
    },
  },
  plugins: [],
};
