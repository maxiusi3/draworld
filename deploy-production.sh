#!/bin/bash

# Draworld项目生产环境部署脚本
# 安全版本 - 不包含敏感信息

set -e

echo "🚀 开始Draworld项目生产环境部署..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查Git状态
echo -e "${BLUE}📋 检查Git仓库状态...${NC}"
git status

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  发现未提交的更改${NC}"
    
    # 显示更改的文件
    echo -e "${BLUE}📝 更改的文件：${NC}"
    git status --short
    
    # 询问是否继续
    read -p "是否要提交这些更改并部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ 部署已取消${NC}"
        exit 1
    fi
    
    # 添加所有更改
    echo -e "${BLUE}📦 添加所有更改到暂存区...${NC}"
    git add .
    
    # 获取提交信息
    echo -e "${BLUE}💬 请输入提交信息：${NC}"
    read -p "提交信息: " commit_message
    
    if [[ -z "$commit_message" ]]; then
        commit_message="deploy: 更新配置并部署到Vercel生产环境"
    fi
    
    # 提交更改
    echo -e "${BLUE}📝 提交更改...${NC}"
    git commit -m "$commit_message"
    
else
    echo -e "${GREEN}✅ 工作树干净，无未提交更改${NC}"
fi

# 确认当前分支
current_branch=$(git branch --show-current)
echo -e "${BLUE}🌿 当前分支: ${current_branch}${NC}"

if [[ "$current_branch" != "main" ]]; then
    echo -e "${YELLOW}⚠️  当前不在main分支${NC}"
    read -p "是否要切换到main分支？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        git pull origin main
    else
        echo -e "${RED}❌ 自动部署需要在main分支进行${NC}"
        exit 1
    fi
fi

# 推送到远程仓库
echo -e "${BLUE}🚀 推送到远程仓库...${NC}"
git push origin main

# 获取最新提交的SHA
latest_commit=$(git rev-parse HEAD)
short_commit=${latest_commit:0:7}

echo -e "${GREEN}✅ 代码已推送到GitHub${NC}"
echo -e "${BLUE}📊 最新提交: ${short_commit}${NC}"

# 提供监控链接
echo -e "${BLUE}🔍 监控部署状态：${NC}"
echo "GitHub Actions: https://github.com/maxiusi3/draworld/actions"
echo "Vercel Dashboard: https://vercel.com/dashboard"

echo -e "${GREEN}🎉 部署流程已启动！${NC}"
echo -e "${BLUE}📱 预期部署地址: https://whimsy-brush.vercel.app${NC}"
echo -e "${YELLOW}⏱️  预计部署时间: 3-5分钟${NC}"

echo ""
echo -e "${BLUE}📋 部署完成后请验证：${NC}"
echo "  ✅ 网站访问正常"
echo "  ✅ 用户认证功能"
echo "  ✅ 积分系统（60积分生产配置）"
echo "  ✅ 图片上传到OSS"
echo "  ✅ 视频生成功能"
echo "  ✅ 数据持久化到TableStore"

echo ""
echo -e "${YELLOW}💡 提醒：请确保已在Vercel Dashboard中配置所有必需的环境变量${NC}"
