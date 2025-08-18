module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['react-hooks', 'react-refresh', 'import'],
  extends: ['plugin:react-hooks/recommended'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'import/export': 'error',
    'import/named': 'error',
    'import/no-named-as-default': 'error',
    'import/no-extraneous-dependencies': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'vite.config.*', 'scripts/'],
};
