/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0C1014',
        surface: '#141A20',
        raised: '#1C242B',
        line: 'rgba(254,229,165,0.12)',
        cream: '#FEE5A5',
        body: '#EFE6D0',
        muted: '#B5AD98',
        brand: { DEFAULT: '#C01D2E', hover: '#D62B3D', deep: '#8E1421' },
        orange: '#FF9E00',
        magenta: '#D300C5',
        pink: '#F48BEC',
        danger: '#FF97A0',
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"Figtree Variable"', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { xl2: '1.125rem' },
      keyframes: {
        rise: { from: { transform: 'translateY(6px)' }, to: { transform: 'none' } },
        drawer: { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        rise: 'rise .28s ease-out',
        drawer: 'drawer .22s ease-out',
        fade: 'fade .18s ease-out',
      },
    },
  },
  plugins: [],
};
