#!/bin/bash

# 生产环境部署脚本
# 自动化部署Whimsy Brush到生产环境

set -e  # 遇到错误立即退出

echo "🚀 Whimsy Brush 生产环境部署脚本"
echo "=================================="

# 检查必需的工具
echo "🔍 检查部署工具..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI 未安装，请运行: npm i -g vercel"; exit 1; }

echo "✅ 部署工具检查完成"

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"

# 步骤1: 环境变量检查
echo ""
echo "⚙️ 步骤1: 环境变量检查..."

REQUIRED_ENV_VARS=(
    "DASHSCOPE_API_KEY"
    "ALIBABA_CLOUD_ACCESS_KEY_ID"
    "ALIBABA_CLOUD_ACCESS_KEY_SECRET"
    "OSS_REGION"
    "OSS_BUCKET"
    "TABESTORE_INSTANCE"
    "AUTHING_OIDC_ISSUER"
    "AUTHING_OIDC_AUDIENCE"
)

MISSING_VARS=()

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "⚠️ 以下环境变量未设置:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   • $var"
    done
    echo ""
    echo "请在Vercel Dashboard中设置这些环境变量，或者创建.env.local文件"
    echo "参考 production-deployment.md 文档"
    
    read -p "是否继续部署？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
else
    echo "✅ 所有必需的环境变量已设置"
fi

# 步骤2: 代码质量检查
echo ""
echo "🔍 步骤2: 代码质量检查..."

echo "  📋 检查依赖..."
npm audit --audit-level=high || {
    echo "⚠️ 发现高危安全漏洞，建议修复后再部署"
    read -p "是否继续部署？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
}

echo "  📋 运行测试..."
if [ -f "test-production-ready.js" ]; then
    node test-production-ready.js || {
        echo "❌ 生产就绪测试失败"
        exit 1
    }
else
    echo "⚠️ 未找到生产就绪测试文件"
fi

echo "✅ 代码质量检查完成"

# 步骤3: 构建检查
echo ""
echo "🔨 步骤3: 构建检查..."

echo "  📋 清理构建缓存..."
rm -rf .next
rm -rf .vercel

echo "  📋 安装依赖..."
npm ci

echo "  📋 构建项目..."
npm run build || {
    echo "❌ 项目构建失败"
    exit 1
}

echo "✅ 构建检查完成"

# 步骤4: 部署确认
echo ""
echo "🎯 步骤4: 部署确认..."

echo "📋 部署信息:"
echo "  • 项目: Whimsy Brush"
echo "  • 环境: 生产环境"
echo "  • 目标: Vercel"
echo "  • 分支: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "  • 提交: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

read -p "确认部署到生产环境？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 1
fi

# 步骤5: 执行部署
echo ""
echo "🚀 步骤5: 执行部署..."

echo "  📤 部署到Vercel..."
vercel --prod || {
    echo "❌ Vercel部署失败"
    exit 1
}

echo "✅ 部署完成"

# 步骤6: 部署后验证
echo ""
echo "🔍 步骤6: 部署后验证..."

echo "  ⏳ 等待部署生效..."
sleep 10

# 获取部署URL
DEPLOYMENT_URL=$(vercel ls --scope=$(vercel whoami) | grep "whimsy-brush" | head -1 | awk '{print $2}')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "  📍 部署URL: https://$DEPLOYMENT_URL"
    
    echo "  📋 验证基本功能..."
    
    # 检查首页
    if curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL" | grep -q "200"; then
        echo "    ✅ 首页访问正常"
    else
        echo "    ❌ 首页访问异常"
    fi
    
    # 检查API端点
    if curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/api/credits?action=balance" -H "Authorization: Bearer test-token" | grep -q "200\|401"; then
        echo "    ✅ API端点正常"
    else
        echo "    ❌ API端点异常"
    fi
    
else
    echo "  ⚠️ 无法获取部署URL，请手动验证"
fi

# 步骤7: 部署总结
echo ""
echo "📊 部署总结"
echo "============"

echo "✅ 部署成功完成！"
echo ""
echo "🔗 重要链接:"
if [ -n "$DEPLOYMENT_URL" ]; then
    echo "  • 生产环境: https://$DEPLOYMENT_URL"
    echo "  • 管理面板: https://vercel.com/dashboard"
fi

echo ""
echo "📋 部署后检查清单:"
echo "  □ 访问生产环境URL确认页面正常"
echo "  □ 测试用户注册和登录功能"
echo "  □ 验证视频生成功能"
echo "  □ 检查积分系统是否使用生产配置(60积分)"
echo "  □ 确认图片上传使用OSS存储"
echo "  □ 测试作品保存和画廊显示"
echo "  □ 检查监控和日志系统"

echo ""
echo "⚠️ 重要提醒:"
echo "  • 确保所有环境变量在Vercel中正确设置"
echo "  • 监控应用性能和错误率"
echo "  • 定期备份用户数据"
echo "  • 关注安全更新和漏洞修复"

echo ""
echo "📞 支持信息:"
echo "  • 部署文档: production-deployment.md"
echo "  • 测试脚本: test-production-ready.js"
echo "  • 问题反馈: GitHub Issues"

echo ""
echo "🎉 Whimsy Brush 生产环境部署完成！"
