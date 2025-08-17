#!/bin/bash

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
vercel dev --listen 3000