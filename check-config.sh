#!/bin/bash

# 童画奇旅 (WhimsyBrush) 配置检查脚本
# 用于检查部署前的配置完整性

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
    echo "        童画奇旅配置检查脚本"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查文件是否存在
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        log_success "$description 存在: $file"
        return 0
    else
        log_error "$description 不存在: $file"
        return 1
    fi
}

# 检查目录是否存在
check_directory() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        log_success "$description 存在: $dir"
        return 0
    else
        log_error "$description 不存在: $dir"
        return 1
    fi
}

# 检查项目结构
check_project_structure() {
    log_info "检查项目结构..."
    
    local errors=0
    
    # 检查根目录文件
    check_file "package.json" "前端包配置文件" || ((errors++))
    check_file "firebase.json" "Firebase配置文件" || ((errors++))
    check_file "firestore.rules" "Firestore安全规则" || ((errors++))
    check_file "storage.rules" "Storage安全规则" || ((errors++))
    check_file "vite.config.ts" "Vite配置文件" || ((errors++))
    check_file "tsconfig.json" "TypeScript配置文件" || ((errors++))
    
    # 检查目录结构
    check_directory "src" "源代码目录" || ((errors++))
    check_directory "functions" "Cloud Functions目录" || ((errors++))
    check_directory "public" "静态资源目录" || ((errors++))
    
    # 检查Functions配置
    check_file "functions/package.json" "Functions包配置文件" || ((errors++))
    check_file "functions/tsconfig.json" "Functions TypeScript配置" || ((errors++))
    check_file "functions/src/index.ts" "Functions入口文件" || ((errors++))
    
    if [ $errors -eq 0 ]; then
        log_success "项目结构检查通过"
    else
        log_error "项目结构检查失败，发现 $errors 个问题"
    fi
    
    return $errors
}

# 检查Firebase配置
check_firebase_config() {
    log_info "检查Firebase配置..."
    
    local errors=0
    
    # 检查firebase.json内容
    if [ -f "firebase.json" ]; then
        if grep -q "hosting" firebase.json && grep -q "functions" firebase.json; then
            log_success "Firebase配置包含必要的服务"
        else
            log_error "Firebase配置缺少必要的服务配置"
            ((errors++))
        fi
    fi
    
    # 检查Firebase项目设置
    if command -v firebase &> /dev/null; then
        PROJECT_ID=$(firebase use --json 2>/dev/null | grep -o '"[^"]*"' | head -1 | sed 's/"//g' || echo "")
        if [ -n "$PROJECT_ID" ]; then
            log_success "Firebase项目已设置: $PROJECT_ID"
        else
            log_warning "Firebase项目未设置，请运行: firebase use --add"
            ((errors++))
        fi
    else
        log_error "Firebase CLI未安装"
        ((errors++))
    fi
    
    return $errors
}

# 检查依赖配置
check_dependencies() {
    log_info "检查依赖配置..."
    
    local errors=0
    
    # 检查前端依赖
    if [ -f "package.json" ]; then
        if grep -q "react" package.json && grep -q "firebase" package.json; then
            log_success "前端依赖配置正确"
        else
            log_error "前端依赖配置不完整"
            ((errors++))
        fi
    fi
    
    # 检查Functions依赖
    if [ -f "functions/package.json" ]; then
        if grep -q "firebase-functions" functions/package.json && grep -q "firebase-admin" functions/package.json; then
            log_success "Functions依赖配置正确"
        else
            log_error "Functions依赖配置不完整"
            ((errors++))
        fi
    fi
    
    # 检查node_modules
    if [ -d "node_modules" ]; then
        log_success "前端依赖已安装"
    else
        log_warning "前端依赖未安装，请运行: pnpm install"
    fi
    
    if [ -d "functions/node_modules" ]; then
        log_success "Functions依赖已安装"
    else
        log_warning "Functions依赖未安装，请运行: cd functions && npm install"
    fi
    
    return $errors
}

# 检查安全规则
check_security_rules() {
    log_info "检查安全规则..."
    
    local errors=0
    
    # 检查Firestore规则
    if [ -f "firestore.rules" ]; then
        if grep -q "users\|videoTasks" firestore.rules; then
            log_success "Firestore安全规则包含必要的集合"
        else
            log_warning "Firestore安全规则可能不完整"
        fi
    else
        log_error "Firestore安全规则文件不存在"
        ((errors++))
    fi
    
    # 检查Storage规则
    if [ -f "storage.rules" ]; then
        log_success "Storage安全规则文件存在"
    else
        log_error "Storage安全规则文件不存在"
        ((errors++))
    fi
    
    return $errors
}

# 检查环境变量和密钥
check_environment_config() {
    log_info "检查环境配置..."
    
    local errors=0
    
    # 检查Firebase Functions配置
    if command -v firebase &> /dev/null; then
        CONFIG_OUTPUT=$(firebase functions:config:get 2>/dev/null || echo "{}")
        if echo "$CONFIG_OUTPUT" | grep -q "dreamina"; then
            log_success "即梦AI配置已设置"
        else
            log_warning "即梦AI配置未设置，部署时需要配置"
        fi
    fi
    
    return $errors
}

# 显示检查结果
show_results() {
    local total_errors=$1
    
    echo ""
    echo -e "${BLUE}=================================================="
    echo "           配置检查完成"
    echo "==================================================${NC}"
    
    if [ $total_errors -eq 0 ]; then
        echo -e "${GREEN}✅ 所有检查项目通过，可以开始部署！${NC}"
        echo ""
        echo "🚀 运行部署命令:"
        echo "   ./deploy.sh"
    else
        echo -e "${RED}❌ 发现 $total_errors 个问题，请修复后再部署${NC}"
        echo ""
        echo "🔧 修复建议:"
        echo "   1. 检查上述错误信息"
        echo "   2. 确保所有必要文件存在"
        echo "   3. 运行 pnpm install 安装依赖"
        echo "   4. 设置Firebase项目: firebase use --add"
    fi
}

# 主函数
main() {
    show_banner
    
    # 检查是否在项目目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    local total_errors=0
    
    # 执行各项检查
    check_project_structure || total_errors=$((total_errors + $?))
    echo ""
    
    check_firebase_config || total_errors=$((total_errors + $?))
    echo ""
    
    check_dependencies || total_errors=$((total_errors + $?))
    echo ""
    
    check_security_rules || total_errors=$((total_errors + $?))
    echo ""
    
    check_environment_config || total_errors=$((total_errors + $?))
    
    show_results $total_errors
    
    exit $total_errors
}

# 运行主函数
main "$@"
