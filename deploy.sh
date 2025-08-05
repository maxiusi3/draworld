#!/bin/bash

# 童画奇旅 (WhimsyBrush) 一键部署脚本
# 作者: MiniMax Agent
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 显示脚本标题
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    童画奇旅 (WhimsyBrush) 一键部署脚本"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装或不在PATH中"
        return 1
    fi
    return 0
}

# 环境检查
check_environment() {
    log_info "开始环境检查..."
    
    # 检查Node.js
    if check_command "node"; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 已安装: $NODE_VERSION"
        
        # 检查Node.js版本是否 >= 18
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            log_error "Node.js 版本需要 >= 18.0.0，当前版本: $NODE_VERSION"
            exit 1
        fi
    else
        log_error "请先安装 Node.js (>= 18.0.0)"
        exit 1
    fi
    
    # 检查pnpm
    if check_command "pnpm"; then
        PNPM_VERSION=$(pnpm --version)
        log_success "pnpm 已安装: $PNPM_VERSION"
    else
        log_error "请先安装 pnpm: npm install -g pnpm"
        exit 1
    fi
    
    # 检查Firebase CLI
    if check_command "firebase"; then
        FIREBASE_VERSION=$(firebase --version)
        log_success "Firebase CLI 已安装: $FIREBASE_VERSION"
    else
        log_error "请先安装 Firebase CLI: npm install -g firebase-tools"
        exit 1
    fi
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    log_success "环境检查完成"
}

# 检查Firebase登录状态
check_firebase_auth() {
    log_info "检查Firebase登录状态..."
    
    if ! firebase projects:list &> /dev/null; then
        log_warning "未登录Firebase，请先登录"
        firebase login
    fi
    
    # 获取当前项目ID
    CURRENT_PROJECT=$(firebase use --json 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g' || echo "")
    
    if [ -z "$CURRENT_PROJECT" ]; then
        log_error "未设置Firebase项目，请运行: firebase use --add"
        exit 1
    fi
    
    log_success "Firebase项目: $CURRENT_PROJECT"
}

# 安全输入密钥
read_secret() {
    local prompt="$1"
    local secret=""
    
    echo -n "$prompt"
    while IFS= read -r -s -n1 char; do
        if [[ $char == $'\0' ]]; then
            break
        elif [[ $char == $'\177' ]]; then  # 退格键
            if [ ${#secret} -gt 0 ]; then
                secret="${secret%?}"
                echo -ne '\b \b'
            fi
        else
            secret+="$char"
            echo -n "*"
        fi
    done
    echo
    echo "$secret"
}

# 配置即梦AI密钥
configure_dreamina_keys() {
    log_info "配置即梦AI API密钥..."
    
    # 检查是否已配置
    if firebase functions:config:get dreamina &> /dev/null; then
        EXISTING_CONFIG=$(firebase functions:config:get dreamina 2>/dev/null || echo "{}")
        if echo "$EXISTING_CONFIG" | grep -q "access_key_id" && echo "$EXISTING_CONFIG" | grep -q "secret_access_key"; then
            log_success "即梦AI密钥已配置"
            return 0
        fi
    fi
    
    log_warning "需要配置即梦AI API密钥"
    echo "请输入即梦AI API密钥（输入时不会显示，按回车确认）："
    
    ACCESS_KEY_ID=$(read_secret "Access Key ID: ")
    SECRET_ACCESS_KEY=$(read_secret "Secret Access Key: ")
    
    if [ -z "$ACCESS_KEY_ID" ] || [ -z "$SECRET_ACCESS_KEY" ]; then
        log_error "密钥不能为空"
        exit 1
    fi
    
    log_info "设置即梦AI API密钥..."
    firebase functions:config:set dreamina.access_key_id="$ACCESS_KEY_ID" dreamina.secret_access_key="$SECRET_ACCESS_KEY"
    
    log_success "即梦AI密钥配置完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    # 安装依赖
    log_info "安装前端依赖..."
    pnpm install
    
    # 构建生产版本
    log_info "构建生产版本..."
    pnpm run build
    
    # 检查构建结果
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        log_error "前端构建失败"
        exit 1
    fi
    
    log_success "前端构建完成"
}

# 构建Cloud Functions
build_functions() {
    log_info "构建Cloud Functions..."
    
    cd functions
    
    # 安装依赖
    log_info "安装Functions依赖..."
    npm install
    
    # 编译TypeScript
    log_info "编译TypeScript..."
    npm run build
    
    # 检查构建结果
    if [ ! -d "lib" ] || [ ! -f "lib/index.js" ]; then
        log_error "Functions构建失败"
        cd ..
        exit 1
    fi
    
    cd ..
    log_success "Cloud Functions构建完成"
}

# 部署到Firebase
deploy_to_firebase() {
    log_info "开始部署到Firebase..."
    
    # 部署所有服务
    log_info "部署所有Firebase服务..."
    firebase deploy
    
    log_success "Firebase部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."
    
    # 获取Hosting URL
    HOSTING_URL=$(firebase hosting:channel:list --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -z "$HOSTING_URL" ]; then
        # 尝试从项目信息获取
        PROJECT_ID=$(firebase use --json 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g')
        HOSTING_URL="https://${PROJECT_ID}.web.app"
    fi
    
    log_info "检查网站可访问性..."
    if curl -s --head "$HOSTING_URL" | head -n 1 | grep -q "200 OK"; then
        log_success "网站部署成功: $HOSTING_URL"
    else
        log_warning "网站可能需要几分钟才能完全生效"
        log_info "网站地址: $HOSTING_URL"
    fi
    
    # 检查Functions
    log_info "检查Cloud Functions..."
    firebase functions:list --json &> /dev/null && log_success "Cloud Functions部署成功" || log_warning "Functions状态检查失败"
}

# 显示部署结果
show_deployment_result() {
    PROJECT_ID=$(firebase use --json 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g')
    HOSTING_URL="https://${PROJECT_ID}.web.app"
    
    echo -e "${GREEN}"
    echo "=================================================="
    echo "           部署完成！"
    echo "=================================================="
    echo -e "${NC}"
    echo "🌐 网站地址: $HOSTING_URL"
    echo "🔧 Firebase控制台: https://console.firebase.google.com/project/$PROJECT_ID"
    echo ""
    echo "📋 验证清单:"
    echo "  ✅ 访问网站并测试用户注册"
    echo "  ✅ 测试图片上传功能"
    echo "  ✅ 测试AI视频生成功能"
    echo "  ✅ 检查Firebase控制台中的数据"
    echo ""
    echo "🚀 部署成功！项目已上线运行。"
}

# 错误处理和回滚
handle_error() {
    log_error "部署过程中发生错误"
    log_info "正在清理临时文件..."
    
    # 清理可能的临时文件
    [ -d "dist" ] && log_info "保留构建文件 dist/ 用于调试"
    [ -d "functions/lib" ] && log_info "保留构建文件 functions/lib/ 用于调试"
    
    log_info "如需回滚，请运行: firebase hosting:channel:delete live"
    exit 1
}

# 主函数
main() {
    # 设置错误处理
    trap 'handle_error' ERR
    
    show_banner
    
    # 确认部署
    echo -e "${YELLOW}即将开始部署童画奇旅到生产环境${NC}"
    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署流程
    check_environment
    check_firebase_auth
    configure_dreamina_keys
    build_frontend
    build_functions
    deploy_to_firebase
    verify_deployment
    show_deployment_result
    
    log_success "一键部署完成！"
}

# 运行主函数
main "$@"
