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
