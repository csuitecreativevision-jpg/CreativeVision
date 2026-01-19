/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'custom-dark': '#00034d',
        'custom-blue': '#01077c',
        'custom-purple': '#3a14b7',
        'custom-violet': '#581cd9',
        'custom-bright': '#7424f5',
        'custom-bg': '#100024',
      },
    },
  },
  plugins: [],
};