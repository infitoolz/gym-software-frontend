import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// NOTE: Vite only auto-loads the config from the project root. The copy under
// src/config/ was never picked up (the dev server fell back to the default
// port 5173), so this root config is the one that actually takes effect.
export default defineConfig({
  plugins: [react()],
  define: {
    // Some dependencies (e.g. stompjs, sockjs-client) reference Node.js's
    // `global` object, which doesn't exist in the browser. Polyfill it to
    // `globalThis` (the standard cross-environment global object).
    global: 'globalThis',
  },
  base: '/',
  css: {
    preprocessorOptions: {
      scss: {
        // Use the modern JS-based Sass API (backed by the `sass` package).
        // The `modern-compiler` API (sass-embedded/Dart) crashes on some
        // Windows environments, so we prefer the pure-JS compiler here.
        api: 'modern',
        // Bootstrap 5.3.x still uses @import and legacy color/math built-ins,
        // which Dart Sass 1.80+ flags as deprecated. These come from the
        // dependency, not our code, so silence the noise from node_modules.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
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
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split heavy third-party libraries into their own long-cached chunks
        // so a page only downloads the vendors it actually uses.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // NOTE: do NOT put @tabler/icons-react here — naming it in manualChunks
          // forces the whole ~5000-icon package (7+ MB) into one chunk and defeats
          // tree-shaking. Left out, Rollup keeps only the icons actually imported.
          'vendor-charts': ['apexcharts', 'react-apexcharts', 'echarts', 'echarts-for-react'],
          'vendor-calendar': ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
          'vendor-forms': ['formik', 'yup', 'react-select', 'react-datepicker', 'react-dropzone', 'react-data-table-component'],
          'vendor-ui': ['react-bootstrap', 'bootstrap', 'sweetalert2', 'react-slick', 'slick-carousel', 'simplebar-react', 'framer-motion', 'styled-components'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
