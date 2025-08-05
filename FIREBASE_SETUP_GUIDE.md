# Firebase部署认证设置指南

## 🎯 问题解决方案

由于本地Firebase CLI登录失败，我们使用Service Account Key进行认证，这是更可靠的CI/CD部署方式。

## 📋 完整设置步骤

### 步骤1：创建Service Account

1. **访问Google Cloud Console**
   - 打开：https://console.cloud.google.com/
   - 选择您的Firebase项目（如果没有看到项目，请先在Firebase Console中创建）

2. **创建Service Account**
   - 导航到：`IAM & Admin` > `Service Accounts`
   - 点击 `+ CREATE SERVICE ACCOUNT`
   - 填写信息：
     - Service account name: `firebase-deploy`
     - Service account ID: `firebase-deploy`
     - Description: `GitHub Actions Firebase deployment`
   - 点击 `CREATE AND CONTINUE`

3. **设置权限**
   添加以下角色（点击 `+ ADD ANOTHER ROLE` 添加多个）：
   - `Firebase Admin` (必需)
   - `Firebase Hosting Admin` (必需)
   - `Cloud Storage Admin` (如果使用Storage)
   - `Cloud Functions Admin` (如果使用Functions)
   
   点击 `CONTINUE` 然后 `DONE`

4. **生成密钥**
   - 在Service Accounts列表中，点击刚创建的 `firebase-deploy`
   - 转到 `KEYS` 标签
   - 点击 `ADD KEY` > `Create new key`
   - 选择 `JSON` 格式
   - 点击 `CREATE` 下载JSON文件

### 步骤2：设置GitHub Secrets

1. **访问GitHub仓库设置**
   - 打开：https://github.com/maxiusi3/draworld/settings/secrets/actions

2. **添加Repository Secrets**
   
   **Secret 1: FIREBASE_SERVICE_ACCOUNT**
   - 点击 `New repository secret`
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: 打开下载的JSON文件，复制整个内容（包括大括号）
   - 点击 `Add secret`

   **Secret 2: FIREBASE_PROJECT_ID**
   - 点击 `New repository secret`
   - Name: `FIREBASE_PROJECT_ID`
   - Value: 您的Firebase项目ID（可在Firebase Console项目设置中找到）
   - 点击 `Add secret`

### 步骤3：验证设置

设置完成后，推送任何代码到main分支都会触发自动部署：

```bash
git add .
git commit -m "test: 触发自动部署"
git push origin main
```

## 🔍 故障排除

### 常见错误及解决方案

1. **"Invalid JSON in service account key"**
   - 确保复制了完整的JSON内容
   - 检查JSON格式是否正确（可以用在线JSON验证器验证）
   - 确保secret名称是 `FIREBASE_SERVICE_ACCOUNT`（不是 `FIREBASE_SERVICE_ACCOUNT_KEY`）

2. **"Firebase authentication failed"**
   - 检查Service Account是否有正确的权限
   - 确保FIREBASE_PROJECT_ID与实际项目ID匹配

3. **"Permission denied"**
   - 在Google Cloud Console中为Service Account添加更多权限
   - 确保Firebase项目已启用相关服务

## 🚀 部署流程

设置完成后，GitHub Actions会自动：
1. ✅ 构建项目
2. ✅ 创建service account认证文件
3. ✅ 验证Firebase认证
4. ✅ 部署到Firebase Hosting
5. ✅ 清理临时文件

## 📞 需要帮助？

如果遇到问题，请检查：
1. GitHub Actions日志中的具体错误信息
2. Firebase Console中的项目设置
3. Google Cloud Console中的Service Account权限

---

**注意**：这种方法完全不依赖本地Firebase CLI登录，适合所有CI/CD环境。
