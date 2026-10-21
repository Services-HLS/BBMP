import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel sets VERCEL=1 — use absolute base so /report refresh loads /assets/*.js
// Capacitor local builds keep relative base for file:// WebView
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
