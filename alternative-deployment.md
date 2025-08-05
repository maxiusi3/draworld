# Firebase 替代部署方案

当Firebase CLI无法正常工作时，本文档提供多种替代部署方案。

## 🔍 问题诊断

首先运行诊断脚本确定问题原因：

```bash
./diagnose-firebase.sh
```

## 🚀 替代部署方案

### 方案1：GitHub Actions CI/CD 部署（推荐）

#### 优势：
- ✅ 完全自动化
- ✅ 不依赖本地Firebase CLI
- ✅ 支持多环境部署
- ✅ 内置密钥管理

#### 设置步骤：

1. **创建GitHub仓库并推送代码**

2. **获取Firebase服务账号密钥**：
   ```bash
   # 在Firebase控制台创建服务账号
   # 项目设置 -> 服务账号 -> 生成新的私钥
   # 下载JSON文件
   ```

3. **设置GitHub Secrets**：
   - 在GitHub仓库设置中添加以下Secrets：
     - `FIREBASE_SERVICE_ACCOUNT`: 服务账号JSON内容
     - `DREAMINA_ACCESS_KEY_ID`: 即梦AI Access Key ID
     - `DREAMINA_SECRET_ACCESS_KEY`: 即梦AI Secret Access Key

4. **创建GitHub Actions工作流**：
   创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install pnpm
      run: npm install -g pnpm
    
    - name: Install dependencies
      run: |
        pnpm install
        cd functions && npm install
    
    - name: Build project
      run: |
        pnpm build
        cd functions && npm run build
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-firebase-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        projectId: your-project-id
      env:
        FIREBASE_CLI_PREVIEWS: hostingchannels
    
    - name: Set Firebase Functions config
      run: |
        echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > service-account.json
        export GOOGLE_APPLICATION_CREDENTIALS=service-account.json
        firebase functions:config:set \
          dreamina.access_key_id="${{ secrets.DREAMINA_ACCESS_KEY_ID }}" \
          dreamina.secret_access_key="${{ secrets.DREAMINA_SECRET_ACCESS_KEY }}"
        rm service-account.json
```

### 方案2：Firebase控制台手动部署

#### 适用场景：
- 临时部署
- 小规模更新
- CLI完全无法使用

#### 操作步骤：

1. **部署Hosting（前端）**：
   ```bash
   # 本地构建
   pnpm build
   
   # 打包dist目录
   cd dist && zip -r ../frontend.zip . && cd ..
   ```
   
   - 访问Firebase控制台 -> Hosting
   - 点击"开始使用"或"新建部署"
   - 上传frontend.zip文件

2. **部署Cloud Functions**：
   ```bash
   # 构建Functions
   cd functions
   npm run build
   
   # 打包源代码
   zip -r functions.zip . -x "node_modules/*" "*.log"
   ```
   
   - 访问Firebase控制台 -> Functions
   - 创建新函数或更新现有函数
   - 上传functions.zip文件

3. **配置Firestore规则**：
   - 访问Firebase控制台 -> Firestore Database -> 规则
   - 复制firestore.rules内容并粘贴

4. **配置Storage规则**：
   - 访问Firebase控制台 -> Storage -> 规则
   - 复制storage.rules内容并粘贴

5. **设置环境变量**：
   - 访问Firebase控制台 -> Functions -> 配置
   - 添加即梦AI密钥配置

### 方案3：使用Firebase Admin SDK直接部署

#### 创建部署脚本：

创建 `manual-deploy.js`：

```javascript
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// 初始化Firebase Admin
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project.appspot.com'
});

async function deployFiles() {
  const bucket = getStorage().bucket();
  const distPath = './dist';
  
  // 上传dist目录中的所有文件
  const files = fs.readdirSync(distPath, { recursive: true });
  
  for (const file of files) {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      await bucket.upload(filePath, {
        destination: file,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      console.log(`Uploaded: ${file}`);
    }
  }
}

deployFiles().catch(console.error);
```

### 方案4：Docker容器化部署

#### 创建Dockerfile：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装Firebase CLI
RUN npm install -g firebase-tools

# 复制项目文件
COPY . .

# 安装依赖
RUN npm install -g pnpm && \
    pnpm install && \
    cd functions && npm install

# 构建项目
RUN pnpm build && \
    cd functions && npm run build

# 部署脚本
COPY deploy-docker.sh /deploy.sh
RUN chmod +x /deploy.sh

CMD ["/deploy.sh"]
```

#### 创建Docker部署脚本：

```bash
#!/bin/bash
# deploy-docker.sh

# 设置服务账号
echo "$FIREBASE_SERVICE_ACCOUNT" > /tmp/service-account.json
export GOOGLE_APPLICATION_CREDENTIALS=/tmp/service-account.json

# 设置项目
firebase use "$FIREBASE_PROJECT_ID"

# 配置Functions环境变量
firebase functions:config:set \
  dreamina.access_key_id="$DREAMINA_ACCESS_KEY_ID" \
  dreamina.secret_access_key="$DREAMINA_SECRET_ACCESS_KEY"

# 部署
firebase deploy

# 清理
rm /tmp/service-account.json
```

#### 使用Docker部署：

```bash
# 构建镜像
docker build -t whimsy-brush-deploy .

# 运行部署
docker run --rm \
  -e FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
  -e FIREBASE_PROJECT_ID="your-project-id" \
  -e DREAMINA_ACCESS_KEY_ID="your-access-key" \
  -e DREAMINA_SECRET_ACCESS_KEY="your-secret-key" \
  whimsy-brush-deploy
```

### 方案5：使用Terraform进行基础设施即代码

#### 创建main.tf：

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_cloudfunctions_function" "create_video_task" {
  name        = "createVideoTask"
  description = "Create video generation task"
  runtime     = "nodejs18"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.functions_bucket.name
  source_archive_object = google_storage_bucket_object.functions_zip.name
  trigger {
    https_trigger = {}
  }
  entry_point = "createVideoTask"
}

resource "google_storage_bucket" "functions_bucket" {
  name     = "${var.project_id}-functions"
  location = var.region
}

resource "google_storage_bucket_object" "functions_zip" {
  name   = "functions.zip"
  bucket = google_storage_bucket.functions_bucket.name
  source = "./functions.zip"
}
```

## 🔧 故障排除

### 常见问题解决：

1. **权限问题**：
   - 确保服务账号有足够权限
   - 检查IAM角色设置

2. **网络问题**：
   - 使用VPN或代理
   - 检查防火墙设置

3. **构建问题**：
   - 清理缓存重新构建
   - 检查依赖版本兼容性

4. **配置问题**：
   - 验证所有配置文件
   - 检查环境变量设置

## 📞 获取帮助

如果所有方案都无法解决问题：

1. 查看Firebase状态页面
2. 联系Firebase支持
3. 在Firebase社区寻求帮助
4. 考虑迁移到其他云平台

---

**推荐顺序**：GitHub Actions > Docker部署 > 手动控制台 > Admin SDK > Terraform
