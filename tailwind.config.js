/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#15803d', // Hijau tosca / fresh green toko
          600: '#166534',
          700: '#14532d',
          dark: '#0f172a', // Navy modern
          navy: '#1e293b',
          accent: '#f59e0b', // Amber aksen
        }
      }
    },
  },
  plugins: [],
}
