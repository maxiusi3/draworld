import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(() => {
  // 动态导入开发环境中间件
  const plugins = [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: []
      }
    })
  ];

  // 生产模式不需要开发API中间件

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
      minify: 'esbuild' as const,
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