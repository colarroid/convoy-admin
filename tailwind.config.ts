import type { Config } from 'tailwindcss'

// Vercel Minimal Cloud — design tokens
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#171717',
        secondary: '#6B7280',
        tertiary: '#2563EB',
        neutral: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        subtle: '#F3F4F6',
        accent: '#000000',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
export default config
