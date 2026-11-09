import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    svelte(),
    // `--mode singlefile` inlines everything into one HTML file, used for shareable previews.
    ...(mode === 'singlefile' ? [viteSingleFile()] : []),
  ],
  resolve: {
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  build: { outDir: mode === 'singlefile' ? 'dist-preview' : 'dist' },
}));
