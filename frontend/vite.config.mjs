import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      // Disable HMR in production-like environments
      // Or configure it to work through nginx proxy
      clientPort: 443,
      protocol: 'wss',
      host: 'localhost',
    },
  },
  assetsInclude: ["**/*.webp"],
  css: {
    devSourcemap: true, // Enable source maps for CSS
  },
});
