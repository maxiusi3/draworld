#!/bin/bash

# Vercel环境变量配置脚本
# 自动配置生产环境所需的所有环境变量

echo "🔧 配置Vercel生产环境变量..."

# 检查Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装，请运行: npm i -g vercel"
    exit 1
fi

# 登录检查
if ! vercel whoami &> /dev/null; then
    echo "🔑 请先登录Vercel..."
    vercel login
fi

echo "📋 设置生产环境变量..."

# 核心API密钥
vercel env add DASHSCOPE_API_KEY production <<< "sk-bac53038fc8e433bb2c42f394649a379"

# 阿里云配置
vercel env add ALIBABA_CLOUD_ACCESS_KEY_ID production <<< "YOUR_ALIBABA_CLOUD_ACCESS_KEY_ID"
vercel env add ALIBABA_CLOUD_ACCESS_KEY_SECRET production <<< "YOUR_ALIBABA_CLOUD_ACCESS_KEY_SECRET"
vercel env add OSS_REGION production <<< "oss-cn-hangzhou"
vercel env add OSS_BUCKET production <<< "draworld2"
vercel env add TABESTORE_INSTANCE production <<< "i01wvvv53p0q"

# Authing.cn OIDC配置
vercel env add AUTHING_OIDC_ISSUER production <<< "https://draworld.authing.cn/oidc"
vercel env add AUTHING_OIDC_AUDIENCE production <<< "689adde75ecb97cd396860eb"

# Supabase配置
vercel env add SUPABASE_URL production <<< "https://encdblxyxztvfxotfuyh.supabase.co"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2RibHh5eHp0dmZ4b3RmdXloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg2ODUwOSwiZXhwIjoyMDY5NDQ0NTA5fQ.g5oB17nJ9vwAlbB9YbU6Gq9Q2z4G9dDW7nSdUEXxrNs"

# 环境标识
vercel env add NODE_ENV production <<< "production"
vercel env add DEMO_MODE production <<< "false"

echo "✅ 环境变量配置完成！"
echo ""
echo "📋 已配置的环境变量："
echo "  ✅ DASHSCOPE_API_KEY (通义万相API)"
echo "  ✅ ALIBABA_CLOUD_ACCESS_KEY_ID (阿里云访问密钥)"
echo "  ✅ ALIBABA_CLOUD_ACCESS_KEY_SECRET (阿里云访问密钥)"
echo "  ✅ OSS_REGION (OSS区域)"
echo "  ✅ OSS_BUCKET (OSS存储桶)"
echo "  ✅ TABESTORE_INSTANCE (TableStore实例)"
echo "  ✅ AUTHING_OIDC_ISSUER (认证发行者)"
echo "  ✅ AUTHING_OIDC_AUDIENCE (认证受众)"
echo "  ✅ SUPABASE_URL (Supabase地址)"
echo "  ✅ SUPABASE_SERVICE_ROLE_KEY (Supabase服务密钥)"
echo "  ✅ NODE_ENV (环境标识)"
echo "  ✅ DEMO_MODE (演示模式控制)"
echo ""
echo "🚀 现在可以推送代码触发部署了！"
