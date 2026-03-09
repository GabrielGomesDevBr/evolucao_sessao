import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      colors: {
        shell: '#f7efe7',
        ink: '#18212f',
        coral: '#ea5c4c',
        lagoon: '#0f5d5e',
        mint: '#89d6c5',
        apricot: '#f7b267',
        plum: '#724e91',
      },
      boxShadow: {
        card: '0 20px 45px rgba(24,33,47,0.08)',
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at top left, rgba(234,92,76,0.18), transparent 30%), radial-gradient(circle at top right, rgba(137,214,197,0.22), transparent 32%), linear-gradient(180deg, #fff8f1 0%, #f7efe7 100%)'
      }
    },
  },
  plugins: [],
} satisfies Config;
