import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    target: "esnext",
    minify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        register: resolve(__dirname, 'register.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        }
      }
    }
  }
})
