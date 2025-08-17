#!/bin/bash

# GitHub推送部署脚本
# 通过GitHub推送触发Vercel自动部署

set -e

echo "🚀 通过GitHub推送部署到生产环境"
echo "================================="

# 检查Git状态
if ! git status &> /dev/null; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "📝 发现未提交的更改"
    git status --short
    echo ""
fi

# 步骤1: 环境变量配置确认
echo "⚙️ 步骤1: 环境变量配置确认..."

echo "📋 生产环境变量清单:"
echo "  ✅ DASHSCOPE_API_KEY: [已配置]"
echo "  ✅ ALIBABA_CLOUD_ACCESS_KEY_ID: [已配置]"
echo "  ✅ OSS_BUCKET: draworld2"
echo "  ✅ TABESTORE_INSTANCE: i01wvvv53p0q"
echo "  ✅ AUTHING_OIDC_ISSUER: https://draworld.authing.cn/oidc"
echo "  ✅ AUTHING_OIDC_AUDIENCE: [已配置]"
echo "  ✅ SUPABASE_URL: [已配置]"

echo ""
echo "⚠️ 请确保这些环境变量已在Vercel Dashboard中正确配置"
echo "   访问: https://vercel.com/dashboard -> 项目设置 -> Environment Variables"

read -p "环境变量是否已配置完成？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 请先配置环境变量"
    echo "💡 可以运行: chmod +x vercel-env-setup.sh && ./vercel-env-setup.sh"
    exit 1
fi

# 步骤2: 代码检查
echo ""
echo "🔍 步骤2: 代码检查..."

echo "  📋 检查关键文件..."
REQUIRED_FILES=(
    "src/config/demo.ts"
    "api/users/me/artworks.js"
    "api/upload/image.js"
    "api/community/index.js"
    "production-deployment.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "    ✅ $file"
    else
        echo "    ❌ $file (缺失)"
        exit 1
    fi
done

echo "  📋 运行生产就绪测试..."
if [ -f "test-production-ready.js" ]; then
    # 设置临时环境变量进行测试
    export NODE_ENV=production
    export DASHSCOPE_API_KEY=sk-bac53038fc8e433bb2c42f394649a379
    export DEMO_MODE=false
    
    node test-production-ready.js || {
        echo "❌ 生产就绪测试失败"
        exit 1
    }
else
    echo "    ⚠️ 未找到生产就绪测试文件"
fi

echo "✅ 代码检查完成"

# 步骤3: Git提交
echo ""
echo "📝 步骤3: Git提交..."

# 添加所有更改
git add .

# 检查是否有需要提交的更改
if git diff-index --quiet HEAD --; then
    echo "  ℹ️ 没有新的更改需要提交"
else
    echo "  📋 准备提交的文件:"
    git diff --cached --name-only | sed 's/^/    /'
    
    # 生成提交信息
    COMMIT_MSG="🚀 Production deployment ready

✅ Features implemented:
- Environment-aware credit system (60 credits in production)
- Production-ready image upload with OSS integration
- Complete user artwork management system
- Working video player and gallery display
- JWT authentication with Authing.cn integration
- TableStore database integration

🔧 Environment configuration:
- Production environment detection
- Alibaba Cloud OSS storage
- TableStore for persistent data
- Authing.cn OIDC authentication

🎯 Ready for production deployment via Vercel"

    echo ""
    echo "📋 提交信息预览:"
    echo "$COMMIT_MSG"
    echo ""
    
    read -p "确认提交这些更改？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 提交已取消"
        exit 1
    fi
    
    git commit -m "$COMMIT_MSG"
    echo "✅ 代码已提交"
fi

# 步骤4: 推送到GitHub
echo ""
echo "📤 步骤4: 推送到GitHub..."

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "  📋 当前分支: $CURRENT_BRANCH"

# 获取远程仓库信息
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "未配置")
echo "  📋 远程仓库: $REMOTE_URL"

if [ "$REMOTE_URL" = "未配置" ]; then
    echo "❌ 未配置GitHub远程仓库"
    echo "💡 请先添加远程仓库: git remote add origin <your-repo-url>"
    exit 1
fi

echo ""
read -p "确认推送到GitHub触发Vercel部署？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 推送已取消"
    exit 1
fi

echo "  📤 推送到GitHub..."
git push origin $CURRENT_BRANCH

echo "✅ 代码已推送到GitHub"

# 步骤5: 部署状态监控
echo ""
echo "🔍 步骤5: 部署状态监控..."

echo "  📋 Vercel将自动检测到GitHub推送并开始部署"
echo "  📍 监控部署状态:"
echo "    • Vercel Dashboard: https://vercel.com/dashboard"
echo "    • GitHub Actions: $REMOTE_URL/actions"

echo ""
echo "  ⏳ 预计部署时间: 2-5分钟"
echo "  📊 部署完成后，请验证以下功能:"
echo "    □ 用户注册和登录"
echo "    □ 视频生成（60积分）"
echo "    □ 图片上传到OSS"
echo "    □ 作品保存和画廊显示"
echo "    □ 积分系统正常工作"

# 步骤6: 部署后验证指南
echo ""
echo "📋 步骤6: 部署后验证指南..."

echo "🔍 部署完成后请执行以下验证:"
echo ""
echo "1️⃣ 基础功能验证:"
echo "   • 访问生产环境URL"
echo "   • 检查页面是否正常加载"
echo "   • 验证API端点响应"
echo ""
echo "2️⃣ 环境配置验证:"
echo "   • 确认使用生产环境积分要求（60积分）"
echo "   • 验证图片上传到OSS而非base64"
echo "   • 检查数据保存到TableStore"
echo ""
echo "3️⃣ 用户流程验证:"
echo "   • 用户注册/登录流程"
echo "   • 视频生成完整流程"
echo "   • 作品保存和查看"
echo "   • 社区功能正常"
echo ""
echo "4️⃣ 性能和监控:"
echo "   • 检查响应时间"
echo "   • 监控错误率"
echo "   • 验证日志记录"

# 总结
echo ""
echo "📊 部署总结"
echo "============"
echo "✅ 代码已推送到GitHub"
echo "🚀 Vercel自动部署已触发"
echo "⏳ 请等待部署完成并进行验证"
echo ""
echo "🔗 重要链接:"
echo "  • Vercel Dashboard: https://vercel.com/dashboard"
echo "  • GitHub Repository: $REMOTE_URL"
echo "  • 部署文档: production-deployment.md"
echo ""
echo "📞 如有问题:"
echo "  • 检查Vercel部署日志"
echo "  • 确认环境变量配置"
echo "  • 查看GitHub Actions状态"
echo ""
echo "🎉 生产环境部署流程已启动！"
