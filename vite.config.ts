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
          // CORREÇÃO 2026-09-16: recharts NÃO vai mais em vendor-charts separado.
          // Achado real: manualChunks separando recharts+d3 de react criava uma
          // referência circular com TDZ ("Cannot access 'P' before initialization")
          // no chunk vendor-charts — a app inteira crashava na carga (tela branca,
          // nenhuma rota renderizava). O Rollup resolve a circular dentro do
          // bundle somente se as bibliotecas não forem forçadas a chunks manuais.
          // doc: recharts foi removido do manualChunks → fica no bundle principal.
          // if (id.includes("/recharts/") || id.includes("/d3-") || id.includes("/victory")) {
          //   return "vendor-charts";
          // }
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
    // 5s (default) estourava em MatchPage sob carga: 24 arquivos em
    // paralelo. Falhou 1 de 10 rodadas com 6/6 passando isolado — ou seja,
    // flake, não regressão. Timeout curto demais vira falso vermelho, e
    // falso vermelho treina a ignorar o build. 15s cobre a máquina lenta
    // de CI sem mascarar hang de verdade.
    testTimeout: 15000,
    exclude: ["e2e/**", "node_modules/**", "src/api/**/__tests__/**", "src/api/**/*.test.ts"],
  },
}));
