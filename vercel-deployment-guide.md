# 🚀 Draworld项目Vercel自动化部署完整指南

## 📋 部署前准备清单

### 1. 配置Vercel环境变量

在Vercel Dashboard中配置以下生产环境变量：

#### 🔧 访问Vercel Dashboard
1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的 `whimsy-brush` 项目
3. 点击 **"Settings"** → **"Environment Variables"**

#### 🔑 必需的环境变量

**核心配置：**
```
NODE_ENV=production
DEMO_MODE=false
```

**API密钥：**
```
DASHSCOPE_API_KEY=sk-bac53038fc8e433bb2c42f394649a379
```

**阿里云配置：**
```
ALIBABA_CLOUD_ACCESS_KEY_ID=[您的阿里云Access Key ID]
ALIBABA_CLOUD_ACCESS_KEY_SECRET=[您的阿里云Access Key Secret]
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=draworld2
TABESTORE_INSTANCE=i01wvvv53p0q
```

**认证配置：**
```
AUTHING_OIDC_ISSUER=https://draworld.authing.cn/oidc
AUTHING_OIDC_AUDIENCE=689adde75ecb97cd396860eb
```

**Supabase配置：**
```
SUPABASE_URL=https://encdblxyxztvfxotfuyh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[您的Supabase Service Role Key]
```

### 2. 配置GitHub Secrets

在GitHub仓库设置中添加以下Secrets：

1. 访问 https://github.com/maxiusi3/draworld/settings/secrets/actions
2. 添加以下Repository Secrets：

```
VERCEL_TOKEN=[您的Vercel访问令牌]
VERCEL_ORG_ID=[您的Vercel组织ID]
VERCEL_PROJECT_ID=[您的Vercel项目ID]
```

## 🚀 执行部署流程

### 方法1：使用自动化脚本

```bash
# 运行自动化部署脚本
./deploy-to-vercel.sh
```

### 方法2：手动执行

```bash
# 1. 检查状态
git status

# 2. 添加更改
git add .

# 3. 提交更改
git commit -m "feat: 更新功能并部署到生产环境"

# 4. 推送触发部署
git push origin main
```

## 📊 监控部署状态

### GitHub Actions
- 访问：https://github.com/maxiusi3/draworld/actions
- 查看工作流运行状态
- 检查构建和部署日志

### Vercel Dashboard
- 访问：https://vercel.com/dashboard
- 查看部署进度和状态
- 检查函数日志

## ✅ 部署后验证

### 自动验证脚本
```bash
# 运行生产环境验证
node verify-production-deployment.js
```

### 手动验证清单
- [ ] 网站访问正常：https://whimsy-brush.vercel.app
- [ ] 用户认证功能正常
- [ ] 积分系统使用60积分生产配置
- [ ] 图片上传到OSS存储
- [ ] 视频生成功能正常
- [ ] 数据保存到TableStore

## 🔧 故障排除

### 常见问题

**1. 部署失败**
- 检查GitHub Actions日志
- 确认所有环境变量已配置
- 验证GitHub Secrets设置

**2. 仍显示演示模式**
- 确认DEMO_MODE=false
- 确认NODE_ENV=production
- 重新部署项目

**3. API调用失败**
- 检查阿里云密钥配置
- 验证API密钥有效性
- 查看Vercel函数日志

## 📞 获取帮助

如果遇到问题：
1. 查看GitHub Actions部署日志
2. 检查Vercel Dashboard错误信息
3. 运行验证脚本诊断问题
4. 确认所有配置步骤已完成

---

**🎉 配置完成后，每次推送到main分支都会自动触发Vercel部署！**
