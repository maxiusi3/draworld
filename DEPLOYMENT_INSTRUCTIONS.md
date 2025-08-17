# 🚀 生产环境部署指南

## 概述

本指南将帮助您将Whimsy Brush部署到生产环境。代码已经准备就绪，只需配置环境变量即可。

## 📋 部署前准备

### 1. 确认功能完整性
✅ 环境感知积分系统（生产环境60积分）
✅ 图片上传OSS集成
✅ 用户作品管理系统
✅ 视频播放器和画廊显示
✅ JWT认证集成
✅ TableStore数据库集成

### 2. 环境变量配置

在Vercel Dashboard中配置以下环境变量（设置为Production环境）：

#### 核心配置
- `NODE_ENV`: production
- `DEMO_MODE`: false

#### API密钥
- `DASHSCOPE_API_KEY`: [您的通义万相API密钥]

#### 阿里云配置
- `ALIBABA_CLOUD_ACCESS_KEY_ID`: [您的阿里云访问密钥ID]
- `ALIBABA_CLOUD_ACCESS_KEY_SECRET`: [您的阿里云访问密钥Secret]
- `OSS_REGION`: oss-cn-hangzhou
- `OSS_BUCKET`: draworld2
- `TABESTORE_INSTANCE`: i01wvvv53p0q

#### 认证配置
- `AUTHING_OIDC_ISSUER`: https://draworld.authing.cn/oidc
- `AUTHING_OIDC_AUDIENCE`: [您的OIDC受众ID]

#### Supabase配置
- `SUPABASE_URL`: [您的Supabase项目URL]
- `SUPABASE_SERVICE_ROLE_KEY`: [您的Supabase服务密钥]

## 🔧 配置步骤

### 方法1: Vercel Dashboard（推荐）

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `whimsy-brush`
3. 进入 Settings → Environment Variables
4. 逐一添加上述环境变量
5. 确保选择 "Production" 环境
6. 保存配置

### 方法2: Vercel CLI

```bash
# 安装Vercel CLI（如果未安装）
npm i -g vercel

# 登录Vercel
vercel login

# 添加环境变量（示例）
vercel env add NODE_ENV production
vercel env add DEMO_MODE false
# ... 添加其他变量
```

## 🚀 部署流程

### 自动部署（推荐）

代码已推送到GitHub，Vercel会自动检测并部署：

1. 确认环境变量已配置
2. 访问Vercel Dashboard查看部署状态
3. 等待部署完成（通常2-5分钟）

### 手动部署

```bash
# 使用Vercel CLI部署
vercel --prod
```

## ✅ 部署验证

部署完成后，请验证以下功能：

### 1. 基础功能
- [ ] 网站正常访问
- [ ] 用户注册/登录
- [ ] 页面正常加载

### 2. 核心功能
- [ ] 视频生成（确认使用60积分）
- [ ] 图片上传到OSS
- [ ] 作品保存和显示
- [ ] 画廊功能正常

### 3. 环境配置
- [ ] 确认非演示模式
- [ ] 积分系统使用生产配置
- [ ] 数据保存到TableStore

## 🔍 故障排除

### 如果显示演示模式：
1. 检查 `DASHSCOPE_API_KEY` 是否设置
2. 确认 `DEMO_MODE` 设为 `false`
3. 验证 `NODE_ENV` 设为 `production`

### 如果API调用失败：
1. 检查API密钥有效性
2. 确认阿里云配置正确
3. 查看Vercel部署日志

### 如果图片上传失败：
1. 确认OSS配置正确
2. 检查访问权限
3. 验证存储桶设置

## 📊 监控和维护

### 关键指标
- 视频生成成功率
- 图片上传成功率
- 用户注册转化率
- API响应时间

### 日志查看
- Vercel Dashboard → Functions → 查看日志
- 关注错误和警告信息
- 监控资源使用情况

## 🔒 安全考虑

- ✅ 敏感信息通过环境变量配置
- ✅ API密钥不在代码中暴露
- ✅ 生产环境与开发环境隔离
- ✅ 定期轮换访问凭证

## 📞 技术支持

如遇到部署问题：
1. 查看 `production-deployment.md` 详细文档
2. 运行 `test-production-ready.js` 测试脚本
3. 检查Vercel部署日志
4. 确认环境变量配置正确

---

**🎉 部署完成后，您的Whimsy Brush应用将在生产环境中正常运行！**

**重要提醒**: 请确保在Vercel Dashboard中正确配置所有环境变量，这是部署成功的关键。
