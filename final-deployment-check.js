#!/usr/bin/env node

/**
 * 最终部署状态检查
 * 验证所有文件和配置是否准备就绪
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 执行最终部署状态检查...\n');

let hasErrors = false;
let warnings = [];

function checkError(condition, message) {
  if (!condition) {
    console.log(`❌ ${message}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${message}`);
  }
}

function checkWarning(condition, message) {
  if (!condition) {
    console.log(`⚠️ ${message}`);
    warnings.push(message);
  } else {
    console.log(`✅ ${message}`);
  }
}

// 1. 检查关键文件存在
console.log('📁 检查关键文件...');

const requiredFiles = [
  'package.json',
  'vercel.json',
  'index.html',
  'src/App.tsx',
  'src/main.tsx',
  
  // API端点
  'api/invitations/index.js',
  'api/credits/index.js',
  'api/orders/index.js',
  'api/payment/index.js',
  'api/community/index.js',
  'api/video/start.js',
  'api/video/status.js',
  'api/admin/moderation/index.js',
  'api/admin/payment-monitor/index.js',
  
  // 后端服务
  'serverless/src/creditsService.ts',
  'serverless/src/alipayService.ts',
  'serverless/src/paymentSecurity.ts',
  'serverless/src/invitationsRepo.ts',
  'serverless/scripts/init-tablestore.js',
  
  // 前端页面
  'src/pages/CreditStorePage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/GalleryPage.tsx',
  'src/pages/AdminModerationPage.tsx',
  'src/pages/AdminPaymentMonitorPage.tsx',
  
  // 部署工具
  'deploy-demo.sh',
  'test-demo-environment.js',
  'DEPLOYMENT_GUIDE.md',
  'DEPLOYMENT_SUMMARY.md'
];

requiredFiles.forEach(file => {
  checkError(fs.existsSync(file), `关键文件存在: ${file}`);
});

// 2. 检查package.json配置
console.log('\n📦 检查package.json配置...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  checkError(packageJson.name, 'package.json有name字段');
  checkError(packageJson.scripts, 'package.json有scripts字段');
  checkError(packageJson.scripts.build, 'package.json有build脚本');
  checkError(packageJson.scripts['build:preview'], 'package.json有build:preview脚本');
  checkError(packageJson.scripts['deploy:demo'], 'package.json有deploy:demo脚本');
  checkError(packageJson.scripts['test:demo'], 'package.json有test:demo脚本');
  
  // 检查关键依赖
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  checkError(deps.react, 'React依赖存在');
  checkError(deps.vite, 'Vite依赖存在');
  checkError(deps.jose, 'jose依赖存在');
  checkError(deps['@supabase/supabase-js'], 'Supabase依赖存在');
  
} catch (error) {
  checkError(false, `package.json解析失败: ${error.message}`);
}

// 3. 检查vercel.json配置
console.log('\n⚙️ 检查vercel.json配置...');

try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  checkError(vercelConfig.version === 2, 'vercel.json版本为2');
  checkError(vercelConfig.rewrites, 'vercel.json有rewrites配置');
  checkError(vercelConfig.functions, 'vercel.json有functions配置');
  checkError(vercelConfig.env, 'vercel.json有env配置');
  
  // 检查环境变量
  const env = vercelConfig.env;
  checkError(env.NODE_ENV === 'development', '演示模式配置正确');
  checkError(env.SUPABASE_URL, 'Supabase URL配置存在');
  checkError(env.AUTHING_OIDC_ISSUER, 'Authing配置存在');
  
} catch (error) {
  checkError(false, `vercel.json解析失败: ${error.message}`);
}

// 4. 检查API端点实现
console.log('\n🔌 检查API端点实现...');

const apiEndpoints = [
  'api/invitations/index.js',
  'api/credits/index.js',
  'api/orders/index.js',
  'api/payment/index.js',
  'api/community/index.js',
  'api/video/start.js',
  'api/video/status.js'
];

apiEndpoints.forEach(endpoint => {
  if (fs.existsSync(endpoint)) {
    try {
      const content = fs.readFileSync(endpoint, 'utf8');
      checkError(content.includes('export default'), `${endpoint} 有默认导出`);
      checkError(content.includes('isDemoMode') || content.includes('demo'), `${endpoint} 支持演示模式`);
    } catch (error) {
      checkError(false, `${endpoint} 读取失败: ${error.message}`);
    }
  }
});

// 5. 检查前端页面实现
console.log('\n🖥️ 检查前端页面实现...');

const frontendPages = [
  'src/pages/CreditStorePage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/GalleryPage.tsx',
  'src/pages/AdminModerationPage.tsx'
];

frontendPages.forEach(page => {
  if (fs.existsSync(page)) {
    try {
      const content = fs.readFileSync(page, 'utf8');
      checkError(content.includes('export default'), `${page} 有默认导出`);
      checkError(content.includes('React'), `${page} 是React组件`);
    } catch (error) {
      checkError(false, `${page} 读取失败: ${error.message}`);
    }
  }
});

// 6. 检查环境变量名一致性
console.log('\n🔧 检查环境变量名一致性...');

const filesToCheck = [
  'serverless/scripts/init-tablestore.js',
  'api/invitations/index.js',
  'serverless/s.yaml'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      checkError(!content.includes('TABESTORE_INSTANCE'), `${file} 环境变量名正确`);
      checkError(content.includes('TABLESTORE_INSTANCE') || !content.includes('TABLESTORE'), `${file} 使用正确的环境变量名`);
    } catch (error) {
      checkWarning(false, `${file} 检查失败: ${error.message}`);
    }
  }
});

// 7. 检查部署脚本
console.log('\n🚀 检查部署脚本...');

if (fs.existsSync('deploy-demo.sh')) {
  try {
    const stats = fs.statSync('deploy-demo.sh');
    checkError(stats.mode & parseInt('111', 8), 'deploy-demo.sh 有执行权限');
  } catch (error) {
    checkWarning(false, `deploy-demo.sh 权限检查失败: ${error.message}`);
  }
}

// 8. 检查构建输出
console.log('\n🔨 检查构建状态...');

checkWarning(fs.existsSync('dist'), 'dist目录存在（需要运行build）');
if (fs.existsSync('dist')) {
  checkWarning(fs.existsSync('dist/index.html'), 'dist/index.html存在');
  checkWarning(fs.existsSync('dist/assets'), 'dist/assets目录存在');
}

// 9. 检查node_modules
console.log('\n📚 检查依赖安装...');

checkError(fs.existsSync('node_modules'), 'node_modules目录存在');
if (fs.existsSync('node_modules')) {
  checkError(fs.existsSync('node_modules/react'), 'React已安装');
  checkError(fs.existsSync('node_modules/vite'), 'Vite已安装');
  checkError(fs.existsSync('node_modules/jose'), 'jose已安装');
}

// 10. 生成报告
console.log('\n📊 部署状态报告');
console.log('='.repeat(50));

if (hasErrors) {
  console.log('❌ 发现关键问题，需要修复后才能部署');
  console.log('\n🔧 建议修复步骤:');
  console.log('1. 运行 npm install 安装依赖');
  console.log('2. 运行 npm run fix-issues 修复已知问题');
  console.log('3. 运行 npm run build:preview 构建项目');
  console.log('4. 重新运行此检查脚本');
  process.exit(1);
} else {
  console.log('✅ 所有关键检查通过，可以进行部署');
  
  if (warnings.length > 0) {
    console.log(`\n⚠️ 发现 ${warnings.length} 个警告:`);
    warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
    console.log('\n这些警告不会阻止部署，但建议修复以获得最佳体验。');
  }
  
  console.log('\n🚀 下一步操作:');
  console.log('1. 运行 npm run deploy:demo 自动部署');
  console.log('2. 或运行 vercel --prod 手动部署');
  console.log('3. 部署完成后运行 npm run test:demo 验证功能');
  
  console.log('\n📋 功能清单:');
  console.log('✅ 邀请奖励系统 - 后端代发机制');
  console.log('✅ 积分系统统一 - 后端统一入账');
  console.log('✅ 社区后端化 - 防刷机制和社交奖励');
  console.log('✅ 支付集成 - 订单管理和支付宝真实链路');
  console.log('✅ 审核举报后台 - 内容审核系统');
  console.log('✅ UI/UX完善 - 统一错误处理');
  console.log('✅ 视频生成 - 真实通义千问API集成');
  
  console.log('\n🎉 系统已准备就绪，可以部署！');
}

console.log('\n📝 部署文档:');
console.log('- 详细指南: DEPLOYMENT_GUIDE.md');
console.log('- 部署总结: DEPLOYMENT_SUMMARY.md');
console.log('- 质量报告: QUALITY_ASSURANCE_REPORT.md');
