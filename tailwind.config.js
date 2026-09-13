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
          DEFAULT: '#1C1D21',
          dark: '#141518',
          light: '#2E3036'
        },
        'brand': {
          bg: '#D8DFDA',
          surface: '#FFFFFF',
          obsidian: '#1C1D21',
          'obsidian-card': '#232429',
          mint: '#98F5A6',
          'mint-hover': '#86EC94',
          'mint-dark': '#136F2D',
          lavender: '#B7A6FC',
          'lavender-dark': '#4A36B3',
          muted: '#F2F5F2',
          border: '#E3E8E3',
          text: '#1C1D21',
          subtext: '#666C68',
          blue: '#2563EB',
          'blue-hover': '#1d4ed8',
          green: '#16A34A',
          yellow: '#D97706',
          red: '#DC2626'
        }
      },
      borderRadius: {
        'squircle': '28px',
        'squircle-lg': '32px'
      }
    },
  },
  plugins: [],
}
