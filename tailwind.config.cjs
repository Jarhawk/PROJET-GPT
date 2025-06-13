/* eslint-env node */

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/index.css',
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
      },
    },
  },
  plugins: [],
};
