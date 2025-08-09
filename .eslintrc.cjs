module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 2023, sourceType: 'module' },
  env: { es2023: true, browser: true, node: true },
  extends: ['plugin:react/recommended', 'eslint:recommended', 'plugin:react/jsx-runtime', 'prettier'],
  plugins: ['react'],
  settings: { react: { version: 'detect' } },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react/prop-types': 'off',
    'react/no-string-refs': 'off'
  }
};
