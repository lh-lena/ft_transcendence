import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    // TODO change back to true
  },
  assetsInclude: ["**/*.webp"],
  css: {
    devSourcemap: true, // Enable source maps for CSS
  },
});
