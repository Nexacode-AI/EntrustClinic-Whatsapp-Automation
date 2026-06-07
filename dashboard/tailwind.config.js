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
          50:      '#F0FDFF',
          100:     '#CFFAFE',
          200:     '#A5F3FC',
          500:     '#06B6D4',
          600:     '#0891B2',
          700:     '#0E7490',
        },
        primary: {
          DEFAULT: '#0E7490',
          dark:    '#155E75',
          light:   '#ECFEFF',
        },
        // Status colors
        success: { DEFAULT: '#10B981', light: '#ECFDF5', dark: '#059669' },
        warning: { DEFAULT: '#F59E0B', light: '#FFFBEB', dark: '#D97706' },
        danger:  { DEFAULT: '#EF4444', light: '#FFF1F2', dark: '#DC2626' },
        info:    { DEFAULT: '#3B82F6', light: '#EFF6FF', dark: '#2563EB' },

        // Queue triage
        triage: {
          normal:    '#10B981',
          urgent:    '#F59E0B',
          emergency: '#EF4444',
        },

        // Layout
        page:    '#F1F5F9',
        card:    '#FFFFFF',
        border:  '#E2E8F0',
        muted:   '#F8FAFC',
        sidebar: '#0F172A',

        ink: {
          DEFAULT:   '#0F172A',
          secondary: '#334155',
          muted:     '#64748B',
          faint:     '#94A3B8',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
        base:  ['0.875rem',  { lineHeight: '1.375rem' }],
        md:    ['0.9375rem', { lineHeight: '1.5rem' }],
        lg:    ['1rem',      { lineHeight: '1.5rem' }],
        xl:    ['1.125rem',  { lineHeight: '1.625rem' }],
        '2xl': ['1.25rem',   { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem',    { lineHeight: '2rem' }],
      },
      boxShadow: {
        xs:          '0 1px 2px 0 rgba(0,0,0,0.04)',
        card:        '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'card-lg':   '0 10px 30px -5px rgba(0,0,0,0.08)',
        modal:       '0 20px 60px -10px rgba(0,0,0,0.25)',
        focus:       '0 0 0 3px rgba(14,116,144,0.2)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-in':  'slideIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:  { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      spacing: {
        sidebar: '15rem',
        'sidebar-sm': '3.5rem',
      },
    },
  },
  plugins: [],
}
