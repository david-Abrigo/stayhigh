/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': {
          DEFAULT: '#003366',
          dark: '#00254a',
          light: '#00478f'
        },
        'brand': {
          blue: '#2563EB',
          'blue-hover': '#1d4ed8',
          green: '#16A34A',
          yellow: '#D97706',
          red: '#DC2626',
          bg: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
