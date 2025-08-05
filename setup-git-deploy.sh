#!/bin/bash

# 童画奇旅 Git 仓库设置和 GitHub Actions 部署配置脚本

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
    echo "    童画奇旅 Git 仓库设置和部署配置脚本"
    echo "=================================================="
    echo -e "${NC}"
}

# 检查Git是否安装
check_git() {
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    GIT_VERSION=$(git --version)
    log_success "Git 已安装: $GIT_VERSION"
}

# 初始化Git仓库
init_git_repo() {
    log_info "初始化Git仓库..."
    
    if [ -d ".git" ]; then
        log_warning "Git仓库已存在"
        return 0
    fi
    
    git init
    log_success "Git仓库初始化完成"
}

# 创建.gitignore文件
create_gitignore() {
    log_info "创建.gitignore文件..."
    
    if [ -f ".gitignore" ]; then
        log_warning ".gitignore文件已存在"
        return 0
    fi
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
functions/node_modules/
.pnpm-store/

# Build outputs
dist/
functions/lib/
.vite/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Firebase service account (NEVER commit this!)
service-account.json
*-service-account.json

# Docker
Dockerfile.deploy
docker-deploy.sh

# Deployment scripts (optional, you may want to commit these)
# deploy.sh
# diagnose-firebase.sh
# check-config.sh
# verify-deployment.sh
EOF

    log_success ".gitignore文件创建完成"
}

# 配置Git用户信息
configure_git_user() {
    log_info "配置Git用户信息..."
    
    # 检查是否已配置
    if git config --global user.name &> /dev/null && git config --global user.email &> /dev/null; then
        CURRENT_NAME=$(git config --global user.name)
        CURRENT_EMAIL=$(git config --global user.email)
        log_success "Git用户信息已配置: $CURRENT_NAME <$CURRENT_EMAIL>"
        return 0
    fi
    
    echo "请输入Git用户信息："
    read -p "用户名: " GIT_USERNAME
    read -p "邮箱: " GIT_EMAIL
    
    if [ -n "$GIT_USERNAME" ] && [ -n "$GIT_EMAIL" ]; then
        git config --global user.name "$GIT_USERNAME"
        git config --global user.email "$GIT_EMAIL"
        log_success "Git用户信息配置完成"
    else
        log_error "用户名和邮箱不能为空"
        exit 1
    fi
}

# 添加文件到Git
add_files_to_git() {
    log_info "添加文件到Git仓库..."
    
    git add .
    
    # 检查是否有文件被添加
    if git diff --cached --quiet; then
        log_warning "没有文件需要提交"
        return 0
    fi
    
    log_success "文件已添加到Git暂存区"
}

# 创建初始提交
create_initial_commit() {
    log_info "创建初始提交..."
    
    # 检查是否已有提交
    if git rev-parse --verify HEAD &> /dev/null; then
        log_warning "Git仓库已有提交历史"
        return 0
    fi
    
    git commit -m "Initial commit: 童画奇旅(WhimsyBrush) - AI儿童绘画视频生成应用

- 完整的React + TypeScript前端应用
- Firebase Cloud Functions后端
- 即梦AI视频生成集成
- 用户认证和文件上传功能
- 响应式设计和现代UI
- 完整的部署脚本和文档"
    
    log_success "初始提交创建完成"
}

# 设置GitHub远程仓库
setup_github_remote() {
    log_info "设置GitHub远程仓库..."
    
    # 检查是否已有远程仓库
    if git remote get-url origin &> /dev/null; then
        CURRENT_REMOTE=$(git remote get-url origin)
        log_warning "远程仓库已设置: $CURRENT_REMOTE"
        
        read -p "是否要更改远程仓库地址？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    echo "请输入GitHub仓库信息："
    echo "格式示例: https://github.com/username/whimsy-brush.git"
    echo "或者: git@github.com:username/whimsy-brush.git"
    read -p "GitHub仓库URL: " GITHUB_URL
    
    if [ -n "$GITHUB_URL" ]; then
        if git remote get-url origin &> /dev/null; then
            git remote set-url origin "$GITHUB_URL"
        else
            git remote add origin "$GITHUB_URL"
        fi
        log_success "GitHub远程仓库设置完成: $GITHUB_URL"
    else
        log_warning "跳过GitHub远程仓库设置"
    fi
}

# 推送到GitHub
push_to_github() {
    log_info "推送代码到GitHub..."
    
    # 检查是否有远程仓库
    if ! git remote get-url origin &> /dev/null; then
        log_warning "未设置远程仓库，跳过推送"
        return 0
    fi
    
    # 检查是否有提交
    if ! git rev-parse --verify HEAD &> /dev/null; then
        log_warning "没有提交可推送"
        return 0
    fi
    
    echo "准备推送到GitHub..."
    read -p "确认推送？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 设置上游分支并推送
        git push -u origin main
        log_success "代码已推送到GitHub"
    else
        log_info "跳过推送，您可以稍后手动推送: git push -u origin main"
    fi
}

# 显示GitHub Actions设置说明
show_github_actions_setup() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "           GitHub Actions 部署设置"
    echo "=================================================="
    echo -e "${NC}"
    
    echo "要启用GitHub Actions自动部署，请按以下步骤操作："
    echo ""
    echo "1. 在GitHub仓库中设置以下Secrets："
    echo "   - 进入仓库 -> Settings -> Secrets and variables -> Actions"
    echo "   - 添加以下Repository secrets："
    echo ""
    echo "   📋 必需的Secrets："
    echo "   • FIREBASE_SERVICE_ACCOUNT"
    echo "     值：Firebase服务账号JSON文件的完整内容"
    echo ""
    echo "   • FIREBASE_PROJECT_ID"
    echo "     值：您的Firebase项目ID"
    echo ""
    echo "   • DREAMINA_ACCESS_KEY_ID"
    echo "     值：即梦AI的Access Key ID"
    echo ""
    echo "   • DREAMINA_SECRET_ACCESS_KEY"
    echo "     值：即梦AI的Secret Access Key"
    echo ""
    echo "2. 获取Firebase服务账号："
    echo "   - 访问Firebase控制台 -> 项目设置 -> 服务账号"
    echo "   - 点击'生成新的私钥'下载JSON文件"
    echo "   - 将整个JSON文件内容复制到FIREBASE_SERVICE_ACCOUNT"
    echo ""
    echo "3. 推送代码后，GitHub Actions将自动触发部署"
    echo ""
    echo "🚀 部署将在以下情况自动触发："
    echo "   • 推送到main分支"
    echo "   • 创建Pull Request"
    echo "   • 手动触发（Actions页面）"
}

# 主函数
main() {
    show_banner
    
    # 确认操作
    echo "此脚本将帮助您："
    echo "1. 初始化Git仓库"
    echo "2. 创建.gitignore文件"
    echo "3. 配置Git用户信息"
    echo "4. 创建初始提交"
    echo "5. 设置GitHub远程仓库"
    echo "6. 推送代码到GitHub"
    echo "7. 显示GitHub Actions设置说明"
    echo ""
    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    # 执行设置流程
    check_git
    init_git_repo
    create_gitignore
    configure_git_user
    add_files_to_git
    create_initial_commit
    setup_github_remote
    push_to_github
    show_github_actions_setup
    
    log_success "Git仓库设置完成！"
    echo ""
    echo "🎉 下一步："
    echo "1. 在GitHub上设置Secrets（参考上述说明）"
    echo "2. 推送代码将自动触发部署"
    echo "3. 查看Actions页面监控部署状态"
}

# 运行主函数
main "$@"
