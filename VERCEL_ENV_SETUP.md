# Vercel环境变量配置指南

## 🔧 在Vercel Dashboard中配置环境变量

访问 [Vercel Dashboard](https://vercel.com/dashboard) → 选择项目 → Settings → Environment Variables

### 必需的生产环境变量

请将以下环境变量添加到 **Production** 环境：

#### 1. 核心API配置
```
变量名: DASHSCOPE_API_KEY
值: sk-bac53038fc8e433bb2c42f394649a379
环境: Production
```

#### 2. 阿里云配置
```
变量名: ALIBABA_CLOUD_ACCESS_KEY_ID
值: [您的阿里云访问密钥ID]
环境: Production

变量名: ALIBABA_CLOUD_ACCESS_KEY_SECRET
值: [您的阿里云访问密钥Secret]
环境: Production

变量名: OSS_REGION
值: oss-cn-hangzhou
环境: Production

变量名: OSS_BUCKET
值: draworld2
环境: Production

变量名: TABESTORE_INSTANCE
值: i01wvvv53p0q
环境: Production
```

#### 3. 认证配置
```
变量名: AUTHING_OIDC_ISSUER
值: https://draworld.authing.cn/oidc
环境: Production

变量名: AUTHING_OIDC_AUDIENCE
值: 689adde75ecb97cd396860eb
环境: Production
```

#### 4. Supabase配置
```
变量名: SUPABASE_URL
值: https://encdblxyxztvfxotfuyh.supabase.co
环境: Production

变量名: SUPABASE_SERVICE_ROLE_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2RibHh5eHp0dmZ4b3RmdXloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg2ODUwOSwiZXhwIjoyMDY5NDQ0NTA5fQ.g5oB17nJ9vwAlbB9YbU6Gq9Q2z4G9dDW7nSdUEXxrNs
环境: Production
```

#### 5. 环境控制
```
变量名: NODE_ENV
值: production
环境: Production

变量名: DEMO_MODE
值: false
环境: Production
```

## 📋 配置步骤

### 方法1: 通过Vercel Dashboard（推荐）

1. 访问 https://vercel.com/dashboard
2. 选择您的项目
3. 点击 "Settings" 标签
4. 点击左侧菜单的 "Environment Variables"
5. 点击 "Add New" 按钮
6. 输入变量名和值
7. 选择 "Production" 环境
8. 点击 "Save"
9. 重复以上步骤添加所有变量

### 方法2: 通过Vercel CLI

如果您已安装Vercel CLI，可以运行：

```bash
chmod +x vercel-env-setup.sh
./vercel-env-setup.sh
```

## ✅ 配置验证

配置完成后，您可以：

1. **检查环境变量列表**
   - 在Vercel Dashboard中确认所有变量都已添加
   - 确认环境设置为 "Production"

2. **触发重新部署**
   - 推送代码到GitHub
   - 或在Vercel Dashboard中点击 "Redeploy"

3. **验证生产环境**
   - 访问部署后的URL
   - 检查是否使用60积分的生产配置
   - 验证图片上传到OSS而非base64

## 🚨 安全注意事项

- ✅ 所有敏感信息都通过环境变量配置
- ✅ 不在代码中硬编码API密钥
- ✅ 生产环境变量与开发环境隔离
- ✅ 定期轮换API密钥和访问凭证

## 🔍 故障排除

### 如果部署后仍显示演示模式：

1. **检查环境变量**
   - 确认 `DASHSCOPE_API_KEY` 已设置
   - 确认 `DEMO_MODE` 设为 `false`
   - 确认 `NODE_ENV` 设为 `production`

2. **检查部署环境**
   - 确认变量添加到 "Production" 环境
   - 确认部署使用的是生产环境

3. **强制重新部署**
   - 在Vercel Dashboard中点击 "Redeploy"
   - 或推送新的代码提交

### 如果API调用失败：

1. **检查API密钥**
   - 确认 `DASHSCOPE_API_KEY` 有效
   - 确认阿里云访问密钥正确

2. **检查网络配置**
   - 确认OSS区域和存储桶名称正确
   - 确认TableStore实例名称正确

3. **查看部署日志**
   - 在Vercel Dashboard中查看 "Functions" 日志
   - 查找具体的错误信息

## 📞 支持

如果遇到配置问题：

1. 检查 `production-deployment.md` 文档
2. 运行 `test-production-ready.js` 测试脚本
3. 查看Vercel部署日志
4. 确认所有环境变量格式正确

---

**配置完成后，推送代码到GitHub即可触发生产环境部署！** 🚀
