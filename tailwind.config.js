/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layout/*.liquid',
    './templates/*.liquid',
    './templates/**/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
    './blocks/*.liquid',
    './assets/*.js'
  ],
  theme: {
    extend: {
      animation: {
        'marquee': 'marquee var(--tw-animate-duration, 30s) linear infinite',
        'marquee-duplicate': 'marquee-duplicate var(--tw-animate-duration, 30s) linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-duplicate': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}