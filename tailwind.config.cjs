/* eslint-env node */

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/globals.css',
  ],
  theme: {
    extend: {
      colors: {
        mamastockBg: '#0f1c2e',
        mamastockText: '#f0f0f5',
        mamastockGold: '#bfa14d',
        mamastockGoldHover: '#a98b39',
        // Legacy hyphenated aliases for existing components
        'mamastock-bg': '#0f1c2e',
        'mamastock-text': '#f0f0f5',
        'mamastock-gold': '#bfa14d',
        'mamastock-goldHover': '#a98b39',
        'mamastock-gold-hover': '#a98b39',
        glass: 'rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        lg: '20px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.text-shadow': {
          textShadow: '0 1px 2px rgba(0,0,0,0.25)'
        }
      });
    },
  ],
};
