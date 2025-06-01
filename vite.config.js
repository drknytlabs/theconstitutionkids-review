// vite.config.js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: './', // Use relative paths for assets
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(typeof __dirname !== "undefined" ? __dirname : ".", "src"),
    },
  },
}); 
