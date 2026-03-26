import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        sidebar: '#1e3a8a',
        crm: {
          sidebar: '#0B1426',
          'sidebar-end': '#1B3B82',
          primary: '#2B5BF0',
          bg: '#EEF0F8',
          card: '#FFFFFF',
          border: '#E2E8F4',
          text: '#1A2332',
          muted: '#6B7A9A',
          success: '#22C55E',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
}
export default config
