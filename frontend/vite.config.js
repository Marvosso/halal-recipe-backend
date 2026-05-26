import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@contracts': path.resolve(__dirname, '../shared/contracts'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces - allows mobile devices to connect
    port: 5173,
    strictPort: false,
    // Allow access from network devices
    hmr: {
      clientPort: 5173,
    },
  },
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // Ensure public directory is served
  publicDir: 'public',
});
