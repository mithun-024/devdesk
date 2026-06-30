/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: {
          50: '#171717',
          100: '#121212',
          200: '#0c0c0c',
          300: '#060606',
          400: '#000000',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          hairline: '#1c1c1c',
          glow: 'rgba(0, 240, 255, 0.3)',
        },
        neon: {
          cyan: '#00f0ff',
          green: '#00ff66',
          amber: '#ffb800',
          pink: '#ff007f',
          purple: '#b026ff',
          lime: '#39ff14',
          sky: '#38bdf8',
        },
        accent: {
          DEFAULT: '#00f0ff',
          purple: '#b026ff',
          cyan: '#00f0ff',
          emerald: '#00ff66',
          rose: '#ff007f',
          amber: '#ffb800',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px -2px rgba(0, 240, 255, 0.35)',
        'neon-green': '0 0 15px -2px rgba(0, 255, 102, 0.35)',
        'neon-pink': '0 0 15px -2px rgba(255, 0, 127, 0.35)',
        'neon-amber': '0 0 15px -2px rgba(255, 184, 0, 0.35)',
        'neon-purple': '0 0 15px -2px rgba(176, 38, 255, 0.35)',
        'glow-sm': '0 0 12px -2px rgba(0, 240, 255, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
