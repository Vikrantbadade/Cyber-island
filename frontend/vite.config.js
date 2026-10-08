import { defineConfig } from 'vite';

// The game calls the relative URL /api (same origin as the page). In production nginx forwards it to the backend.
// For `npm run dev` this proxy does the same job, so no CORS and no hardcoded backend address are needed.
// Backend elsewhere? Start with:  VITE_DEV_API_TARGET=http://192.168.1.50:3000 npm run dev
const target = process.env.VITE_DEV_API_TARGET || 'http://localhost:3000';

export default defineConfig({
  server: {
    proxy: {
      '/api': { target, changeOrigin: true },
      '/admin': { target, changeOrigin: true },
    },
  },
});
