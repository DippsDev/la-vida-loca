import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        cobalt: {
          DEFAULT: '#0b3d91',
          deep: '#072a66',
        },
        cream: '#f5f0e6',
        blossom: '#e83e8c',
        palm: '#1f8a5f',
        reject: '#c2185b',
        ink: '#1a1a1a',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        script: ['Italianno', 'cursive'],
        display: ['"Playfair Display"', 'serif'],
      },
      letterSpacing: {
        brand: '0.12em',
      },
    },
  },
  plugins: [],
} satisfies Config
