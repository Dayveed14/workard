import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, /api goes to the Express server so cookies stay same-origin
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
