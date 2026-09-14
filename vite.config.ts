import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 4000,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("react-router")) {
            return "vendor-react";
          }
          if (id.includes("/@tanstack/") || id.includes("/axios/")) {
            return "vendor-data";
          }
          if (id.includes("/recharts/") || id.includes("/d3-") || id.includes("/victory")) {
            return "vendor-charts";
          }
          if (id.includes("/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("/html2canvas/")) {
            return "vendor-html2canvas";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
    exclude: ["e2e/**", "node_modules/**", "src/api/**/__tests__/**", "src/api/**/*.test.ts"],
  },
}));
