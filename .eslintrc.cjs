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
  plugins: ["react", "react-hooks"],
  settings: { react: { version: "detect" } },
  rules: {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "react/prop-types": "off"
  }
};
