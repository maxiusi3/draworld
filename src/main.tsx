import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'
import { videoService } from './services/videoService'
import { taskFixer } from './utils/taskFixer'

// 在开发环境中暴露服务到全局作用域，方便调试
if (import.meta.env.DEV) {
  (window as any).videoService = videoService;
  (window as any).taskFixer = taskFixer;
  console.log('🛠️ 调试工具已加载到全局作用域:');
  console.log('- videoService: 视频服务');
  console.log('- taskFixer: 任务修复工具');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
