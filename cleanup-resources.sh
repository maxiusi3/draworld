#!/bin/bash
# 清理之前创建的阿里云资源

echo "🧹 开始清理之前创建的阿里云资源..."

# 设置阿里云 CLI 配置
export ALIYUN_ACCESS_KEY_ID="${ALIYUN_ACCESS_KEY_ID}"
export ALIYUN_ACCESS_KEY_SECRET="${ALIYUN_ACCESS_KEY_SECRET}"
export ALIYUN_REGION="cn-hangzhou"

# 安装阿里云 CLI（如果需要）
if ! command -v aliyun &> /dev/null; then
    echo "📦 安装阿里云 CLI..."
    wget https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
    tar -xzf aliyun-cli-linux-latest-amd64.tgz
    sudo mv aliyun /usr/local/bin/
fi

# 配置阿里云 CLI
echo "⚙️ 配置阿里云 CLI..."
aliyun configure set \
  --profile default \
  --mode AK \
  --region cn-hangzhou \
  --access-key-id "$ALIYUN_ACCESS_KEY_ID" \
  --access-key-secret "$ALIYUN_ACCESS_KEY_SECRET"

echo "🗑️ 删除 FC 服务..."
# 删除 FC 服务（会自动删除函数和触发器）
aliyun fc DELETE /services/tonghua-world-svc --region cn-hangzhou || echo "FC 服务可能不存在"

echo "🗑️ 删除日志项目..."
# 删除日志项目
aliyun sls DeleteProject --project-name tonghua-world-svc-logs --region cn-hangzhou || echo "日志项目可能不存在"

echo "🗑️ 删除 RAM 角色..."
# 删除 RAM 角色策略附加
aliyun ram DetachPolicyFromRole --PolicyName AliyunFCInvocationAccess --PolicyType System --RoleName tonghua-world-svc-fc-role || echo "策略附加可能不存在"
aliyun ram DetachPolicyFromRole --PolicyName AliyunLogFullAccess --PolicyType System --RoleName tonghua-world-svc-fc-role || echo "策略附加可能不存在"
aliyun ram DetachPolicyFromRole --PolicyName AliyunOSSFullAccess --PolicyType System --RoleName tonghua-world-svc-fc-role || echo "策略附加可能不存在"
aliyun ram DetachPolicyFromRole --PolicyName AliyunOTSFullAccess --PolicyType System --RoleName tonghua-world-svc-fc-role || echo "策略附加可能不存在"

# 删除 RAM 角色
aliyun ram DeleteRole --RoleName tonghua-world-svc-fc-role || echo "RAM 角色可能不存在"

echo "🗑️ 删除 OSS 存储桶..."
# 删除 OSS 存储桶（如果存在）
aliyun oss rm oss://draworld2025 -r -f || echo "OSS 存储桶 draworld2025 可能不存在"
aliyun oss rm oss://draworld2 -r -f || echo "OSS 存储桶 draworld2 可能不存在"

echo "✅ 资源清理完成！"
echo "现在可以重新运行 Terraform 部署了。"
