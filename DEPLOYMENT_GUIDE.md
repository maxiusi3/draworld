# 🚀 Whimsy Brush 部署指南

## 📋 概述

本指南将帮助您部署Whimsy Brush演示环境到Vercel，并验证所有新实现的功能。

## 🎯 已实现的功能

### ✅ P0 关键功能
- **邀请奖励系统**: 后端代发机制，解决奖励发放错误问题
- **邀请系统生产化**: 完整的TableStore集成
- **积分系统统一**: 后端统一入账机制

### ✅ P1 核心功能  
- **社区后端化**: 防刷机制和社交奖励自动化
- **支付集成**: 订单管理 + 支付宝真实链路
- **视频生成**: 真实通义千问API集成

### ✅ P2 完善功能
- **审核举报后台**: 完整的内容审核系统
- **UI/UX完善**: 统一错误处理和可见性控制

## 🛠️ 部署步骤

### 1. 环境准备

```bash
# 安装依赖
npm install

# 安装Vercel CLI
npm install -g vercel

# 登录Vercel
vercel login
```

### 2. 配置环境变量

#### 演示模式配置（推荐）
```bash
# 基础配置
NODE_ENV=development
SUPABASE_URL=https://demo-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=demo-service-key

# 认证配置
AUTHING_OIDC_ISSUER=https://draworld.authing.cn/oidc
AUTHING_OIDC_AUDIENCE=676a0e3c6c9a2b2d8e9c4c5e

# 可选：真实视频生成API
DASHSCOPE_API_KEY=your_real_api_key
```

#### 生产模式配置（可选）
```bash
# 生产环境配置
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_real_service_key

# 阿里云配置
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_secret_key
TABLESTORE_INSTANCE=your_instance_name

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
```

### 3. 自动部署

```bash
# 使用自动部署脚本
chmod +x deploy-demo.sh
./deploy-demo.sh
```

### 4. 手动部署（可选）

```bash
# 构建项目
npm run build:preview

# 部署到Vercel
vercel --prod
```

## 🧪 功能测试

### 自动化测试

```bash
# 本地测试
npm run test:integration

# 演示环境测试
DEMO_URL=https://your-app.vercel.app node test-demo-environment.js
```

### 手动测试清单

#### 1. 邀请系统测试
- [ ] 访问 `/profile` 获取邀请码
- [ ] 使用新token模拟注册: `/api/invitations?action=register-with-code`
- [ ] 触发首次视频奖励: `/api/invitations?action=trigger-video-reward`

#### 2. 积分系统测试
- [ ] 查看积分余额: `/credits`
- [ ] 每日签到功能
- [ ] 查看交易历史

#### 3. 支付系统测试
- [ ] 访问积分商店: `/credits`
- [ ] 创建订单并查看状态
- [ ] 测试订单取消功能

#### 4. 社区功能测试
- [ ] 浏览作品: `/gallery`
- [ ] 点赞和评论功能
- [ ] 社交奖励自动发放

#### 5. 视频生成测试
- [ ] 主页视频生成: `/`
- [ ] 上传图片并生成视频
- [ ] 查看任务状态和进度

#### 6. 审核系统测试
- [ ] 管理员面板: `/admin/moderation`
- [ ] 内容审核操作
- [ ] 举报处理功能

## 🔧 配置说明

### 演示模式特点
- **数据存储**: 内存存储，重启清空
- **JWT验证**: 跳过验证，接受任何token
- **支付系统**: 模拟支付（3秒自动成功）
- **视频生成**: 可配置真实API或使用模拟

### 真实视频生成配置

要启用真实的视频生成功能，需要配置通义千问API密钥：

1. 在Vercel环境变量中添加：
   ```
   DASHSCOPE_API_KEY=your_real_api_key
   ```

2. 或在本地`.env`文件中添加：
   ```
   DASHSCOPE_API_KEY=your_real_api_key
   ```

3. 重新部署应用

## 🎮 演示账号

### 测试Token
- 任何Bearer token都会被接受
- 推荐使用: `demo-token`
- 新用户测试: `new-user-token`

### 管理员权限
- 使用token: `demo-token` 或 `admin-token`
- 访问: `/admin/moderation`

## 📊 监控面板

### 支付监控
- URL: `/admin/payment-monitor`
- 功能: 支付安全统计、失败重试、日志查看

### 系统状态
- 积分余额查询: `/api/credits?action=balance`
- 订单状态查询: `/api/orders?action=list`
- 社区内容统计: `/api/community?action=stats`

## 🐛 故障排查

### 常见问题

1. **视频生成失败**
   - 检查DASHSCOPE_API_KEY是否配置
   - 查看浏览器控制台错误信息
   - 确认图片URL可访问

2. **支付功能异常**
   - 演示模式下支付会自动成功
   - 检查订单状态轮询是否正常

3. **积分不更新**
   - 演示模式使用内存存储
   - 刷新页面或重新登录

4. **API调用失败**
   - 检查网络连接
   - 确认Authorization头格式正确
   - 查看Vercel函数日志

### 日志查看

```bash
# Vercel函数日志
vercel logs

# 本地开发日志
npm run dev
```

## 🔗 相关链接

- **演示环境**: https://your-app.vercel.app
- **Vercel控制台**: https://vercel.com/dashboard
- **通义千问API**: https://dashscope.aliyuncs.com
- **Authing.cn**: https://authing.cn

## 📞 技术支持

如遇到问题，请检查：
1. 环境变量配置是否正确
2. 网络连接是否正常
3. API密钥是否有效
4. Vercel部署状态是否正常

---

**注意**: 演示环境仅用于功能展示，生产环境请使用完整的配置和真实的数据库。
