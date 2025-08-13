#!/bin/bash

# 环境配置脚本 - 阿里云通义万相2.2视频生成API
# 用于设置必要的环境变量和配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${BOLD}${BLUE}$1${NC}"
}

# 创建 .env 文件
create_env_file() {
    log_header "🔧 配置环境变量..."
    
    if [ -f ".env" ]; then
        log_warning ".env 文件已存在，是否覆盖？"
        read -p "覆盖现有配置？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "保持现有配置"
            return
        fi
    fi
    
    # 获取阿里云API Key
    echo ""
    log_info "请输入您的阿里云百炼平台API Key"
    log_info "获取地址: https://bailian.console.aliyun.com/api-key"
    read -p "API Key (sk-xxx): " API_KEY
    
    if [ -z "$API_KEY" ]; then
        log_error "API Key 不能为空"
        exit 1
    fi
    
    # 验证API Key格式
    if [[ ! $API_KEY =~ ^sk- ]]; then
        log_warning "API Key 格式可能不正确，通常以 'sk-' 开头"
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 创建 .env 文件
    cat > .env << EOF
# 阿里云通义万相2.2 API配置
DASHSCOPE_API_KEY=$API_KEY

# Google Cloud 项目配置
GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "your-project-id")

# Firebase 配置
FIREBASE_PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "your-project-id")

# 其他配置
NODE_ENV=production
EOF
    
    log_success ".env 文件创建完成"
}

# 设置 Google Cloud 项目
setup_gcloud_project() {
    log_header "☁️  配置 Google Cloud 项目..."
    
    # 检查当前项目
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    
    if [ -z "$CURRENT_PROJECT" ]; then
        log_warning "未设置 Google Cloud 项目"
        
        # 列出可用项目
        log_info "可用的项目："
        gcloud projects list --format="table(projectId,name,projectNumber)"
        
        echo ""
        read -p "请输入项目ID: " PROJECT_ID
        
        if [ -z "$PROJECT_ID" ]; then
            log_error "项目ID不能为空"
            exit 1
        fi
        
        gcloud config set project "$PROJECT_ID"
        log_success "项目设置为: $PROJECT_ID"
    else
        log_success "当前项目: $CURRENT_PROJECT"
        read -p "是否更换项目？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gcloud projects list --format="table(projectId,name,projectNumber)"
            echo ""
            read -p "请输入新的项目ID: " NEW_PROJECT_ID
            if [ ! -z "$NEW_PROJECT_ID" ]; then
                gcloud config set project "$NEW_PROJECT_ID"
                log_success "项目更新为: $NEW_PROJECT_ID"
            fi
        fi
    fi
}

# 启用必要的API
enable_apis() {
    log_header "🔌 启用必要的Google Cloud API..."
    
    APIS=(
        "cloudfunctions.googleapis.com"
        "cloudbuild.googleapis.com"
        "artifactregistry.googleapis.com"
        "run.googleapis.com"
        "firebase.googleapis.com"
    )
    
    for api in "${APIS[@]}"; do
        log_info "启用 $api..."
        gcloud services enable "$api" --quiet
    done
    
    log_success "所有必要的API已启用"
}

# 检查Firebase配置
check_firebase() {
    log_header "🔥 检查 Firebase 配置..."
    
    if [ -f "firebase.json" ]; then
        log_success "找到 firebase.json 配置文件"
    else
        log_warning "未找到 firebase.json，这是可选的"
    fi
    
    if [ -f "firestore.indexes.json" ]; then
        log_success "找到 Firestore 索引配置"
    else
        log_info "未找到 Firestore 索引配置，使用默认设置"
    fi
}

# 验证配置
validate_setup() {
    log_header "✅ 验证配置..."
    
    # 检查环境变量
    if [ -f ".env" ]; then
        source .env
        if [ ! -z "$DASHSCOPE_API_KEY" ]; then
            log_success "API Key 已配置 (长度: ${#DASHSCOPE_API_KEY})"
        else
            log_error "API Key 未正确配置"
            exit 1
        fi
    else
        log_error ".env 文件不存在"
        exit 1
    fi
    
    # 检查 gcloud 配置
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ ! -z "$PROJECT_ID" ]; then
        log_success "Google Cloud 项目: $PROJECT_ID"
    else
        log_error "Google Cloud 项目未配置"
        exit 1
    fi
    
    # 检查认证
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
        log_success "已认证账户: $ACCOUNT"
    else
        log_error "Google Cloud 未认证"
        exit 1
    fi
}

# 显示下一步
show_next_steps() {
    log_header "📋 配置完成！下一步操作："
    echo ""
    echo -e "${YELLOW}1. 部署服务：${NC}"
    echo -e "   ${BLUE}./deploy.sh${NC}"
    echo ""
    echo -e "${YELLOW}2. 或者使用npm命令：${NC}"
    echo -e "   ${BLUE}npm run deploy${NC}"
    echo ""
    echo -e "${YELLOW}3. 运行测试：${NC}"
    echo -e "   ${BLUE}npm run quick-test${NC}"
    echo ""
    echo -e "${YELLOW}4. 查看文档：${NC}"
    echo -e "   ${BLUE}cat README.md${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BOLD}${GREEN}"
    echo "========================================"
    echo "     环境配置脚本"
    echo "  阿里云通义万相2.2 视频生成API"
    echo "========================================"
    echo -e "${NC}"
    
    create_env_file
    setup_gcloud_project
    enable_apis
    check_firebase
    validate_setup
    
    echo ""
    log_success "🎉 环境配置完成！"
    show_next_steps
}

# 错误处理
trap 'log_error "配置过程中发生错误"; exit 1' ERR

# 运行主函数
main "$@"
