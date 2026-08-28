import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", "src/**/*.test.tsx", "src/pages/**"],
    include: ["src/api/**/*.test.ts", "src/api/**/__tests__/**/*.test.ts"],
  },
});