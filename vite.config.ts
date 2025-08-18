import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// @ts-ignore - 开发环境中间件，无类型声明
import { devApiMiddleware } from "./dev-api-middleware.js"

export default defineConfig({
  base: '',
  plugins: [
    react({
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