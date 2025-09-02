import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setupTests.ts"],
    include: ["test/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: [
      "e2e/**",
      "playwright.config.*",
      "node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/.history/**",
      "**/.idea/**",
      "**/.vscode/**"
    ]
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  }
});
