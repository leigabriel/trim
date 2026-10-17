/// <reference types="vitest" />

import { existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Capacitor refuses to sync unless the webDir contains an index.html, and Vite
 * names an HTML entry after its source file. Rather than keep the entry at
 * src/mobile/index.html — which would force every relative path in the mobile
 * tree to climb out with ../ — the source stays mobile.html and the artifact
 * is renamed once, after the bundle is written.
 *
 * Only the filename changes: the script and stylesheet references inside are
 * already root-absolute, so nothing else has to change with it.
 */
const emitIndexHtml = () => ({
  name: 'trim-emit-index-html',
  closeBundle() {
    const from = 'dist-mobile/mobile.html'
    const to = 'dist-mobile/index.html'
    if (existsSync(from)) renameSync(from, to)
  },
})

/**
 * The native app build.
 *
 * Separate from the web build on purpose. The marketing site carries the Three.js
 * hero and the 3D intro; neither exists here, so building it once and shipping it
 * to every phone would add megabytes nobody on mobile ever loads. Out dir is
 * dist-mobile, which is what capacitor.config.ts points webDir at.
 */
export default defineConfig({
  // No legacy(), unlike the web build. It emits a second ES5 copy of every
  // chunk, and no Android Webview this app targets needs it.
  plugins: [react(), emitIndexHtml()],
  // Staged by scripts/stage-mobile-public.mjs. Pointing this at the real
  // public/ would copy 207MB of hero models, background video and map tiles
  // that a phone never requests.
  publicDir: '.mobile-public',
  build: {
    outDir: 'dist-mobile',
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      // Without an explicit input Vite falls back to the root index.html and
      // quietly builds the marketing site into dist-mobile: the Three.js hero,
      // the footer map and the whole web dashboard, none of which a phone
      // loads.
      //
      // Keyed as `index` on purpose. Capacitor refuses to sync unless the
      // webDir contains an index.html, and the key is what names the emitted
      // file, so the source stays mobile.html and the artifact is index.html.
      input: {
        index: fileURLToPath(new URL('./mobile.html', import.meta.url)),
      },
      output: {
        // Function form: Vite 8 bundles with Rolldown, which rejects the object
        // form. Isolates the Supabase SDK so it caches across app updates.
        manualChunks(id: string) {
          if (id.includes('node_modules/@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
})