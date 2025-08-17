#!/bin/bash

echo "🚀 启动Whimsy Brush开发服务器..."

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 检查package.json
if [ ! -f "package.json" ]; then
    echo "❌ 未找到package.json，请确保在项目根目录运行"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 设置环境变量
export NODE_ENV=development
export SUPABASE_URL=https://demo-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=demo-service-key
export AUTHING_OIDC_ISSUER=https://draworld.authing.cn/oidc
export AUTHING_OIDC_AUDIENCE=676a0e3c6c9a2b2d8e9c4c5e
export DASHSCOPE_API_KEY=sk-bac53038fc8e433bb2c42f394649a379
export TABLESTORE_INSTANCE=demo-instance

echo "✅ 环境变量已设置"
echo "🔑 DASHSCOPE_API_KEY: sk-bac53038fc8e433bb2c42f394649a379"
echo "🎯 模式: 演示模式（真实视频生成API）"

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "📍 服务器将在 http://localhost:5173 启动"
echo ""
echo "🎮 功能测试："
echo "  1. 邀请系统: http://localhost:5173/profile"
echo "  2. 积分商店: http://localhost:5173/credits"
echo "  3. 社区功能: http://localhost:5173/gallery"
echo "  4. 视频生成: http://localhost:5173/ (主页)"
echo "  5. 审核后台: http://localhost:5173/admin/moderation"
echo ""
echo "🔑 测试Token: demo-token"
echo ""

# 启动服务器
npm run dev
