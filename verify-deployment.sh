#!/bin/bash

# 童画奇旅 (WhimsyBrush) 部署验证脚本
# 用于验证部署后的服务状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示标题
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "        童画奇旅部署验证脚本"
    echo "=================================================="
    echo -e "${NC}"
}

# 获取项目信息
get_project_info() {
    PROJECT_ID=$(firebase use --json 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g' || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "无法获取Firebase项目ID，请确保已设置项目"
        exit 1
    fi
    
    HOSTING_URL="https://${PROJECT_ID}.web.app"
    CONSOLE_URL="https://console.firebase.google.com/project/$PROJECT_ID"
    
    log_info "项目ID: $PROJECT_ID"
    log_info "网站地址: $HOSTING_URL"
}

# 检查网站可访问性
check_hosting() {
    log_info "检查网站可访问性..."
    
    # 检查HTTP状态码
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOSTING_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "网站可正常访问 (HTTP $HTTP_STATUS)"
        
        # 检查页面内容
        CONTENT=$(curl -s "$HOSTING_URL" | head -20)
        if echo "$CONTENT" | grep -q "童画奇旅\|WhimsyBrush"; then
            log_success "页面内容正确"
        else
            log_warning "页面内容可能不正确"
        fi
    else
        log_error "网站无法访问 (HTTP $HTTP_STATUS)"
        return 1
    fi
}

# 检查Cloud Functions
check_functions() {
    log_info "检查Cloud Functions状态..."
    
    # 获取Functions列表
    FUNCTIONS_OUTPUT=$(firebase functions:list --json 2>/dev/null || echo "[]")
    
    if echo "$FUNCTIONS_OUTPUT" | grep -q "createVideoTask"; then
        log_success "createVideoTask 函数已部署"
    else
        log_error "createVideoTask 函数未找到"
        return 1
    fi
    
    if echo "$FUNCTIONS_OUTPUT" | grep -q "getUserVideoTasks"; then
        log_success "getUserVideoTasks 函数已部署"
    else
        log_error "getUserVideoTasks 函数未找到"
        return 1
    fi
    
    # 检查函数配置
    CONFIG_OUTPUT=$(firebase functions:config:get 2>/dev/null || echo "{}")
    if echo "$CONFIG_OUTPUT" | grep -q "dreamina"; then
        log_success "即梦AI配置已设置"
    else
        log_warning "即梦AI配置可能未设置"
    fi
}

# 检查Firestore规则
check_firestore() {
    log_info "检查Firestore配置..."
    
    if [ -f "firestore.rules" ]; then
        log_success "Firestore安全规则文件存在"
        
        # 检查规则内容
        if grep -q "users\|videoTasks" firestore.rules; then
            log_success "安全规则包含必要的集合配置"
        else
            log_warning "安全规则可能不完整"
        fi
    else
        log_error "Firestore安全规则文件不存在"
        return 1
    fi
}

# 检查Storage规则
check_storage() {
    log_info "检查Storage配置..."
    
    if [ -f "storage.rules" ]; then
        log_success "Storage安全规则文件存在"
    else
        log_error "Storage安全规则文件不存在"
        return 1
    fi
}

# 运行基本功能测试
run_basic_tests() {
    log_info "运行基本功能测试..."
    
    # 测试静态资源
    ASSETS_URL="${HOSTING_URL}/images/hero-child-drawing.jpg"
    ASSETS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ASSETS_URL" || echo "000")
    
    if [ "$ASSETS_STATUS" = "200" ]; then
        log_success "静态资源可正常访问"
    else
        log_warning "静态资源访问异常 (HTTP $ASSETS_STATUS)"
    fi
    
    # 测试API端点（简单检查）
    API_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net/createVideoTask"
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")
    
    if [ "$API_STATUS" = "400" ] || [ "$API_STATUS" = "401" ]; then
        log_success "API端点响应正常 (需要认证)"
    elif [ "$API_STATUS" = "200" ]; then
        log_success "API端点可访问"
    else
        log_warning "API端点状态异常 (HTTP $API_STATUS)"
    fi
}

# 显示验证结果
show_results() {
    echo -e "${GREEN}"
    echo "=================================================="
    echo "           验证完成"
    echo "=================================================="
    echo -e "${NC}"
    echo "🌐 网站地址: $HOSTING_URL"
    echo "🔧 Firebase控制台: $CONSOLE_URL"
    echo ""
    echo "📋 手动验证建议:"
    echo "  1. 访问网站并检查页面加载"
    echo "  2. 测试用户注册和登录功能"
    echo "  3. 测试图片上传功能"
    echo "  4. 测试AI视频生成功能"
    echo "  5. 检查Firebase控制台中的数据"
    echo ""
    echo "🔍 如发现问题，请检查Firebase控制台的日志"
}

# 主函数
main() {
    show_banner
    
    # 检查是否在项目目录
    if [ ! -f "firebase.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    get_project_info
    
    echo "开始验证部署状态..."
    echo ""
    
    # 执行各项检查
    check_hosting
    check_functions
    check_firestore
    check_storage
    run_basic_tests
    
    echo ""
    show_results
    
    log_success "部署验证完成！"
}

# 运行主函数
main "$@"
