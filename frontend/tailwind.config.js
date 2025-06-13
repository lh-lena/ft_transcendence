/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
             'spin-slow': 'spin 5s linear infinite', // Longer duration
           },
    },
  },
  plugins: [],
}