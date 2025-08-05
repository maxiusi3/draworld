# 童画奇旅 (WhimsyBrush) 部署指南

本文档提供了完整的部署指南，帮助您将童画奇旅部署到 Firebase 平台。

## 🚀 一键部署（推荐）

我们提供了自动化的一键部署脚本，可以自动完成所有部署步骤。

### 快速开始

```bash
# 1. 确保在项目根目录
cd whimsy-brush

# 2. 运行一键部署脚本
./deploy.sh
```

### 脚本功能

一键部署脚本 `deploy.sh` 包含以下功能：

- ✅ **环境检查**：自动验证 Node.js、pnpm、Firebase CLI
- ✅ **配置管理**：交互式设置即梦AI API密钥
- ✅ **自动构建**：构建前端和 Cloud Functions
- ✅ **一键部署**：部署所有 Firebase 服务
- ✅ **部署验证**：自动验证部署状态
- ✅ **错误处理**：完善的错误处理和回滚机制

### 使用要求

在运行一键部署脚本前，请确保：

1. **已安装必要工具**：
   ```bash
   # 安装 pnpm
   npm install -g pnpm

   # 安装 Firebase CLI
   npm install -g firebase-tools
   ```

2. **已登录 Firebase**：
   ```bash
   firebase login
   ```

3. **已设置 Firebase 项目**：
   ```bash
   firebase use --add
   # 选择您的 Firebase 项目
   ```

4. **准备即梦AI API密钥**：
   - Access Key ID
   - Secret Access Key

### 部署流程

运行 `./deploy.sh` 后，脚本将自动执行以下步骤：

1. **环境检查** - 验证所有必要工具和配置
2. **密钥配置** - 安全地设置即梦AI API密钥
3. **前端构建** - 安装依赖并构建生产版本
4. **Functions构建** - 编译 TypeScript 并构建 Cloud Functions
5. **Firebase部署** - 部署所有服务到 Firebase
6. **部署验证** - 检查部署状态并提供访问链接

### 部署完成后

部署成功后，脚本会显示：
- 🌐 网站访问地址
- 🔧 Firebase 控制台链接
- 📋 验证清单

---

## 📖 手动部署指南

如果您需要手动控制部署过程，可以按照以下详细步骤操作：

## 前置条件

### 软件要求
- Node.js 18.0.0 或更高版本
- pnpm 包管理器
- Firebase CLI
- Git

### 帐户要求
- Google 账户（用于 Firebase）
- 即梦AI API 账户和密钥

## 步骤 1：环境准备

### 1.1 安装必要工具

```bash
# 安装 pnpm
npm install -g pnpm

# 安装 Firebase CLI
npm install -g firebase-tools

# 验证安装
firebase --version
pnpm --version
node --version
```

### 1.2 获取项目代码

```bash
# 克隆项目（或下载压缩包）
git clone <your-repository-url>
cd whimsy-brush

# 安装依赖
pnpm install

# 安装 Cloud Functions 依赖
cd functions
npm install
cd ..
```

## 步骤 2：Firebase 项目设置

### 2.1 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com)
2. 点击“创建项目”
3. 输入项目名称（如：`whimsy-brush-prod`）
4. 选择是否启用 Google Analytics（可选）
5. 点击“创建项目”

### 2.2 启用 Firebase 服务

#### Authentication
1. 在 Firebase Console 中选择您的项目
2. 进入“Authentication” > “Sign-in method”
3. 启用以下登录方式：
   - **电子邮件/密码**：启用
   - **Google**：启用，设置项目公开名称
4. 在“授权域”中添加您的域名（如：`yourdomain.com`）

#### Firestore Database
1. 进入“Firestore Database”
2. 点击“创建数据库”
3. 选择“以生产模式启动”
4. 选择数据库位置（建议选择距离用户较近的区域）

#### Storage
1. 进入“Storage”
2. 点击“开始使用”
3. 选择安全规则模式（选择“以生产模式启动”）
4. 选择存储位置

#### Functions
1. 进入“Functions”
2. 点击“开始使用”
3. 选择付费计划（Blaze 计划，支持外部 API 调用）

### 2.3 获取 Firebase 配置

1. 在 Firebase Console 中，点击“项目设置”（齿轮图标）
2. 滚动到“您的应用”部分
3. 点击“添加应用” > “Web”
4. 输入应用名称，选择“同时为此应用设置 Firebase Hosting”
5. 点击“注册应用”
6. 复制配置对象

### 2.4 更新项目配置

编辑 `src/config/firebase.ts` 文件：

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 步骤 3：即梦AI API 配置

### 3.1 获取 API 密钥
1. 登录 [即梦AI 控制台](https://console.volcengine.com)
2. 创建 API 密钥，获取 `AccessKeyID` 和 `SecretAccessKey`

### 3.2 设置环境变量

```bash
# 登录 Firebase
firebase login

# 选择项目
firebase use --add
# 选择您刚创建的项目，输入别名（如：production）

# 设置即梦AI API 密钥
firebase functions:config:set dreamina.access_key_id="YOUR_ACCESS_KEY_ID"
firebase functions:config:set dreamina.secret_access_key="YOUR_SECRET_ACCESS_KEY"

# 验证配置
firebase functions:config:get
```

## 步骤 4：构建和部署

### 4.1 构建项目

```bash
# 构建前端
pnpm build

# 构建 Cloud Functions
cd functions
npm run build
cd ..
```

### 4.2 部署到 Firebase

```bash
# 初次部署（所有服务）
firebase deploy

# 或者分别部署
firebase deploy --only firestore:rules    # 部署数据库规则
firebase deploy --only firestore:indexes  # 部署数据库索引
firebase deploy --only storage:rules      # 部署存储规则
firebase deploy --only functions          # 部署 Cloud Functions
firebase deploy --only hosting            # 部署前端
```

### 4.3 验证部署

1. **检查部署状态**
   ```bash
   firebase hosting:channel:list
   firebase functions:list
   ```

2. **访问网站**
   - 访问 Firebase Console 中显示的 Hosting URL
   - 或使用 `firebase open hosting:site`

3. **测试功能**
   - 用户注册和登录
   - 图片上传
   - AI 视频生成

## 步骤 5：域名配置（可选）

### 5.1 添加自定义域名

1. 在 Firebase Console 中进入“Hosting”
2. 点击“添加自定义域”
3. 输入您的域名（如：`app.yourdomain.com`）
4. 按照指示配置 DNS 记录

### 5.2 更新 Authentication 域名

1. 进入“Authentication” > “Settings” > “Authorized domains”
2. 添加您的自定义域名

## 步骤 6：监控和维护

### 6.1 设置监控

1. **Functions 监控**
   - 在 Firebase Console 中查看 Functions 日志
   - 设置告警阈值

2. **成本监控**
   - 监控 Functions 执行次数
   - 监控 Storage 使用量
   - 监控 Firestore 读写次数

### 6.2 定期维护

```bash
# 更新依赖
pnpm update
cd functions && npm update && cd ..

# 更新部署
pnpm build
cd functions && npm run build && cd ..
firebase deploy
```

## 🔧 Firebase CLI 问题诊断与替代方案

### Firebase CLI 常见失败原因分析

#### 1. 网络连接问题
**症状**：
- `Error: Failed to make request to https://firebase.googleapis.com`
- `ETIMEDOUT` 或 `ECONNRESET` 错误
- 部署过程中断或超时

**诊断步骤**：
```bash
# 测试网络连接
curl -I https://firebase.googleapis.com
ping firebase.googleapis.com

# 检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 测试Firebase API连接
firebase projects:list --debug
```

**解决方案**：
```bash
# 方案1：设置代理（如果在企业网络环境）
firebase --proxy-url http://proxy.company.com:8080 deploy

# 方案2：增加超时时间
firebase deploy --timeout 600s

# 方案3：使用不同的网络环境
# 尝试使用手机热点或其他网络
```

#### 2. 认证和权限问题
**症状**：
- `Error: HTTP Error: 401, Request had invalid authentication credentials`
- `Error: HTTP Error: 403, The caller does not have permission`
- `Error: Not logged in`

**诊断步骤**：
```bash
# 检查登录状态
firebase login:list

# 检查当前用户权限
firebase projects:list

# 检查项目权限
firebase use --add
```

**解决方案**：
```bash
# 重新登录
firebase logout
firebase login --reauth

# 使用服务账号（推荐用于CI/CD）
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
firebase deploy --token "$(gcloud auth print-access-token)"
```

#### 3. 项目配置问题
**症状**：
- `Error: No project active`
- `Error: Invalid project id`
- 部署到错误的项目

**诊断步骤**：
```bash
# 检查当前项目
firebase use

# 检查.firebaserc文件
cat .firebaserc

# 验证项目存在
firebase projects:list | grep your-project-id
```

#### 4. 构建和依赖问题
**症状**：
- Functions部署失败
- 前端构建错误
- 依赖版本冲突

**诊断步骤**：
```bash
# 检查Node.js版本
node --version

# 检查Functions构建
cd functions && npm run build

# 检查前端构建
pnpm build
```

### 🔧 一键部署故障排除

### 脚本执行权限问题

**问题**：`Permission denied: ./deploy.sh`

**解决**：
```bash
chmod +x deploy.sh
./deploy.sh
```

### Node.js 版本问题

**问题**：`Node.js 版本需要 >= 18.0.0`

**解决**：
```bash
# 使用 nvm 升级 Node.js
nvm install 18
nvm use 18

# 或使用官方安装包
# 访问 https://nodejs.org 下载最新版本
```

### Firebase 登录问题

**问题**：`未登录Firebase，请先登录`

**解决**：
```bash
firebase login
# 按提示完成登录流程
```

### 项目配置问题

**问题**：`未设置Firebase项目`

**解决**：
```bash
firebase use --add
# 选择您的 Firebase 项目
```

### 即梦AI密钥配置问题

**问题**：密钥输入错误或为空

**解决**：
1. 确保从即梦AI控制台获取正确的密钥
2. 重新运行脚本并仔细输入密钥
3. 如需重新配置：
   ```bash
   firebase functions:config:unset dreamina
   ./deploy.sh
   ```

### 构建失败问题

**问题**：前端或 Functions 构建失败

**解决**：
```bash
# 清理缓存
rm -rf node_modules dist functions/node_modules functions/lib
pnpm install
cd functions && npm install && cd ..

# 重新运行部署
./deploy.sh
```

### 部署超时问题

**问题**：部署过程中网络超时

**解决**：
```bash
# 设置更长的超时时间
firebase deploy --timeout 600s

# 或分别部署各个服务
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only storage
```

---

## 📖 手动部署故障排除

### 问题 1：Functions 部署失败

**原因**：可能是付费计划问题或权限问题

**解决**：
```bash
# 检查项目计划
firebase projects:list

# 切换到 Blaze 计划
# 在 Firebase Console 中升级计划

# 重新部署
firebase deploy --only functions
```

### 问题 2：环境变量访问失败

**原因**：环境变量未正确设置

**解决**：
```bash
# 检查环境变量
firebase functions:config:get

# 重新设置
firebase functions:config:set dreamina.access_key_id="YOUR_KEY"
firebase functions:config:set dreamina.secret_access_key="YOUR_SECRET"

# 重新部署
firebase deploy --only functions
```

### 问题 3：CORS 错误

**原因**：域名未添加到授权列表

**解决**：
1. 在 Firebase Console 中进入 Authentication
2. 在“授权域”中添加您的域名

### 问题 4：构建失败

**原因**：依赖问题或 TypeScript 错误

**解决**：
```bash
# 清理缓存
pnpm clean
rm -rf node_modules package-lock.json
pnpm install

# 检查 TypeScript 错误
npx tsc --noEmit

# 重新构建
pnpm build
```

## 安全注意事项

1. **API 密钥保护**
   - 绝不在代码中硬编码密钥
   - 定期轮换 API 密钥

2. **Firebase 规则**
   - 定期检查 Firestore 和 Storage 安全规则
   - 限制用户访问权限

3. **监控告警**
   - 设置费用告警
   - 监控异常访问

## 联系支持

如果在部署过程中遇到问题，请：

1. 检查 Firebase Console 中的日志
2. 查看浏览器控制台错误
3. 参考 [Firebase 文档](https://firebase.google.com/docs)
4. 联系技术支持：support@whimsybrush.com

---

祝您部署成功！🎉