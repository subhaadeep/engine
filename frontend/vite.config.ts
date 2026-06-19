import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    // Large file uploads: no body size limit on proxy
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        // Allow large CSV/OHLCV uploads without proxy cutting them
        configure: (proxy) => {
          proxy.on('error', (err) => console.error('[proxy error]', err.message));
        },
      },
    },
  },
  // Allow up to 512 MB file uploads in dev
  // (actual backend limit is set in FastAPI)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
});
