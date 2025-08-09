module.exports = {
  root: true,
  env: { es2023: true, browser: true, node: true },
  parserOptions: { ecmaVersion: 2023, sourceType: "module", ecmaFeatures: { jsx: true } },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  plugins: ["react", "react-hooks", "react-refresh"],
  settings: { react: { version: "detect" } },
  rules: {
    // React Fast Refresh
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

    // Échapper les apostrophes/quotes dans JSX
    "react/no-unescaped-entities": "off",
    "no-irregular-whitespace": "warn",

    // Hygiène
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "react/prop-types": "off"
  }
};
