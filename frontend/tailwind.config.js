/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
             'spin-slow': 'spin 5s linear infinite',
             'pulse-gold': 'pulse-gold 2.5s ease-in-out infinite',
             'pulse-black': 'pulse-black 2.5s ease-in-out infinite', // New animation
           },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { backgroundColor: '#ffffff' },
          '50%': { backgroundColor: '#FFCF40' },
        },
        'pulse-black': {
          '0%, 100%': { backgroundColor: '#ffffff', color: '#000000' },
          '50%': { backgroundColor: '#000000', color: '#ffffff' },
        }
      }
    },
  },
  plugins: [],
}