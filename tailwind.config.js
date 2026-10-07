/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  safelist: [
    // Gradients utilisés dynamiquement (rangs, matières, cycles, modes)
    { pattern: /^(from|to|via)-(stone|amber|orange|slate|zinc|yellow|emerald|teal|green|sky|blue|indigo|violet|purple|fuchsia|rose|pink|red|cyan|lime)-(300|400|500|600|700)$/ },
    { pattern: /^ring-(stone|amber|slate|zinc|emerald|violet|purple|rose|brand)-(400|500|600)\/\d+$/ }
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10B981',
          dark: '#22C55E',
          lime: '#84CC16',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857'
        },
        ink: {
          DEFAULT: '#1E293B',
          soft: '#475569',
          mute: '#64748B'
        },
        canvas: {
          light: '#FAFAFA',
          dark: '#0A0F0D',
          surface: '#111827'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Syne', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px'
      },
      boxShadow: {
        card: '0 4px 20px -8px rgba(16,185,129,0.15)',
        glow: '0 0 32px -4px rgba(34,197,94,0.4)'
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.95)' }, '50%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } }
      },
      animation: {
        pop: 'pop 0.3s ease-out',
        shake: 'shake 0.4s ease-in-out',
        slideUp: 'slideUp 0.25s ease-out'
      }
    }
  },
  plugins: []
};
