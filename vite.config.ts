import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { devApiMiddleware } from "./dev-api-middleware.js"

export default defineConfig({
  base: '',
  plugins: [
    react({
      // 禁用快速刷新以避免兼容性问题
      fastRefresh: false,
      jsxRuntime: 'automatic',
      // 添加babel配置
      babel: {
        plugins: []
      }
    }),
    devApiMiddleware(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.html"],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      port: 3001,
      overlay: false
    }
  },
  build: {
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})