#!/bin/bash

echo "🚀 启动Vercel演示环境..."

# 检查Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装，正在安装..."
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo "❌ Vercel CLI安装失败，请手动安装: npm install -g vercel"
        exit 1
    fi
fi

echo "✅ Vercel CLI已安装"

# 检查项目文件
if [ ! -f "package.json" ]; then
    echo "❌ 未找到package.json，请确保在项目根目录运行"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo "❌ 未找到vercel.json配置文件"
    exit 1
fi

echo "✅ 项目文件检查通过"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo "✅ 依赖已安装"

# 显示配置信息
echo ""
echo "⚙️ Vercel演示环境配置:"
echo "  🌐 端口: 3000"
echo "  🎯 模式: 演示模式 (isDemoMode = true)"
echo "  🔑 DASHSCOPE_API_KEY: sk-bac53038fc8e433bb2c42f394649a379"
echo "  📊 数据存储: 内存存储（演示模式）"
echo "  🔐 JWT验证: 跳过验证（演示模式）"
echo "  💳 支付系统: 模拟支付"
echo "  🎬 视频生成: 真实API调用"
echo ""

# 显示访问地址
echo "🌐 访问地址:"
echo "  📱 主页（视频生成）: http://localhost:3000"
echo "  💰 积分商店: http://localhost:3000/credits"
echo "  👤 个人资料（邀请系统）: http://localhost:3000/profile"
echo "  🎨 社区画廊: http://localhost:3000/gallery"
echo "  🛡️ 审核后台: http://localhost:3000/admin/moderation"
echo "  📊 支付监控: http://localhost:3000/admin/payment-monitor"
echo ""

# 显示测试信息
echo "🧪 测试配置:"
echo "  🔑 测试Token: demo-token"
echo "  👤 新用户Token: new-user-token"
echo "  👨‍💼 管理员Token: admin-token"
echo ""

echo "🎯 功能测试清单:"
echo "  1. ✅ 邀请奖励系统 - 后端代发机制"
echo "  2. ✅ 积分系统统一 - 后端统一入账"
echo "  3. ✅ 社区后端化 - 防刷机制和社交奖励"
echo "  4. ✅ 支付集成 - 订单管理和支付宝真实链路"
echo "  5. ✅ 审核举报后台 - 内容审核系统"
echo "  6. ✅ 视频生成 - 真实通义千问API集成"
echo ""

echo "🚀 启动Vercel开发服务器..."
echo "📍 服务器将在 http://localhost:3000 启动"
echo ""

# 启动Vercel开发服务器
vercel dev --listen 3000
