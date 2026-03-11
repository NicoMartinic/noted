/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fdfcf7',
          100: '#f9f6ed',
          200: '#f0ead6',
        },
        ink: {
          900: '#1a1410',
          800: '#2c231a',
          700: '#3d3226',
          600: '#5c4d3c',
          500: '#7a6655',
          400: '#a08878',
        },
        amber: {
          accent: '#c8820a',
          light: '#f0a830',
          muted: '#e8c77a',
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(26,20,16,0.08), 0 0 1px rgba(26,20,16,0.06)',
        'card-hover': '0 8px 24px rgba(26,20,16,0.12), 0 0 1px rgba(26,20,16,0.08)',
        'modal': '0 24px 64px rgba(26,20,16,0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
