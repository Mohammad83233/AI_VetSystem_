/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vet-teal': '#0d9488',
        'vet-slate': '#1e293b',
      }
    },
  },
  plugins: [],
}