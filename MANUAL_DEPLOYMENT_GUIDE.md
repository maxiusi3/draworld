# 🚀 手动部署指南（无需 Firebase CLI）

## 方法一：Firebase Console 部署

### 步骤 1：配置环境变量

1. 访问 [Firebase Console](https://console.firebase.google.com)
2. 选择项目 `draworld-6898f`
3. 点击左侧菜单 "Functions"
4. 点击 "配置" 标签
5. 在 "环境变量" 部分点击 "添加变量"
6. 添加：
   - **键**: `DASHSCOPE_API_KEY`
   - **值**: `sk-d6389256b79645c2a8ca5c9a6b13783c`
7. 点击 "保存"

### 步骤 2：部署主要函数

#### 创建 createVideoTask 函数

1. 在 Functions 页面点击 "创建函数"
2. 配置：
   - **函数名**: `createVideoTask`
   - **区域**: `us-central1`
   - **触发器**: `HTTPS`
   - **认证**: `需要认证`
3. 在代码编辑器中：
   - 删除所有默认代码
   - 复制粘贴 `firebase-console-deployment.js` 的内容
   - 确保 package.json 包含必要依赖
4. 点击 "部署"

#### 创建其他函数

重复上述步骤创建：
- `getUserVideoTasks`
- `uploadImage`

### 步骤 3：验证部署

1. 在 Functions 页面查看函数状态
2. 确保所有函数显示为 "已部署"
3. 检查日志确认没有错误

## 方法二：Google Cloud Console 部署

### 步骤 1：访问 Google Cloud Console

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 选择项目 `draworld-6898f`
3. 在搜索栏搜索 "Cloud Functions"

### 步骤 2：创建函数

1. 点击 "创建函数"
2. 基本配置：
   - **函数名**: `createVideoTask`
   - **区域**: `us-central1`
   - **触发器类型**: `HTTP`
   - **身份验证**: `需要身份验证`

3. 运行时配置：
   - **运行时**: `Node.js 20`
   - **入口点**: `createVideoTask`

4. 环境变量：
   - 添加 `DASHSCOPE_API_KEY` = `sk-d6389256b79645c2a8ca5c9a6b13783c`

5. 代码：
   - 选择 "内联编辑器"
   - 将 `firebase-console-deployment.js` 内容粘贴到 `index.js`
   - 将 `console-package.json` 内容粘贴到 `package.json`

6. 点击 "部署"

## 方法三：使用现有的部署包

如果您有访问项目文件的权限，可以：

### 步骤 1：准备部署包

1. 将以下文件打包成 ZIP：
   - `firebase-console-deployment.js` (重命名为 `index.js`)
   - `console-package.json` (重命名为 `package.json`)

### 步骤 2：上传部署

1. 在 Firebase Console 或 Google Cloud Console 中
2. 选择 "ZIP 上传" 选项
3. 上传准备好的 ZIP 文件
4. 配置环境变量
5. 部署

## 验证部署成功

### 检查函数状态

1. 在 Firebase Console 的 Functions 页面
2. 确认所有函数显示为绿色 "已部署" 状态
3. 点击函数名查看详细信息和日志

### 测试函数调用

使用之前创建的 `test-production-fixes.html` 页面：

1. 在浏览器中打开测试页面
2. 依次运行所有测试
3. 确认 Cloud Functions 测试通过
4. 如果已登录，测试视频生成功能

### 检查日志

1. 在 Firebase Console 的 Functions 页面
2. 点击函数名
3. 查看 "日志" 标签
4. 确认没有错误信息

## 常见问题解决

### 1. 环境变量未生效

- 确保变量名正确：`DASHSCOPE_API_KEY`
- 重新部署函数使环境变量生效

### 2. 函数部署失败

- 检查代码语法错误
- 确认 package.json 依赖正确
- 查看部署日志获取详细错误信息

### 3. API 调用失败

- 验证 API 密钥格式正确
- 检查网络连接
- 查看函数执行日志

## 部署完成后

1. 测试完整的用户流程
2. 监控函数执行日志
3. 检查 API 配额使用情况
4. 设置必要的监控告警

完成部署后，您的应用就可以正常使用通义万相 API 生成视频了！
