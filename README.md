# 童画奇旅 (WhimsyBrush)

[![Deploy Status](https://github.com/maxiusi3/draworld/workflows/Deploy%20WhimsyBrush%20to%20Firebase/badge.svg)](https://github.com/maxiusi3/draworld/actions)

一个将儿童绘画作品转化为生动动画视频的AI应用。

> 🚀 **最新更新**：已配置GitHub Actions自动部署，推送代码即可自动更新网站！

## 功能特性

- 🎨 **图片上传与编辑**: 支持 JPG、PNG、HEIC 格式，内置裁切和旋转功能
- ✨ **AI 视频生成**: 基于即梦AI技术，生成5秒高清动画
- 🎵 **多种音乐风格**: 支持欢快、温馨、史诗、神秘、宁静五种风格
- 📱 **响应式设计**: 适配桌面端和移动端
- 🔒 **用户认证**: 支持邮箱注册和 Google 登录
- 💾 **云存储**: 基于 Firebase 的安全存储
- 🚀 **即时分享**: 支持视频下载和分享功能

## 技术栈

### 前端
- **React 18** + **TypeScript** - 现代化的前端框架
- **Vite** - 快速的构建工具
- **TailwindCSS** - 实用的CSS框架
- **React Router** - 客户端路由
- **React Image Crop** - 图片裁切组件
- **React Dropzone** - 文件上传组件
- **React Hot Toast** - 通知组件

### 后端
- **Firebase Authentication** - 用户认证
- **Firestore Database** - NoSQL 数据库
- **Firebase Storage** - 文件存储
- **Firebase Cloud Functions** - 服务端逻辑
- **Firebase Hosting** - 静态网站托管

### AI 服务
- **即梦AI (Dreamina)** - Image2Video API

## 快速开始

### 前置条件

1. **Node.js** >= 18.0.0
2. **pnpm** 包管理器
3. **Firebase CLI**
4. **即梦AI API 密钥**

### 安装依赖

```bash
# 安装前端依赖
npm install -g pnpm
pnpm install

# 安装 Firebase CLI
npm install -g firebase-tools

# 安装 Cloud Functions 依赖
cd functions
npm install
```

### Firebase 配置

1. **创建 Firebase 项目**
   - 访问 [Firebase Console](https://console.firebase.google.com)
   - 创建新项目
   - 启用 Authentication、Firestore、Storage 和 Functions

2. **配置 Firebase SDK**
   ```bash
   # 登录 Firebase
   firebase login
   
   # 初始化项目（在项目根目录）
   firebase init
   ```
   
   选择以下服务：
   - ☑️ Firestore
   - ☑️ Functions
   - ☑️ Hosting
   - ☑️ Storage

3. **更新 Firebase 配置**
   在 `src/config/firebase.ts` 中更新您的 Firebase 配置：
   
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

4. **设置即梦AI API 密钥**
   ```bash
   # 设置环境变量
   firebase functions:config:set dreamina.access_key_id="YOUR_ACCESS_KEY_ID"
   firebase functions:config:set dreamina.secret_access_key="YOUR_SECRET_ACCESS_KEY"
   ```

### 本地开发

1. **启动前端开发服务器**
   ```bash
   pnpm dev
   ```
   
2. **启动 Firebase 模拟器**
   ```bash
   firebase emulators:start
   ```

3. **编译 TypeScript**
   ```bash
   cd functions
   npm run build:watch
   ```

现在您可以在 `http://localhost:5173` 访问应用。

## 部署

### 🔧 首次设置（如果项目未使用Git）

如果您看到 `fatal: not a git repository` 错误，请先设置Git仓库：

```bash
# 一键设置Git仓库和GitHub Actions部署
./setup-git-deploy.sh
```

详细说明请参考 [GIT-SETUP.md](GIT-SETUP.md)

### 🚀 一键部署（推荐）

我们提供了自动化的一键部署脚本，可以自动完成所有部署步骤：

```bash
# 运行一键部署脚本
./deploy.sh
```

**脚本功能**：
- ✅ 自动检查环境和依赖
- ✅ 交互式配置即梦AI API密钥
- ✅ 自动构建前端和后端
- ✅ 一键部署所有Firebase服务
- ✅ 自动验证部署状态
- ✅ 提供详细的部署结果

**部署验证**：
```bash
# 验证部署状态
./verify-deployment.sh
```

详细使用说明请参考 [SCRIPTS.md](SCRIPTS.md)

### 手动部署

如果您需要手动控制部署过程：

1. **构建项目**
   ```bash
   # 构建前端
   pnpm build

   # 构建 Cloud Functions
   cd functions
   npm run build
   cd ..
   ```

2. **部署到 Firebase**
   ```bash
   # 部署所有服务
   firebase deploy

   # 或者分别部署
   firebase deploy --only hosting      # 仅部署前端
   firebase deploy --only functions    # 仅部署 Cloud Functions
   firebase deploy --only firestore    # 仅部署数据库规则
   firebase deploy --only storage      # 仅部署存储规则
   ```

3. **验证部署**
   - 访问您的 Firebase Hosting URL
   - 测试用户注册和登录
   - 测试图片上传和 AI 视频生成

### 环境变量

在生产环境中，您需要设置以下环境变量：

```bash
# 即梦AI API 密钥
firebase functions:config:set dreamina.access_key_id="YOUR_ACCESS_KEY_ID"
firebase functions:config:set dreamina.secret_access_key="YOUR_SECRET_ACCESS_KEY"
```

## 项目结构

```
whimsy-brush/
├── public/                  # 静态资源
│   ├── images/             # 图片资源
│   └── index.html          # HTML 模板
├── src/                     # 前端源代码
│   ├── components/         # React 组件
│   ├── config/             # 配置文件
│   ├── hooks/              # 自定义 Hooks
│   ├── pages/              # 页面组件
│   └── services/           # API 服务
├── functions/               # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts        # 主入口文件
│   │   └── services/       # 后端服务
│   └── package.json        # 依赖配置
├── firebase.json            # Firebase 配置
├── firestore.rules          # Firestore 安全规则
├── firestore.indexes.json   # Firestore 索引
├── storage.rules            # Storage 安全规则
└── package.json             # 项目依赖
```

## API 文档

### Cloud Functions

#### createVideoTask
创建视频生成任务

**参数:**
- `imageUrl`: 图片 URL
- `prompt`: 文字描述
- `musicStyle`: 音乐风格
- `aspectRatio`: 宽高比

**返回:**
- `taskId`: 任务 ID

#### getUserVideoTasks
获取用户的视频任务列表

**参数:**
- `limit`: 数量限制
- `offset`: 偏移量

**返回:**
- `tasks`: 任务列表

## 测试

### 单元测试
```bash
pnpm test
```

### E2E 测试
```bash
pnpm test:e2e
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系我们

- 邮箱：support@whimsybrush.com
- 官网：www.whimsybrush.com
- GitHub：[github.com/whimsybrush/whimsybrush](https://github.com/whimsybrush/whimsybrush)

---

由 ❤️ MiniMax Agent 制作