# Docker 部署方案

当本地环境无法正常使用Firebase CLI时，可以使用Docker容器化部署方案。

## 🐳 Docker部署优势

- ✅ 隔离的部署环境，避免本地环境问题
- ✅ 一致的部署体验，无论在什么系统上
- ✅ 包含所有必要的依赖和工具
- ✅ 支持CI/CD集成
- ✅ 可重复的部署过程

## 📋 前置条件

1. **安装Docker**：
   - macOS: 下载Docker Desktop
   - Linux: 安装docker和docker-compose
   - Windows: 下载Docker Desktop

2. **准备Firebase服务账号**：
   - 在Firebase控制台创建服务账号
   - 下载JSON密钥文件

3. **准备即梦AI密钥**：
   - Access Key ID
   - Secret Access Key

## 🚀 使用方法

### 方法1：直接使用Docker命令

```bash
# 1. 构建部署镜像
docker build -f Dockerfile.deploy -t whimsy-brush-deploy .

# 2. 运行部署容器
docker run --rm \
  -e FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
  -e FIREBASE_PROJECT_ID="your-project-id" \
  -e FIREBASE_TOKEN="your-firebase-token" \
  -e DREAMINA_ACCESS_KEY_ID="your-access-key" \
  -e DREAMINA_SECRET_ACCESS_KEY="your-secret-key" \
  whimsy-brush-deploy
```

### 方法2：使用环境变量文件

1. **创建环境变量文件** `.env.deploy`：
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_TOKEN=your-firebase-token
DREAMINA_ACCESS_KEY_ID=your-access-key
DREAMINA_SECRET_ACCESS_KEY=your-secret-key
```

2. **运行部署**：
```bash
# 构建镜像
docker build -f Dockerfile.deploy -t whimsy-brush-deploy .

# 使用环境变量文件运行
docker run --rm \
  --env-file .env.deploy \
  -e FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" \
  whimsy-brush-deploy
```

### 方法3：使用Docker Compose

1. **创建** `docker-compose.deploy.yml`：
```yaml
version: '3.8'

services:
  deploy:
    build:
      context: .
      dockerfile: Dockerfile.deploy
    environment:
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_TOKEN=${FIREBASE_TOKEN}
      - FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}
      - DREAMINA_ACCESS_KEY_ID=${DREAMINA_ACCESS_KEY_ID}
      - DREAMINA_SECRET_ACCESS_KEY=${DREAMINA_SECRET_ACCESS_KEY}
    volumes:
      - ./service-account.json:/tmp/service-account-host.json:ro
```

2. **运行部署**：
```bash
# 设置环境变量
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_TOKEN="your-firebase-token"
export FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)"
export DREAMINA_ACCESS_KEY_ID="your-access-key"
export DREAMINA_SECRET_ACCESS_KEY="your-secret-key"

# 运行部署
docker-compose -f docker-compose.deploy.yml up --build
```

## 🔑 获取Firebase Token

如果没有Firebase Token，可以通过以下方式获取：

```bash
# 方法1：使用Firebase CLI（如果可用）
firebase login:ci

# 方法2：在Docker容器中获取
docker run --rm -it \
  -v $(pwd):/app \
  node:18-alpine \
  sh -c "npm install -g firebase-tools && firebase login:ci"
```

## 🔧 故障排除

### 问题1：Docker构建失败

**解决方案**：
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker build --no-cache -f Dockerfile.deploy -t whimsy-brush-deploy .
```

### 问题2：权限错误

**解决方案**：
```bash
# 检查服务账号权限
# 确保服务账号具有以下角色：
# - Firebase Admin
# - Cloud Functions Admin
# - Storage Admin
```

### 问题3：网络连接问题

**解决方案**：
```bash
# 使用代理
docker run --rm \
  -e HTTP_PROXY=http://proxy:port \
  -e HTTPS_PROXY=http://proxy:port \
  [其他参数...] \
  whimsy-brush-deploy
```

### 问题4：环境变量问题

**解决方案**：
```bash
# 检查环境变量是否正确设置
docker run --rm \
  -e FIREBASE_PROJECT_ID="your-project-id" \
  whimsy-brush-deploy \
  sh -c "echo \$FIREBASE_PROJECT_ID"
```

## 🔒 安全注意事项

1. **保护敏感信息**：
   - 不要将服务账号文件提交到版本控制
   - 使用环境变量传递敏感信息
   - 部署完成后清理临时文件

2. **网络安全**：
   - 在生产环境中使用私有镜像仓库
   - 定期更新基础镜像

3. **访问控制**：
   - 限制服务账号权限
   - 定期轮换密钥

## 📊 部署监控

### 查看部署日志：
```bash
# 实时查看日志
docker logs -f container-name

# 保存日志到文件
docker logs container-name > deploy.log 2>&1
```

### 部署状态检查：
```bash
# 检查容器状态
docker ps -a

# 检查镜像
docker images | grep whimsy-brush
```

## 🔄 CI/CD集成

### GitHub Actions集成：

```yaml
- name: Deploy with Docker
  run: |
    docker build -f Dockerfile.deploy -t whimsy-brush-deploy .
    docker run --rm \
      -e FIREBASE_SERVICE_ACCOUNT="${{ secrets.FIREBASE_SERVICE_ACCOUNT }}" \
      -e FIREBASE_PROJECT_ID="${{ secrets.FIREBASE_PROJECT_ID }}" \
      -e FIREBASE_TOKEN="${{ secrets.FIREBASE_TOKEN }}" \
      -e DREAMINA_ACCESS_KEY_ID="${{ secrets.DREAMINA_ACCESS_KEY_ID }}" \
      -e DREAMINA_SECRET_ACCESS_KEY="${{ secrets.DREAMINA_SECRET_ACCESS_KEY }}" \
      whimsy-brush-deploy
```

### GitLab CI集成：

```yaml
deploy:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -f Dockerfile.deploy -t whimsy-brush-deploy .
    - docker run --rm
        -e FIREBASE_SERVICE_ACCOUNT="$FIREBASE_SERVICE_ACCOUNT"
        -e FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID"
        -e FIREBASE_TOKEN="$FIREBASE_TOKEN"
        -e DREAMINA_ACCESS_KEY_ID="$DREAMINA_ACCESS_KEY_ID"
        -e DREAMINA_SECRET_ACCESS_KEY="$DREAMINA_SECRET_ACCESS_KEY"
        whimsy-brush-deploy
```

## 📞 获取帮助

如果Docker部署遇到问题：

1. 检查Docker版本：`docker --version`
2. 查看详细日志：`docker logs container-name`
3. 验证环境变量：检查所有必需的环境变量
4. 网络连接：确保可以访问Firebase API
5. 权限检查：验证服务账号权限

---

**推荐使用场景**：
- 本地Firebase CLI无法正常工作
- 需要在CI/CD环境中部署
- 需要隔离的部署环境
- 团队协作中保持一致的部署体验
