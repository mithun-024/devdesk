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
        background: '#16161e',
        tokyo: {
          canvas: '#16161e',
          elevated: '#1a1b26',
          card: '#1f2335',
          hover: '#24283b',
          active: '#292e42',
          border: '#292e42',
          borderHighlight: '#3b4261',
          text: '#c0caf5',
          subtext: '#9aa5ce',
          muted: '#565f89',
          cyan: '#7dcfff',
          blue: '#7aa2f7',
          purple: '#bb9af7',
          green: '#9ece6a',
          teal: '#73daca',
          orange: '#ff9e64',
          yellow: '#e0af68',
          red: '#f7768e',
        },
        surface: {
          50: '#24283b',
          100: '#1f2335',
          200: '#1a1b26',
          300: '#16161e',
          400: '#13131a',
        },
        border: {
          subtle: '#292e42',
          hairline: '#24283b',
          glow: 'rgba(125, 207, 255, 0.25)',
        },
        neon: {
          cyan: '#7dcfff',
          green: '#9ece6a',
          amber: '#ff9e64',
          pink: '#f7768e',
          purple: '#bb9af7',
          blue: '#7aa2f7',
          teal: '#73daca',
        },
        accent: {
          DEFAULT: '#7dcfff',
          purple: '#bb9af7',
          cyan: '#7dcfff',
          blue: '#7aa2f7',
          emerald: '#9ece6a',
          rose: '#f7768e',
          amber: '#ff9e64',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 16px -2px rgba(125, 207, 255, 0.3)',
        'neon-green': '0 0 16px -2px rgba(158, 206, 106, 0.3)',
        'neon-pink': '0 0 16px -2px rgba(247, 118, 142, 0.3)',
        'neon-amber': '0 0 16px -2px rgba(255, 158, 100, 0.3)',
        'neon-purple': '0 0 16px -2px rgba(187, 154, 247, 0.3)',
        'glow-sm': '0 0 12px -2px rgba(125, 207, 255, 0.2)',
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
