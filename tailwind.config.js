/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'display': ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'custom-dark': '#00034d',
        'custom-blue': '#01077c',
        'custom-purple': '#3a14b7',
        'custom-violet': '#581cd9',
        'custom-bright': '#7424f5',
        'custom-bg': '#100024',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)',
        'gradient-button': 'linear-gradient(135deg, #3a14b7 0%, #7424f5 100%)',
        'gradient-button-hover': 'linear-gradient(135deg, #581cd9 0%, #7424f5 100%)',
        'gradient-text': 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 30%, #7c3aed 60%, #6366f1 100%)',
        'gradient-card-hire': 'linear-gradient(135deg, rgba(116, 36, 245, 0.1) 0%, rgba(88, 28, 217, 0.1) 100%)',
        'gradient-card-join': 'linear-gradient(135deg, rgba(88, 28, 217, 0.1) 0%, rgba(116, 36, 245, 0.1) 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(116, 36, 245, 0.3), 0 0 40px rgba(116, 36, 245, 0.2)',
        'glow-md': '0 0 30px rgba(116, 36, 245, 0.5), 0 0 60px rgba(116, 36, 245, 0.3), 0 0 90px rgba(116, 36, 245, 0.1)',
        'glow-lg': '0 0 40px rgba(116, 36, 245, 0.15), 0 0 80px rgba(116, 36, 245, 0.1), 0 0 120px rgba(116, 36, 245, 0.05)',
      },
      dropShadow: {
        'glow': '0 0 8px rgba(116, 36, 245, 0.4)',
      },
    },
  },
  plugins: [],
};