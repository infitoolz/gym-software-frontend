import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets', // optional
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split heavy third-party libraries into their own long-cached chunks
        // so a page only downloads the vendors it actually uses.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['apexcharts', 'react-apexcharts', 'echarts', 'echarts-for-react'],
          'vendor-calendar': ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
          'vendor-ui': ['react-bootstrap', 'bootstrap', 'sweetalert2', 'react-slick', 'slick-carousel', 'simplebar-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});