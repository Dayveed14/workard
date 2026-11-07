import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // React, the router and the icons change rarely: their own file, cached by browsers
        // between Workard updates. (The video-meeting libraries stay in the meeting room's file.)
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|lucide-react)\//.test(id)) return 'vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    // In dev, /api goes to the Express server so cookies stay same-origin
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
