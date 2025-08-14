module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-control-regex': 'off', // (temporaire si besoin)
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'vite.config.*', 'scripts/'],
};
