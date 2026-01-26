import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Listen on all addresses for Codespaces
    hmr: {
      // Use polling for HMR in Codespaces (more reliable)
      clientPort: 443, // Codespaces uses 443 for forwarded ports
      protocol: 'wss', // Secure WebSocket for Codespaces
    },
    watch: {
      usePolling: true, // More reliable file watching in containers
      interval: 1000, // Check every second
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle these dependencies for faster cold start
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'clsx',
      'lucide-react',
      'recharts',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
