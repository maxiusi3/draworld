# 童画奇旅 (WhimsyBrush)

[![Serverless Devs](https://img.shields.io/badge/Serverless-Devs-blue)](https://github.com/Serverless-Devs/Serverless-Devs)
[![Aliyun](https://img.shields.io/badge/Aliyun-FC%2FOSS%2FTablestore-orange)](https://www.aliyun.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)

一个将儿童绘画作品转化为生动动画视频的AI应用。

> 🚀 正在迁移至中国本土化架构（阿里云 FC/OSS/Tablestore + Authing OIDC）
> 🌐 默认同源 API；可在 .env 配置 VITE_API_BASE_URL 指向 API 网关域名
> 📦 使用 Serverless Devs（s）构建与部署 FC

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
- **Authing OIDC** - 用户认证（手机号验证码）
- **Tablestore** - NoSQL 数据库
- **OSS** - 文件存储
- **函数计算 FC + API 网关** - 服务端逻辑与 API 暴露
- **OSS 静态网站 + CDN** - 静态网站托管

### AI 服务
- **通义万相 wan2.2-i2v-flash（720P）** - 更快更省
- **演示模式** - 如需可保留（当前默认直连真实 API）

## 🚀 立即体验（推荐）

### 最简单的开始方式

1. **克隆并启动**
```bash
git clone <repository-url>
cd whimsy-brush
npm install
npm run dev
```

2. **立即使用**
- 访问 http://localhost:5173
- 注册/登录账户
- 开始使用演示模式创建视频

### 🎭 两种使用模式

#### 演示模式（免费，推荐新用户）
- ✅ **完全免费，无需配置**
- ✅ **立即可用，体验完整功能**
- ⚠️ 生成预设测试视频

#### 真实模式（需要API密钥）
- ✅ **真实AI生成，个性化内容**
- ✅ **通义万相2.2 i2v flash模型**
- ⚠️ 需要通义万相API密钥
- ⚠️ 消耗API配额（约0.5-1元/视频）

### 🚀 启用真实视频生成

#### 快速配置（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 运行配置脚本
npm run setup:video

# 3. 测试配置
npm run test:video

# 4. 启动应用
npm run dev
```

#### 手动配置

1. 获取 [阿里云通义万相API密钥](https://bailian.console.aliyun.com/)
2. 创建 `.env` 文件并添加：
   ```
   DASHSCOPE_API_KEY=sk-your-api-key-here
   ```
3. 重启开发服务器

详细配置指南请参考：[REAL_VIDEO_SETUP.md](./REAL_VIDEO_SETUP.md)

## 详细配置（开发者）

### 前置条件

1. **Node.js** >= 18.0.0
2. **pnpm** 包管理器
3. **Serverless Devs (s) 工具**
4. **通义万相 API 密钥**

### 安装依赖

```bash
# 安装前端依赖
npm install -g pnpm
pnpm install

# 安装 Serverless Devs（s）
npm i -g @serverless-devs/s

# 安装 Cloud Functions 依赖
cd functions
npm install
```

### 阿里云与 Authing 配置

1. **创建 Firebase 项目**
   - 访问 [Firebase Console](https://console.firebase.google.com)
   - 创建新项目
   - 启用 Authentication、Firestore、Storage 和 Functions

2. **配置 Firebase SDK**
   ```bash
   # 登录 Firebase
   s config add --AccessKeyID <AK> --AccessKeySecret <SK> --Name default
   
   # 初始化项目（在项目根目录）
   # 配置完成后，进入 serverless 目录执行部署
cd serverless && npm ci && npm run build:fc && s deploy
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
   
2. **部署/本地联调**
- 后端：cd serverless && npm ci && npm run build:fc && s deploy
- 前端：pnpm dev（默认同源调用 API）

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

## 🚀 部署状态

✅ **前端应用**: 已部署到 Firebase Hosting ([访问链接](https://draworld-6898f.web.app))
✅ **后端服务**: Firebase Cloud Functions 运行正常
✅ **数据库**: Firestore 配置完成
✅ **文件存储**: Firebase Storage 可用
✅ **用户认证**: Firebase Auth 已启用
✅ **CI/CD**: GitHub Actions 自动部署已配置

### 📊 项目指标
- **部署成功率**: 100% (最近10次部署)
- **构建时间**: ~2-3分钟
- **部署环境**: 生产环境
- **最后部署**: 2025-08-05 16:20 (UTC+8)

---

## 🔧 维护和支持

### 代码质量状态
- ✅ TypeScript 类型安全
- ✅ ESLint 代码规范检查
- ✅ 组件化架构设计
- ⚠️ 需要优化：4个文件超过200行限制

### 性能优化计划
- 🔄 实现代码分割和懒加载
- 🔄 添加图片压缩和WebP支持
- 🔄 优化Bundle大小分析
- 🔄 实现Service Worker缓存策略

### 监控和日志计划
- 🔄 配置Firebase Analytics用户行为分析
- 🔄 设置Firebase Crashlytics错误追踪
- 🔄 添加Firebase Performance性能监控
- 🔄 实现业务关键指标监控

---

## 👥 开发团队

👨‍💻 **开发者**: SmarTalk Developer
📧 **联系邮箱**: developer@smartalk.app
🏢 **组织**: SmarTalk Technology
🔗 **GitHub仓库**: [maxiusi3/draworld](https://github.com/maxiusi3/draworld)
🌐 **在线访问**: [https://draworld-opal.vercel.app](https://draworld-opal.vercel.app)

## 🚀 部署状态

- **开发环境**: http://localhost:3000
- **生产环境**: https://draworld-opal.vercel.app
- **CI/CD状态**: ✅ GitHub Actions已配置
- **最后部署**: 2025-01-18 - Vercel自动部署已启用

---

*最后更新: 2025-01-18 | 版本: v1.0.1 | 状态: CI/CD流程测试中 🔄*