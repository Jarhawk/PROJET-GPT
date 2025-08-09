import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setupTests.ts"],
    css: false,
    restoreMocks: true,
    coverage: { enabled: false },
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages")
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  }
});
