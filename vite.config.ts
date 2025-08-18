import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  // 动态导入开发环境中间件
  const plugins = [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: []
      }
    })
  ];

  // 只在开发环境中添加API中间件
  if (isDev) {
    try {
      const { devApiMiddleware } = require("./dev-api-middleware.js");
      plugins.push(devApiMiddleware());
    } catch (error) {
      console.warn('Dev API middleware not available:', (error as Error).message);
    }
  }

  return {
    base: '',
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
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
      sourcemap: false, // 生产环境关闭sourcemap以减小文件大小
      target: 'es2015', // 更兼容的目标
      minify: 'esbuild',
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
  };
});