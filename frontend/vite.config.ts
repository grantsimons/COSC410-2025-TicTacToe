import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
    css: true,
    coverage: {
      provider: "c8",                // or 'istanbul'
      reporter: ["text", "html"],    // show in terminal + generate HTML
      reportsDirectory: "coverage",  // folder where HTML will be generated
      all: true,                      // include all files, not just tested ones
    },
  },
});
