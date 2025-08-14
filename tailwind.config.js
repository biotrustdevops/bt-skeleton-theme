/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/layout/*.liquid",
    "./src/templates/*.liquid",
    "./src/templates/**/*.liquid",
    "./src/sections/*.liquid",
    "./src/snippets/*.liquid",
    "./src/blocks/*.liquid",
    "./src/assets/*.js",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0D4F9A',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      animation: {
        marquee: "marquee var(--tw-animate-duration, 30s) linear infinite",
        "marquee-duplicate":
          "marquee-duplicate var(--tw-animate-duration, 30s) linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "marquee-duplicate": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};
