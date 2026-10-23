/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--color-primary-100-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700-rgb) / <alpha-value>)',
        },
        ink: {
          900: 'rgb(var(--color-ink-900-rgb) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700-rgb) / <alpha-value>)',
          500: 'rgb(var(--color-ink-500-rgb) / <alpha-value>)',
          300: 'rgb(var(--color-ink-300-rgb) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        card: 'rgb(var(--color-card-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        'success-soft': 'rgb(var(--color-success-soft-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        'warning-soft': 'rgb(var(--color-warning-soft-rgb) / <alpha-value>)',
        danger: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        'danger-soft': 'rgb(var(--color-danger-soft-rgb) / <alpha-value>)',
        info: 'rgb(var(--color-info-rgb) / <alpha-value>)',
        'info-soft': 'rgb(var(--color-info-soft-rgb) / <alpha-value>)',
        navy: 'rgb(var(--color-ink-900-rgb) / <alpha-value>)',
        salmon: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        pink: 'rgb(var(--color-primary-100-rgb) / <alpha-value>)',
        slate: {
          950: '#020817',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        soft: 'var(--shadow-card)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
    },
  },
  plugins: [],
};
