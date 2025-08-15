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
        'bt-blue': '#0d4f9a',
        'bt-green': '#00AA13',
        'bt-magenta': '#A72062',
        'bt-teal': '#008B87',
        'bt-yellow': '#EFB141',
        'bt-cyan': '#16B4DE',
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
  plugins: [require('@tailwindcss/typography')],
};
