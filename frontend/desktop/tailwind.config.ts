import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        secondary: { DEFAULT: '#7C3AED', 500: '#8B5CF6', 600: '#7C3AED' },
        accent: { DEFAULT: '#059669', 500: '#10B981', 600: '#059669' },
        // Agent colors
        agent: {
          discovery: '#06B6D4',
          assessment: '#8B5CF6',
          iac: '#3B82F6',
          validation: '#10B981',
          optimization: '#F59E0B',
          orchestration: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
