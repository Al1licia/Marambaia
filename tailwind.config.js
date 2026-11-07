/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema claro. Os nomes seguem os do tema escuro: ink = fundo da página,
        // cream = texto forte, surface/raised = cartões, paper = texto sobre fundo vermelho.
        ink: '#F4EDDC',
        surface: '#FBF7EC',
        raised: '#EBE1CB',
        line: 'rgba(36,27,21,0.16)',
        cream: '#241B15',
        paper: '#FBF7EC',
        body: '#3C3027',
        muted: '#6B5D4F',
        brand: { DEFAULT: '#B3202D', hover: '#971825', deep: '#7C121C' },
        orange: '#9A4A00',
        magenta: '#A3149A',
        pink: '#8A1580',
        danger: '#B3261E',
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"Figtree Variable"', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { xl2: '0.75rem' },
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