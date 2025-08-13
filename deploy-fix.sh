#!/bin/bash

# 部署修复后的 Cloud Functions
echo "🚀 开始部署修复后的 createVideoTask 函数..."

# 检查是否有 gcloud CLI
if command -v gcloud &> /dev/null; then
    echo "✅ 发现 gcloud CLI，使用 gcloud 部署"
    
    cd functions
    
    # 部署函数
    gcloud functions deploy createVideoTask \
        --runtime nodejs20 \
        --trigger-http \
        --allow-unauthenticated \
        --set-env-vars DASHSCOPE_API_KEY=sk-d6389256b79645c2a8ca5c9a6b13783c \
        --source . \
        --region us-central1 \
        --timeout 540s \
        --memory 512MB
        
    echo "✅ 部署完成！"
else
    echo "❌ 未找到 gcloud CLI"
    echo "请使用 Google Cloud Console 手动部署："
    echo "1. 上传 functions-deploy.zip"
    echo "2. 设置环境变量 DASHSCOPE_API_KEY"
    echo "3. 点击部署"
fi
