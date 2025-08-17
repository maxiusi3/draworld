# 演示模式与生产模式开关策略

## 🎯 概述

系统支持演示模式和生产模式两种运行方式，通过环境变量和配置自动切换，确保开发测试和生产部署的灵活性。

## 🔧 模式判断逻辑

### 自动检测规则
系统通过以下条件自动判断运行模式：

```javascript
// 通用判断逻辑（在各 API 中使用）
const isDemoMode = 
  supabaseUrl.includes('demo-project') || 
  supabaseServiceKey.includes('demo') || 
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NODE_ENV === 'development';
```

### 环境变量配置

#### 演示模式触发条件
- `SUPABASE_URL` 包含 "demo-project"
- `SUPABASE_SERVICE_ROLE_KEY` 包含 "demo" 
- `SUPABASE_SERVICE_ROLE_KEY` 未设置
- `NODE_ENV=development`

#### 生产模式触发条件
- 设置了有效的 `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` 指向真实数据库
- `NODE_ENV=production`
- 配置了完整的 TableStore 环境变量

## 📊 模式差异对比

| 功能模块 | 演示模式 | 生产模式 |
|---------|---------|---------|
| **数据存储** | 内存 Map 存储 | TableStore 持久化 |
| **JWT 验证** | 跳过验证，接受任何 token | 严格 OIDC 验证 |
| **积分发放** | 前端模拟 + 后端代发 | 纯后端统一入账 |
| **邀请系统** | 内存关系表 | OTS 表存储 |
| **支付系统** | 模拟支付（3秒延迟） | 真实支付宝集成 |
| **风控机制** | 基础频率限制 | 完整风控策略 |
| **日志记录** | 控制台输出 | 结构化日志系统 |

## 🔄 各模块开关实现

### 1. 邀请系统 (api/invitations/index.js)
```javascript
// 演示模式检测
const isDemoMode = supabaseUrl.includes('demo-project') || 
                   supabaseServiceKey.includes('demo') || 
                   !process.env.SUPABASE_SERVICE_ROLE_KEY;

// 数据存储切换
if (isDemoMode) {
  // 使用内存存储
  const demoInvitationCodes = new Map();
  const demoInvitationRelationships = new Map();
} else {
  // 使用 TableStore
  const { InvitationsRepository } = await import('../../serverless/src/invitationsRepo.js');
  const repo = new InvitationsRepository(instanceName);
}
```

### 2. 积分系统 (serverless/src/creditsService.ts)
```javascript
// 生产模式统一使用 TableStore
export class CreditsService {
  constructor(instanceName: string) {
    this.client = new TableStore.Client({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
      secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
      endpoint: `https://${instanceName}.cn-hangzhou.ots.aliyuncs.com`,
      instancename: instanceName,
    });
  }
}
```

### 3. 社区系统 (api/community/index.js)
```javascript
// 模式切换逻辑
if (isDemoMode) {
  // 演示模式：内存存储
  const demoArtworks = new Map();
  const demoLikes = new Map();
  const demoComments = new Map();
} else {
  // 生产模式：TableStore 存储
  // 实现 OTS 表操作
}
```

### 4. 订单系统 (api/orders/index.js)
```javascript
// 支付模式切换
if (isDemoMode) {
  // 演示模式：模拟支付成功（3秒延迟）
  setTimeout(async () => {
    order.status = ORDER_STATUS.PAID;
    await awardPurchaseCredits(userId, order.totalCredits, orderId);
  }, 3000);
} else {
  // 生产模式：真实支付宝集成
  const paymentResult = await alipayService.createOrder(order);
}
```

## 🚀 部署配置

### Vercel 环境变量设置

#### 演示环境
```bash
NODE_ENV=development
SUPABASE_URL=https://demo-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=demo-service-key
```

#### 生产环境
```bash
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-service-key
ALIBABA_CLOUD_ACCESS_KEY_ID=your-access-key
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-secret-key
TABESTORE_INSTANCE=your-instance-name
AUTHING_OIDC_ISSUER=https://your-domain.authing.cn/oidc
AUTHING_OIDC_AUDIENCE=your-app-id
```

### 阿里云函数计算环境变量
```yaml
# serverless/s.yaml
service:
  name: whimsy-brush-backend
  
functions:
  main:
    handler: src/index.handler
    runtime: nodejs18
    environment:
      NODE_ENV: production
      ALIBABA_CLOUD_ACCESS_KEY_ID: ${env:ALIBABA_CLOUD_ACCESS_KEY_ID}
      ALIBABA_CLOUD_ACCESS_KEY_SECRET: ${env:ALIBABA_CLOUD_ACCESS_KEY_SECRET}
      TABESTORE_INSTANCE: ${env:TABESTORE_INSTANCE}
```

## 🔒 安全考虑

### 演示模式安全措施
- JWT 验证虽然跳过，但仍记录用户标识
- 频率限制防止恶意调用
- 数据隔离（内存存储，重启清空）
- 敏感操作日志记录

### 生产模式安全措施
- 严格的 JWT 验证和权限检查
- 完整的风控和反作弊机制
- 数据持久化和备份
- 详细的审计日志
- 支付安全和签名验证

## 📝 开发指南

### 添加新功能时的模式支持
1. **数据存储层**：同时实现内存和 OTS 版本
2. **业务逻辑层**：确保两种模式下逻辑一致
3. **测试验证**：在两种模式下都要测试
4. **文档更新**：说明模式差异

### 模式切换测试
```bash
# 测试演示模式
export NODE_ENV=development
export SUPABASE_URL=https://demo-project.supabase.co
npm run dev

# 测试生产模式
export NODE_ENV=production
export SUPABASE_URL=https://real-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=real-key
npm run dev
```

## 🎯 最佳实践

### 1. 代码组织
- 模式判断逻辑统一放在文件顶部
- 使用清晰的条件分支区分模式
- 避免在业务逻辑中混合模式判断

### 2. 错误处理
- 演示模式：友好的错误提示
- 生产模式：详细的错误日志和监控

### 3. 性能优化
- 演示模式：快速响应，简化逻辑
- 生产模式：完整功能，性能优化

### 4. 监控告警
- 演示模式：基础日志输出
- 生产模式：完整监控体系

## 🔄 迁移策略

### 从演示模式到生产模式
1. 配置生产环境变量
2. 初始化 TableStore 表结构
3. 验证 JWT 配置
4. 测试支付集成
5. 监控系统运行状态

### 回滚到演示模式
1. 修改环境变量
2. 重启服务
3. 验证演示功能正常

---

**注意**：生产模式下请确保所有敏感信息通过环境变量配置，不要在代码中硬编码任何密钥或配置信息。
