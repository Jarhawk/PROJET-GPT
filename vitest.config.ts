import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setupTests.ts"],
    alias: { "@": path.resolve(__dirname, "src") }
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  }
});
