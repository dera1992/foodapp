import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#16A34A',
          primaryDark: '#15803D',
          primaryLight: '#DCFCE7',
          accent: '#84CC16',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#0F172A',
          muted: '#64748B',
          danger: '#DC2626',
          warning: '#F59E0B'
        }
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        cardHover: '0 16px 36px rgba(15, 23, 42, 0.12)'
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
};

export default config;
