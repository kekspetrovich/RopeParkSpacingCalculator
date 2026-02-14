
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Базовый путь должен совпадать с названием репозитория
  base: '/RopeParkSpacingCalculator/',
  build: {
    outDir: 'dist',
  },
});
