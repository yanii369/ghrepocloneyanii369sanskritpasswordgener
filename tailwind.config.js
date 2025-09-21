/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        devanagari: ['Noto Sans Devanagari', 'Noto Serif Devanagari', 'sans-serif'],
      }
    }
  },
  plugins: [],
};
