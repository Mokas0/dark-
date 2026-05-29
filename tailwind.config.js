/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0a0a0f',
        'bg-surface': '#12121a',
        'bg-panel': '#1a1a26',
        'accent-blood': '#cc2222',
        'accent-gold': '#c9a227',
        'accent-void': '#7a2fc9',
        'accent-toxic': '#2fc96a',
        'text-primary': '#e8e0d0',
        'text-dim': '#6a6a80',
        border: '#2a2a3a',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        display: ['"Major Mono Display"', '"Rubik Mono One"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(204, 34, 34, 0.4)',
        'glow-gold': '0 0 20px rgba(201, 162, 39, 0.35)',
        'glow-void': '0 0 24px rgba(122, 47, 201, 0.45)',
        'glow-toxic': '0 0 20px rgba(47, 201, 106, 0.4)',
        panel: 'inset 0 0 0 1px #2a2a3a',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '47%': { opacity: '1' },
          '48%': { opacity: '0.4' },
          '49%': { opacity: '1' },
          '50%': { opacity: '0.6' },
          '51%': { opacity: '1' },
        },
        pulseBlood: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(204, 34, 34, 0.6)' },
          '50%': { boxShadow: '0 0 24px 4px rgba(204, 34, 34, 0.2)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-1px, 1px)' },
          '40%': { transform: 'translate(-1px, -1px)' },
          '60%': { transform: 'translate(1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
        },
      },
      animation: {
        flicker: 'flicker 4s linear infinite',
        'pulse-blood': 'pulseBlood 2.5s ease-in-out infinite',
        scan: 'scan 6s linear infinite',
        glitch: 'glitch 0.4s linear infinite',
      },
    },
  },
  plugins: [],
};
