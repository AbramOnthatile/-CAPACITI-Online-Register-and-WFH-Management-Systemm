/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F4EEFC',
          100: '#E8DCF9',
          200: '#D1B8F3',
          300: '#B794ED',
          400: '#9A6AE3',
          500: '#7E3BD9',
          600: '#6115D0',
          700: '#4F11AA',
          800: '#3D0D84',
          900: '#2B095E',
        },
        navy: '#1D2951',
        salmon: '#F25251',
        pink: '#F1D1D1',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        slate: {
          950: '#020817',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
};
