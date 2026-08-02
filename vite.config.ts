import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          maxSize: 450_000,
          groups: [
            { name: "three-core", test: /node_modules[\\/]three[\\/]/, priority: 3, maxSize: 450_000 },
            { name: "react-three", test: /node_modules[\\/]@react-three[\\/]/, priority: 2, maxSize: 450_000 },
            { name: "markdown", test: /node_modules[\\/](react-markdown|prism-react-renderer|unified|remark-|micromark)/, priority: 2, maxSize: 350_000 },
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 2, maxSize: 350_000 },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**"],
    css: true,
    restoreMocks: true,
  },
});
