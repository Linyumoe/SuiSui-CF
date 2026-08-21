import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { fileURLToPath } from 'url'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [Vue({
    template: {
      transformAssetUrls,
    },
  }), Vuetify({ autoImport: true }), viteCompression({ algorithm: 'gzip' }), viteCompression({ algorithm: 'brotliCompress' })],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 3000, proxy: { "/api": process.env.VITE_API_PROXY || "http://localhost:3742", "/uploads": process.env.VITE_API_PROXY || "http://localhost:3742" } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/vuetify")) return "vuetify"
          if (id.includes("node_modules/marked")) return "marked"
          if (id.includes("node_modules/highlight.js")) return "highlight"
          if (id.includes("node_modules/emojibase-data")) return "emoji"
          if (id.includes("node_modules/vue") || id.includes("node_modules/pinia") || id.includes("node_modules/dompurify") || id.includes("node_modules/vue-router")) return "vendor"
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
