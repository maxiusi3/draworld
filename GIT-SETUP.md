# Git 仓库设置和 GitHub Actions 部署指南

由于您的项目还没有初始化为Git仓库，本文档将指导您完成Git设置和GitHub Actions自动部署配置。

## 🚀 一键设置（推荐）

运行自动化设置脚本：

```bash
./setup-git-deploy.sh
```

这个脚本会自动完成：
- ✅ 初始化Git仓库
- ✅ 创建.gitignore文件
- ✅ 配置Git用户信息
- ✅ 创建初始提交
- ✅ 设置GitHub远程仓库
- ✅ 推送代码到GitHub
- ✅ 显示GitHub Actions设置说明

## 📋 手动设置步骤

如果您想手动设置，请按以下步骤操作：

### 1. 初始化Git仓库

```bash
# 初始化Git仓库
git init

# 设置默认分支为main
git branch -M main
```

### 2. 配置Git用户信息（如果未配置）

```bash
git config --global user.name "您的姓名"
git config --global user.email "您的邮箱"
```

### 3. 创建.gitignore文件

```bash
# 创建.gitignore文件
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
functions/node_modules/
.pnpm-store/

# Build outputs
dist/
functions/lib/

# Environment variables
.env*

# Firebase
.firebase/
firebase-debug.log
service-account.json

# Logs
*.log

# OS files
.DS_Store
Thumbs.db
EOF
```

### 4. 添加文件并创建初始提交

```bash
# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit: 童画奇旅(WhimsyBrush) AI儿童绘画视频生成应用"
```

### 5. 创建GitHub仓库

1. 访问 [GitHub](https://github.com)
2. 点击右上角的 "+" -> "New repository"
3. 仓库名称：`whimsy-brush`（或您喜欢的名称）
4. 描述：`童画奇旅 - AI儿童绘画视频生成应用`
5. 选择 "Public" 或 "Private"
6. **不要**勾选 "Add a README file"（因为我们已有文件）
7. 点击 "Create repository"

### 6. 连接本地仓库到GitHub

```bash
# 添加远程仓库（替换为您的GitHub用户名和仓库名）
git remote add origin https://github.com/YOUR_USERNAME/whimsy-brush.git

# 推送代码
git push -u origin main
```

## ⚙️ GitHub Actions 自动部署设置

### 1. 获取Firebase服务账号

1. 访问 [Firebase Console](https://console.firebase.google.com)
2. 选择您的项目
3. 点击齿轮图标 -> "项目设置"
4. 切换到"服务账号"标签
5. 点击"生成新的私钥"
6. 下载JSON文件并保存

### 2. 设置GitHub Secrets

1. 在GitHub仓库页面，点击 "Settings"
2. 在左侧菜单中选择 "Secrets and variables" -> "Actions"
3. 点击 "New repository secret" 添加以下密钥：

#### 必需的Secrets：

| Secret名称 | 值 | 说明 |
|-----------|-----|------|
| `FIREBASE_SERVICE_ACCOUNT` | 完整的JSON文件内容 | Firebase服务账号密钥 |
| `FIREBASE_PROJECT_ID` | 您的Firebase项目ID | 如：whimsy-brush-prod |
| `DREAMINA_ACCESS_KEY_ID` | 即梦AI Access Key ID | 从即梦AI控制台获取 |
| `DREAMINA_SECRET_ACCESS_KEY` | 即梦AI Secret Access Key | 从即梦AI控制台获取 |

#### 可选的Secrets：

| Secret名称 | 值 | 说明 |
|-----------|-----|------|
| `FIREBASE_TOKEN` | Firebase CI Token | 如果服务账号不工作时使用 |

### 3. 获取Firebase CI Token（可选）

如果服务账号方式不工作，可以使用CI Token：

```bash
# 安装Firebase CLI（如果未安装）
npm install -g firebase-tools

# 生成CI Token
firebase login:ci
```

将生成的token添加到GitHub Secrets中的 `FIREBASE_TOKEN`。

### 4. 触发自动部署

设置完成后，以下操作会自动触发部署：

- ✅ 推送代码到 `main` 分支
- ✅ 创建Pull Request
- ✅ 在Actions页面手动触发

### 5. 监控部署状态

1. 在GitHub仓库页面点击 "Actions" 标签
2. 查看部署工作流的运行状态
3. 点击具体的运行记录查看详细日志

## 🔧 故障排除

### 问题1：推送被拒绝

```bash
# 如果遇到推送被拒绝，可能是分支保护或权限问题
git push --force-with-lease origin main
```

### 问题2：GitHub Actions失败

1. 检查Secrets是否正确设置
2. 查看Actions日志中的错误信息
3. 确认Firebase项目权限
4. 验证即梦AI密钥是否有效

### 问题3：服务账号权限不足

确保服务账号具有以下角色：
- Firebase Admin
- Cloud Functions Admin
- Storage Admin
- Hosting Admin

### 问题4：即梦AI配置失败

1. 验证密钥格式是否正确
2. 检查密钥是否有效
3. 确认API配额是否充足

## 📞 获取帮助

如果遇到问题：

1. **查看GitHub Actions日志**：详细的错误信息
2. **运行本地诊断**：`./diagnose-firebase.sh`
3. **使用替代方案**：参考 `alternative-deployment.md`
4. **检查文档**：`DEPLOYMENT.md` 和 `SCRIPTS.md`

## 🎉 部署成功后

部署成功后，您将看到：
- 🌐 网站地址：`https://your-project-id.web.app`
- 🔧 Firebase控制台链接
- ✅ 所有服务的部署状态

现在您可以：
1. 访问网站测试功能
2. 在Firebase控制台查看数据
3. 继续开发新功能
4. 享受自动化部署的便利！

---

**下一步**：运行 `./setup-git-deploy.sh` 开始设置，或按照手动步骤逐步配置。
