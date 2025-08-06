#!/bin/bash

# 修复上传图片卡住问题的脚本
# 作者: AI Assistant
# 日期: $(date)

set -e

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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令不存在，请先安装"
        exit 1
    fi
}

# 主要修复流程
main() {
    log_info "开始修复上传图片卡住问题..."
    
    # 检查必要的命令
    log_info "检查必要的工具..."
    check_command "firebase"
    check_command "npm"
    
    # 步骤1：Firebase登录
    log_info "步骤1：Firebase登录"
    echo "请在浏览器中完成Firebase登录..."
    firebase login
    
    # 步骤2：确认项目配置
    log_info "步骤2：确认项目配置"
    firebase use
    
    # 如果项目未设置，使用默认项目
    if ! firebase use 2>/dev/null; then
        log_warning "项目未设置，使用默认项目 draworld-6898f"
        firebase use draworld-6898f
    fi
    
    # 步骤3：检查当前配置
    log_info "步骤3：检查当前Firebase Functions配置"
    firebase functions:config:get || log_warning "无法获取配置，可能需要设置即梦API密钥"
    
    # 步骤4：提示配置即梦API密钥
    log_warning "如果上面没有显示即梦API配置，请运行以下命令："
    echo "firebase functions:config:set dreamina.access_key_id=\"YOUR_ACCESS_KEY_ID\""
    echo "firebase functions:config:set dreamina.secret_access_key=\"YOUR_SECRET_ACCESS_KEY\""
    echo ""
    
    # 询问是否需要配置API密钥
    read -p "是否需要现在配置即梦API密钥？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入即梦AI Access Key ID: " access_key_id
        read -p "请输入即梦AI Secret Access Key: " secret_access_key
        
        if [ -n "$access_key_id" ] && [ -n "$secret_access_key" ]; then
            log_info "设置即梦API密钥..."
            firebase functions:config:set dreamina.access_key_id="$access_key_id"
            firebase functions:config:set dreamina.secret_access_key="$secret_access_key"
            log_success "API密钥配置完成"
        else
            log_warning "密钥不能为空，跳过配置"
        fi
    fi
    
    # 步骤5：构建项目
    log_info "步骤5：构建项目"
    log_info "构建前端..."
    npm run build
    
    log_info "构建Cloud Functions..."
    cd functions
    npm run build
    cd ..
    
    # 步骤6：部署到Firebase
    log_info "步骤6：部署到Firebase"
    log_info "部署所有服务..."
    firebase deploy
    
    # 步骤7：验证部署
    log_info "步骤7：验证部署状态"
    firebase functions:list
    
    log_success "修复完成！"
    log_info "请尝试重新上传图片测试功能"
    
    # 提供调试建议
    echo ""
    log_info "如果问题仍然存在，请："
    echo "1. 打开浏览器开发者工具（F12）查看Console错误"
    echo "2. 检查Network标签页的网络请求"
    echo "3. 运行 'firebase functions:log' 查看Functions日志"
    echo "4. 确认即梦AI账户有足够的API调用额度"
}

# 错误处理
trap 'log_error "脚本执行失败，请检查错误信息"; exit 1' ERR

# 执行主函数
main "$@"
