#!/bin/bash

# 阿里云通义万相2.2视频生成API - 一键部署脚本
# Author: AI Assistant
# Version: 1.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 日志函数
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

# 检查必需的工具
check_prerequisites() {
    log_header "🔍 检查部署环境..."
    
    # 检查 gcloud
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI 未安装。请先安装 Google Cloud SDK"
        log_info "安装指南: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    log_success "gcloud CLI 已安装"
    
    # 检查 node
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装。请先安装 Node.js 20+"
        exit 1
    fi
    log_success "Node.js 已安装: $(node --version)"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_success "npm 已安装: $(npm --version)"
    
    # 检查 gcloud 认证
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "gcloud 未认证。请先运行: gcloud auth login"
        exit 1
    fi
    log_success "gcloud 已认证"
    
    # 检查项目设置
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        log_error "未设置 Google Cloud 项目。请运行: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    log_success "当前项目: $PROJECT_ID"
}

# 检查环境变量
check_environment() {
    log_header "🔑 检查环境变量..."
    
    if [ -z "$DASHSCOPE_API_KEY" ]; then
        log_warning "未设置 DASHSCOPE_API_KEY 环境变量"
        read -p "请输入您的阿里云API Key (sk-xxx): " API_KEY
        if [ -z "$API_KEY" ]; then
            log_error "API Key 不能为空"
            exit 1
        fi
        export DASHSCOPE_API_KEY="$API_KEY"
    fi
    log_success "API Key 已设置 (长度: ${#DASHSCOPE_API_KEY})"
}

# 安装依赖
install_dependencies() {
    log_header "📦 安装项目依赖..."
    
    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json 文件"
        exit 1
    fi
    
    npm install
    log_success "依赖安装完成"
}

# 部署 Cloud Functions
deploy_functions() {
    log_header "🚀 部署 Cloud Functions..."
    
    # 部署创建任务函数
    log_info "部署 createVideoTask 函数..."
    gcloud functions deploy createVideoTask \
        --runtime nodejs20 \
        --trigger-http \
        --allow-unauthenticated \
        --source . \
        --entry-point createVideoTask \
        --memory 512MB \
        --timeout 540s \
        --set-env-vars DASHSCOPE_API_KEY="$DASHSCOPE_API_KEY" \
        --quiet
    
    log_success "createVideoTask 函数部署完成"
    
    # 部署查询结果函数
    log_info "部署 getVideoTaskResult 函数..."
    gcloud functions deploy getVideoTaskResult \
        --runtime nodejs20 \
        --trigger-http \
        --allow-unauthenticated \
        --source . \
        --entry-point getVideoTaskResult \
        --memory 512MB \
        --timeout 540s \
        --set-env-vars DASHSCOPE_API_KEY="$DASHSCOPE_API_KEY" \
        --quiet
    
    log_success "getVideoTaskResult 函数部署完成"
}

# 获取函数URL
get_function_urls() {
    log_header "🔗 获取函数访问地址..."
    
    CREATE_URL=$(gcloud functions describe createVideoTask --format="value(httpsTrigger.url)")
    GET_URL=$(gcloud functions describe getVideoTaskResult --format="value(httpsTrigger.url)")
    
    echo ""
    log_success "部署完成！函数访问地址："
    echo -e "${GREEN}📝 创建任务: ${BOLD}$CREATE_URL${NC}"
    echo -e "${GREEN}📋 查询结果: ${BOLD}$GET_URL${NC}"
    echo ""
}

# 运行测试
run_test() {
    log_header "🧪 运行功能测试..."
    
    if [ -f "quick_test.js" ]; then
        log_info "运行快速测试..."
        node quick_test.js
    else
        log_warning "未找到测试文件，跳过测试"
    fi
}

# 显示后续步骤
show_next_steps() {
    log_header "📋 后续步骤"
    echo ""
    echo -e "${YELLOW}1. 如果测试失败（免费额度用完），请开通付费模式：${NC}"
    echo -e "   ${BLUE}• 访问: https://bailian.console.aliyun.com/${NC}"
    echo -e "   ${BLUE}• 关闭'仅使用免费额度'选项${NC}"
    echo -e "   ${BLUE}• 详细指南: ./enable_paid_mode.md${NC}"
    echo ""
    echo -e "${YELLOW}2. 常用命令：${NC}"
    echo -e "   ${BLUE}• 查看日志: npm run logs:create${NC}"
    echo -e "   ${BLUE}• 运行测试: npm run quick-test${NC}"
    echo -e "   ${BLUE}• 查看状态: npm run status${NC}"
    echo ""
    echo -e "${YELLOW}3. 文档参考：${NC}"
    echo -e "   ${BLUE}• README.md - 完整使用文档${NC}"
    echo -e "   ${BLUE}• ALIYUN_WANXIANG_SETUP_GUIDE.md - 详细设置指南${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BOLD}${GREEN}"
    echo "========================================"
    echo "  阿里云通义万相2.2 视频生成API"
    echo "         一键部署脚本"
    echo "========================================"
    echo -e "${NC}"
    
    check_prerequisites
    check_environment
    install_dependencies
    deploy_functions
    get_function_urls
    
    echo ""
    log_success "🎉 部署完成！"
    
    # 询问是否运行测试
    read -p "是否运行功能测试？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_test
    fi
    
    show_next_steps
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查上述输出"; exit 1' ERR

# 运行主函数
main "$@"
