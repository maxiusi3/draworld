# 童画奇旅部署脚本说明

本项目提供了自动化的部署和验证脚本，帮助您快速部署和管理童画奇旅应用。

## 📁 脚本文件

### 1. `deploy.sh` - 一键部署脚本

**功能**：自动化完成整个部署流程

**使用方法**：
```bash
./deploy.sh
```

**包含功能**：
- ✅ 环境检查（Node.js、pnpm、Firebase CLI）
- ✅ Firebase登录状态验证
- ✅ 即梦AI API密钥配置
- ✅ 前端应用构建
- ✅ Cloud Functions构建
- ✅ Firebase服务部署
- ✅ 部署状态验证
- ✅ 错误处理和回滚

### 2. `check-config.sh` - 配置检查脚本

**功能**：检查部署前的配置完整性

**使用方法**：
```bash
./check-config.sh
```

**检查项目**：
- 📁 项目结构完整性
- ⚙️ Firebase配置
- 📦 依赖安装状态
- 🔒 安全规则配置
- 🔑 环境变量设置

### 3. `diagnose-firebase.sh` - Firebase CLI诊断脚本

**功能**：诊断Firebase CLI部署失败的原因

**使用方法**：
```bash
./diagnose-firebase.sh
```

**检查项目**：
- 🌐 网络连接状态
- 🔧 Firebase CLI版本和配置
- 🔑 认证状态和权限
- ⚙️ 项目配置完整性
- 📦 构建状态检查

### 4. `verify-deployment.sh` - 部署验证脚本

**功能**：验证部署后的服务状态

**使用方法**：
```bash
./verify-deployment.sh
```

**检查项目**：
- 🌐 网站可访问性
- ⚡ Cloud Functions状态
- 🔒 Firestore安全规则
- 📁 Storage配置
- 🧪 基本功能测试

### 5. `manual-deploy.js` - 手动部署脚本

**功能**：当Firebase CLI无法使用时的紧急部署方案

**使用方法**：
```bash
node manual-deploy.js
```

**功能特性**：
- 📁 直接上传静态文件到Firebase Storage
- 🔍 部署状态验证
- ⚙️ 环境变量配置提示
- 📋 详细的部署日志

## 🚀 快速开始

### 首次部署

1. **准备环境**：
   ```bash
   # 安装必要工具
   npm install -g pnpm firebase-tools

   # 登录Firebase
   firebase login

   # 设置项目
   firebase use --add
   ```

2. **检查配置**（推荐）：
   ```bash
   ./check-config.sh
   ```

3. **运行一键部署**：
   ```bash
   ./deploy.sh
   ```

4. **验证部署**：
   ```bash
   ./verify-deployment.sh
   ```

### 更新部署

如果您已经完成过首次部署，后续更新只需：

```bash
./deploy.sh
```

脚本会自动跳过已配置的密钥设置。

## 🔧 故障排除

### 权限问题

如果遇到权限错误：
```bash
chmod +x deploy.sh verify-deployment.sh
```

### 环境问题

确保安装了正确版本的工具：
- Node.js >= 18.0.0
- pnpm (最新版本)
- Firebase CLI (最新版本)

### 网络问题

如果部署过程中遇到网络超时：
```bash
# 设置更长的超时时间
firebase deploy --timeout 600s
```

### 配置问题

如果需要重新配置即梦AI密钥：
```bash
firebase functions:config:unset dreamina
./deploy.sh
```

## 📋 部署检查清单

部署完成后，请按以下清单验证：

### 自动检查（通过脚本）
- [ ] 运行 `./verify-deployment.sh`
- [ ] 检查所有项目是否通过

### 手动检查
- [ ] 访问网站首页
- [ ] 测试用户注册功能
- [ ] 测试用户登录功能
- [ ] 测试图片上传功能
- [ ] 测试AI视频生成功能
- [ ] 检查Firebase控制台数据

## 🔒 安全注意事项

1. **密钥管理**：
   - 脚本不会在本地保存密钥
   - 密钥直接设置到Firebase Functions配置中
   - 输入密钥时不会显示明文

2. **权限控制**：
   - 确保只有授权人员可以运行部署脚本
   - 定期检查Firebase项目权限

3. **环境隔离**：
   - 建议为开发、测试、生产环境使用不同的Firebase项目
   - 使用 `firebase use` 命令切换项目

## 📞 获取帮助

如果在使用脚本过程中遇到问题：

1. **查看日志**：脚本会输出详细的执行日志
2. **检查Firebase控制台**：查看部署状态和错误信息
3. **参考文档**：查看 `DEPLOYMENT.md` 获取详细部署指南
4. **重新部署**：大多数问题可以通过重新运行脚本解决

## 🔄 版本更新

当项目代码更新后，重新部署：

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh

# 验证更新
./verify-deployment.sh
```

---

**注意**：首次使用脚本前，请确保已经按照 `README.md` 中的说明完成了基本的项目配置。
