/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0E7490',
          dark:    '#155E75',
          light:   '#ECFEFF',
          muted:   '#CFFAFE',
        },
        page:   '#F1F5F9',
        card:   '#FFFFFF',
        border: '#E2E8F0',
        muted:  '#F8FAFC',
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted:     '#94A3B8',
        },
      },
    },
  },
  plugins: [],
}
