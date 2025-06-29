import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/styles': resolve(__dirname, 'src/styles'),
      '@/scripts': resolve(__dirname, 'src/scripts'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/modules': resolve(__dirname, 'src/modules')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Las variables se importan individualmente en cada archivo que las necesite
      }
    }
  }
});
