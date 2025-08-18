# 🔧 生产环境配置指南

## ⚠️ **当前问题诊断**

您的应用目前运行在演示模式而不是生产模式，这是因为缺少关键的生产环境变量。

## 🔍 **演示模式检测逻辑**

应用使用以下条件判断是否为演示模式：

```javascript
const isDemoMode = supabaseUrl.includes('demo-project') || 
                   supabaseServiceKey.includes('demo') || 
                   !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   !process.env.DASHSCOPE_API_KEY;
```

**如果以下任一条件为真，应用将运行在演示模式：**
1. Supabase URL包含'demo-project'
2. Supabase Service Key包含'demo'
3. 缺少SUPABASE_SERVICE_ROLE_KEY环境变量
4. 缺少DASHSCOPE_API_KEY环境变量

## 🎯 **必需的生产环境变量**

### **核心数据库配置**
```bash
# Supabase数据库配置（必需）
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 前端Supabase配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **AI视频生成配置**
```bash
# 通义万相API密钥（必需）
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
```

### **认证配置**
```bash
# Authing.cn OIDC配置
AUTHING_OIDC_ISSUER=https://draworld.authing.cn/oidc
AUTHING_OIDC_AUDIENCE=689adde75ecb97cd396860eb

# 前端认证配置
VITE_AUTHING_CLIENT_ID=689adde75ecb97cd396860eb
VITE_AUTHING_DOMAIN=https://draworld.authing.cn/oidc
```

### **阿里云配置（可选）**
```bash
# 阿里云TableStore配置
ALIBABA_CLOUD_ACCESS_KEY_ID=your-access-key-id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-access-key-secret
TABLESTORE_INSTANCE=your-tablestore-instance

# 阿里云OSS配置
OSS_REGION=cn-hangzhou
OSS_BUCKET=your-oss-bucket
```

### **支付配置（可选）**
```bash
# 支付宝配置
ALIPAY_APP_ID=your-alipay-app-id
ALIPAY_PRIVATE_KEY=your-alipay-private-key
ALIPAY_PUBLIC_KEY=your-alipay-public-key
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment/notify
ALIPAY_RETURN_URL=https://your-domain.com/payment/success
```

## 🚀 **Vercel环境变量设置步骤**

### **1. 访问Vercel Dashboard**
1. 登录 https://vercel.com
2. 选择您的项目 `draworld`
3. 点击 "Settings" 标签
4. 选择 "Environment Variables"

### **2. 添加环境变量**
对于每个必需的环境变量：
1. 点击 "Add New"
2. 输入变量名（如：`SUPABASE_URL`）
3. 输入变量值
4. 选择环境：Production, Preview, Development
5. 点击 "Save"

### **3. 重新部署**
设置完环境变量后：
1. 回到项目主页
2. 点击 "Deployments" 标签
3. 找到最新的部署
4. 点击右侧的 "..." 菜单
5. 选择 "Redeploy"

## 🔧 **快速修复步骤**

### **最小生产配置**
如果您想快速启用生产模式，至少需要设置：

```bash
# 在Vercel中设置这两个环境变量
SUPABASE_SERVICE_ROLE_KEY=your-real-supabase-service-key
DASHSCOPE_API_KEY=your-real-dashscope-api-key
```

### **验证配置**
设置完成后，您可以通过以下方式验证：

1. **检查控制台日志**：
   - 打开浏览器开发者工具
   - 查看Console标签
   - 寻找类似 `[SERVICE] 演示模式检测:` 的日志

2. **检查认证流程**：
   - 尝试登录/注册
   - 应该看到手机号输入步骤
   - 而不是直接跳转到回调页面

3. **检查API响应**：
   - 访问创意广场页面
   - 应该能正常加载作品列表
   - 不再出现404错误

## 🎯 **预期行为变化**

### **演示模式 → 生产模式**

| 功能 | 演示模式 | 生产模式 |
|------|----------|----------|
| **认证** | 跳过手机验证 | 完整OIDC流程 |
| **数据存储** | 内存/localStorage | Supabase数据库 |
| **视频生成** | 模拟响应 | 真实API调用 |
| **积分系统** | 前端状态 | 后端数据库 |
| **社区功能** | 本地数据 | 云端数据 |

### **用户体验改进**
- ✅ 真实的手机号验证登录
- ✅ 数据持久化存储
- ✅ 真实的AI视频生成
- ✅ 完整的社区互动功能
- ✅ 可靠的积分系统

## 🔍 **故障排除**

### **常见问题**

1. **仍然显示演示模式**
   - 检查环境变量是否正确设置
   - 确保重新部署了应用
   - 清除浏览器缓存

2. **认证失败**
   - 检查Authing配置是否正确
   - 确认回调URL已在Authing中配置
   - 验证clientId和audience是否匹配

3. **API 404错误**
   - 检查Supabase配置是否正确
   - 确认数据库表是否已创建
   - 验证Service Role Key权限

### **调试命令**
```bash
# 本地测试环境变量
echo $SUPABASE_SERVICE_ROLE_KEY
echo $DASHSCOPE_API_KEY

# 检查Vercel部署日志
vercel logs your-deployment-url
```

## 📞 **获取帮助**

如果您需要帮助获取这些配置：

1. **Supabase配置**：
   - 访问 https://supabase.com
   - 创建项目并获取URL和密钥

2. **通义万相API**：
   - 访问阿里云DashScope控制台
   - 申请API密钥

3. **Authing配置**：
   - 当前配置应该已经可用
   - 如需修改，访问Authing控制台

---

**⚡ 快速行动：设置 `SUPABASE_SERVICE_ROLE_KEY` 和 `DASHSCOPE_API_KEY` 环境变量，然后重新部署即可启用生产模式！**
