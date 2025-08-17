#!/usr/bin/env node

/**
 * 修复Vercel开发环境的React/Vite问题
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 修复Vercel开发环境的React/Vite问题...\n');

// 1. 检查并修复package.json中的版本兼容性
function fixPackageVersions() {
  console.log('📦 检查并修复依赖版本...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // 修复版本兼容性
  const fixes = {
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.4',
      'vite': '^5.4.10', // 降级到稳定版本
      'eslint-plugin-react-refresh': '^0.4.14'
    }
  };
  
  let hasChanges = false;
  
  Object.keys(fixes).forEach(section => {
    if (packageJson[section]) {
      Object.keys(fixes[section]).forEach(pkg => {
        if (packageJson[section][pkg] !== fixes[section][pkg]) {
          console.log(`  ✅ 修复 ${pkg}: ${packageJson[section][pkg]} → ${fixes[section][pkg]}`);
          packageJson[section][pkg] = fixes[section][pkg];
          hasChanges = true;
        }
      });
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json 已更新');
    return true;
  } else {
    console.log('✅ 依赖版本已是最新');
    return false;
  }
}

// 2. 创建兼容的Vite配置
function createCompatibleViteConfig() {
  console.log('\n⚙️ 创建兼容的Vite配置...');
  
  const viteConfig = `import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

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
})`;

  fs.writeFileSync('vite.config.ts', viteConfig);
  console.log('✅ vite.config.ts 已更新');
}

// 3. 创建简化的index.html
function createSimpleIndexHtml() {
  console.log('\n📄 创建简化的index.html...');
  
  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Whimsy Brush - AI Video Generation</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  fs.writeFileSync('index.html', indexHtml);
  console.log('✅ index.html 已更新');
}

// 4. 创建简化的main.tsx
function createSimpleMainTsx() {
  console.log('\n🚀 创建简化的main.tsx...');
  
  const mainTsx = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 简化的入口文件，避免复杂的调试代码
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`;

  fs.writeFileSync('src/main.tsx', mainTsx);
  console.log('✅ src/main.tsx 已简化');
}

// 5. 重新安装依赖
function reinstallDependencies() {
  console.log('\n📦 重新安装依赖...');
  
  try {
    // 清理缓存
    if (fs.existsSync('node_modules')) {
      console.log('  🗑️ 清理 node_modules...');
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }
    
    if (fs.existsSync('package-lock.json')) {
      console.log('  🗑️ 清理 package-lock.json...');
      execSync('rm -f package-lock.json', { stdio: 'inherit' });
    }
    
    // 重新安装
    console.log('  📥 重新安装依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('✅ 依赖重新安装完成');
    return true;
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    return false;
  }
}

// 6. 创建启动脚本
function createStartScript() {
  console.log('\n🚀 创建启动脚本...');
  
  const startScript = `#!/bin/bash

echo "🚀 启动修复后的Vercel开发环境..."

# 停止现有的Vercel进程
pkill -f "vercel dev" || true

# 等待端口释放
sleep 2

# 设置环境变量
export NODE_ENV=development
export DASHSCOPE_API_KEY=sk-bac53038fc8e433bb2c42f394649a379
export SUPABASE_URL=https://demo-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=demo-service-key
export AUTHING_OIDC_ISSUER=https://draworld.authing.cn/oidc
export AUTHING_OIDC_AUDIENCE=676a0e3c6c9a2b2d8e9c4c5e
export TABLESTORE_INSTANCE=demo-instance

echo "✅ 环境变量已设置"
echo "🌐 启动Vercel开发服务器..."
echo "📍 访问地址: http://localhost:3000"
echo ""

# 启动Vercel开发服务器
vercel dev --listen 3000`;

  fs.writeFileSync('start-fixed-vercel.sh', startScript);
  execSync('chmod +x start-fixed-vercel.sh');
  console.log('✅ 启动脚本已创建: start-fixed-vercel.sh');
}

// 主修复流程
async function runFix() {
  try {
    console.log('🎯 开始修复Vercel开发环境问题...\n');
    
    // 执行修复步骤
    const needsReinstall = fixPackageVersions();
    createCompatibleViteConfig();
    createSimpleIndexHtml();
    createSimpleMainTsx();
    createStartScript();
    
    if (needsReinstall) {
      const installSuccess = reinstallDependencies();
      if (!installSuccess) {
        console.log('\n⚠️ 依赖安装失败，请手动运行: npm install');
      }
    }
    
    console.log('\n🎉 修复完成！');
    console.log('\n📋 下一步操作:');
    console.log('1. 停止当前的Vercel进程 (Ctrl+C)');
    console.log('2. 运行修复后的启动脚本:');
    console.log('   ./start-fixed-vercel.sh');
    console.log('');
    console.log('或者手动启动:');
    console.log('   vercel dev --listen 3000');
    console.log('');
    console.log('🌐 访问地址: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行修复
runFix();
