#!/bin/bash

# Firebase CLI 问题诊断脚本
# 用于诊断Firebase CLI部署失败的原因

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
    echo "        Firebase CLI 问题诊断脚本"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查网络连接
check_network() {
    log_info "检查网络连接..."
    
    # 检查基本网络连接
    if ping -c 1 google.com &> /dev/null; then
        log_success "基本网络连接正常"
    else
        log_error "网络连接异常，请检查网络设置"
        return 1
    fi
    
    # 检查Firebase API连接
    if curl -s --connect-timeout 10 https://firebase.googleapis.com &> /dev/null; then
        log_success "Firebase API 可访问"
    else
        log_error "无法访问 Firebase API，可能是网络或代理问题"
        
        # 检查代理设置
        if [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ]; then
            log_info "检测到代理设置:"
            [ -n "$HTTP_PROXY" ] && echo "  HTTP_PROXY: $HTTP_PROXY"
            [ -n "$HTTPS_PROXY" ] && echo "  HTTPS_PROXY: $HTTPS_PROXY"
        fi
        
        return 1
    fi
    
    # 测试DNS解析
    if nslookup firebase.googleapis.com &> /dev/null; then
        log_success "DNS解析正常"
    else
        log_warning "DNS解析可能有问题"
    fi
}

# 检查Firebase CLI安装和版本
check_firebase_cli() {
    log_info "检查Firebase CLI..."
    
    if command -v firebase &> /dev/null; then
        FIREBASE_VERSION=$(firebase --version)
        log_success "Firebase CLI 已安装: $FIREBASE_VERSION"
        
        # 检查版本是否过旧
        VERSION_NUM=$(echo $FIREBASE_VERSION | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
        if [ -n "$VERSION_NUM" ]; then
            MAJOR_VERSION=$(echo $VERSION_NUM | cut -d'.' -f1)
            if [ "$MAJOR_VERSION" -lt 11 ]; then
                log_warning "Firebase CLI版本较旧，建议升级: npm install -g firebase-tools"
            fi
        fi
    else
        log_error "Firebase CLI 未安装，请运行: npm install -g firebase-tools"
        return 1
    fi
}

# 检查认证状态
check_authentication() {
    log_info "检查Firebase认证状态..."
    
    # 检查登录状态
    if firebase login:list &> /dev/null; then
        CURRENT_USER=$(firebase login:list 2>/dev/null | grep "✓" | head -1 | awk '{print $2}' || echo "未知")
        log_success "已登录Firebase: $CURRENT_USER"
    else
        log_error "未登录Firebase，请运行: firebase login"
        return 1
    fi
    
    # 检查项目访问权限
    if firebase projects:list &> /dev/null; then
        log_success "可以访问Firebase项目列表"
    else
        log_error "无法访问Firebase项目，可能是权限问题"
        return 1
    fi
}

# 检查项目配置
check_project_config() {
    log_info "检查项目配置..."
    
    # 检查是否设置了项目
    CURRENT_PROJECT=$(firebase use --json 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g' || echo "")
    
    if [ -n "$CURRENT_PROJECT" ]; then
        log_success "当前项目: $CURRENT_PROJECT"
        
        # 验证项目是否存在
        if firebase projects:list --json 2>/dev/null | grep -q "$CURRENT_PROJECT"; then
            log_success "项目存在且可访问"
        else
            log_error "项目不存在或无访问权限"
            return 1
        fi
    else
        log_error "未设置Firebase项目，请运行: firebase use --add"
        return 1
    fi
    
    # 检查.firebaserc文件
    if [ -f ".firebaserc" ]; then
        log_success ".firebaserc 配置文件存在"
    else
        log_warning ".firebaserc 文件不存在"
    fi
}

# 检查服务配置
check_services_config() {
    log_info "检查Firebase服务配置..."
    
    # 检查firebase.json
    if [ -f "firebase.json" ]; then
        log_success "firebase.json 配置文件存在"
        
        # 检查各服务配置
        if grep -q "hosting" firebase.json; then
            log_success "Hosting 配置已设置"
        else
            log_warning "Hosting 配置未找到"
        fi
        
        if grep -q "functions" firebase.json; then
            log_success "Functions 配置已设置"
        else
            log_warning "Functions 配置未找到"
        fi
        
        if grep -q "firestore" firebase.json; then
            log_success "Firestore 配置已设置"
        else
            log_warning "Firestore 配置未找到"
        fi
        
        if grep -q "storage" firebase.json; then
            log_success "Storage 配置已设置"
        else
            log_warning "Storage 配置未找到"
        fi
    else
        log_error "firebase.json 配置文件不存在"
        return 1
    fi
}

# 检查构建状态
check_build_status() {
    log_info "检查构建状态..."
    
    # 检查前端构建
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        log_success "前端构建文件存在"
    else
        log_warning "前端构建文件不存在，请运行: pnpm build"
    fi
    
    # 检查Functions构建
    if [ -d "functions/lib" ] && [ -f "functions/lib/index.js" ]; then
        log_success "Functions构建文件存在"
    else
        log_warning "Functions构建文件不存在，请运行: cd functions && npm run build"
    fi
}

# 运行诊断测试
run_diagnostic_tests() {
    log_info "运行诊断测试..."
    
    # 测试Firebase API调用
    log_info "测试Firebase API调用..."
    if firebase projects:list --json &> /dev/null; then
        log_success "Firebase API调用正常"
    else
        log_error "Firebase API调用失败"
        
        # 尝试详细错误信息
        log_info "获取详细错误信息..."
        firebase projects:list --debug 2>&1 | tail -10
        return 1
    fi
    
    # 测试项目特定的API调用
    if [ -n "$CURRENT_PROJECT" ]; then
        log_info "测试项目特定API..."
        if firebase functions:list --json &> /dev/null; then
            log_success "Functions API调用正常"
        else
            log_warning "Functions API调用失败，可能是权限问题"
        fi
    fi
}

# 提供解决建议
provide_solutions() {
    echo ""
    echo -e "${BLUE}=================================================="
    echo "           解决建议"
    echo "==================================================${NC}"
    
    echo -e "${YELLOW}如果遇到网络问题：${NC}"
    echo "1. 检查防火墙设置"
    echo "2. 尝试使用VPN或不同网络"
    echo "3. 设置代理: firebase --proxy-url http://proxy:port deploy"
    echo "4. 增加超时时间: firebase deploy --timeout 600s"
    echo ""
    
    echo -e "${YELLOW}如果遇到认证问题：${NC}"
    echo "1. 重新登录: firebase logout && firebase login"
    echo "2. 检查账号权限"
    echo "3. 使用服务账号进行部署"
    echo ""
    
    echo -e "${YELLOW}如果遇到构建问题：${NC}"
    echo "1. 清理缓存: rm -rf node_modules dist functions/lib"
    echo "2. 重新安装依赖: pnpm install && cd functions && npm install"
    echo "3. 重新构建: pnpm build && cd functions && npm run build"
    echo ""
    
    echo -e "${YELLOW}替代部署方案：${NC}"
    echo "1. 使用GitHub Actions进行CI/CD部署"
    echo "2. 使用Firebase控制台手动上传"
    echo "3. 使用Docker容器化部署"
    echo "4. 参考 alternative-deployment.md 文档"
}

# 主函数
main() {
    show_banner
    
    local total_errors=0
    
    # 执行各项检查
    check_network || total_errors=$((total_errors + 1))
    echo ""
    
    check_firebase_cli || total_errors=$((total_errors + 1))
    echo ""
    
    check_authentication || total_errors=$((total_errors + 1))
    echo ""
    
    check_project_config || total_errors=$((total_errors + 1))
    echo ""
    
    check_services_config || total_errors=$((total_errors + 1))
    echo ""
    
    check_build_status || total_errors=$((total_errors + 1))
    echo ""
    
    if [ $total_errors -eq 0 ]; then
        run_diagnostic_tests || total_errors=$((total_errors + 1))
    fi
    
    provide_solutions
    
    if [ $total_errors -eq 0 ]; then
        echo -e "${GREEN}✅ 诊断完成，未发现明显问题。如仍有部署问题，请查看上述解决建议。${NC}"
    else
        echo -e "${RED}❌ 发现 $total_errors 个问题，请根据上述信息进行修复。${NC}"
    fi
    
    exit $total_errors
}

# 运行主函数
main "$@"
