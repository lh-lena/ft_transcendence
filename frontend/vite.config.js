import { defineConfig } from 'vite';
import { metricsPlugin } from './vite-metrics-plugin';

export default defineConfig({
  plugins: [
    metricsPlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  assetsInclude: ['**/*.webp'],
  css: {
    devSourcemap: true, // Enable source maps for CSS
  },
});