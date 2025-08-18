# 🔍 JWT验证调试指南

## 🚨 当前问题状态

积分系统在API整合后仍然返回401 Unauthorized错误，尽管：
- ✅ JWT Token有效且解析正确
- ✅ 用户ID: `68a31289e62a866dfaa87598`
- ✅ 手机号: `18573170835`
- ✅ API请求格式正确
- ❌ 服务端JWT验证失败

## 🔧 已部署的调试增强

我已经在 `/api/commerce/index.js` 中添加了详细的调试日志：

### **1. 请求级别调试**
```javascript
console.log('[COMMERCE API] 请求接收');
console.log('[COMMERCE API] Method:', req.method);
console.log('[COMMERCE API] URL:', req.url);
console.log('[COMMERCE API] Query:', req.query);
console.log('[COMMERCE API] Headers:', JSON.stringify(req.headers, null, 2));
```

### **2. JWKS端点可访问性测试**
```javascript
const jwksResponse = await fetch(OIDC_JWKS_URI);
console.log('[COMMERCE API] JWKS端点状态:', jwksResponse.status, jwksResponse.statusText);
```

### **3. JWT Token详细验证**
```javascript
console.log('[COMMERCE API] 开始验证JWT token');
console.log('[COMMERCE API] Token长度:', token.length);
console.log('[COMMERCE API] Token预览:', token.substring(0, 50) + '...');
console.log('[COMMERCE API] 期望的issuer:', OIDC_ISSUER);
console.log('[COMMERCE API] 期望的audience:', OIDC_AUDIENCE);
```

### **4. Token Payload解析**
```javascript
const payload = JSON.parse(atob(parts[1]));
console.log('[COMMERCE API] Token payload:', {
  iss: payload.iss,
  aud: payload.aud,
  sub: payload.sub,
  exp: payload.exp,
  phone_number: payload.phone_number
});
console.log('[COMMERCE API] Token是否过期:', Date.now() > payload.exp * 1000);
```

## 📋 测试步骤

### **步骤1: 触发API调用**
1. 登录到应用
2. 访问积分页面或点击积分余额
3. 触发 `GET /api/commerce?action=credits&subAction=balance` 请求

### **步骤2: 查看Vercel函数日志**
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目 → Functions → 查看 `api/commerce` 函数日志
3. 查找以 `[COMMERCE API]` 开头的日志条目

### **步骤3: 分析日志输出**

**期望看到的成功日志流程：**
```
[COMMERCE API] 请求接收
[COMMERCE API] Method: GET
[COMMERCE API] URL: /api/commerce?action=credits&subAction=balance
[COMMERCE API] JWKS端点状态: 200 OK
[COMMERCE API] Action: credits SubAction: balance
[COMMERCE API] Authorization header存在: true
[COMMERCE API] 开始验证JWT token
[COMMERCE API] Token payload: {iss: "https://draworld.authing.cn/oidc", ...}
[COMMERCE API] Token是否过期: false
[COMMERCE API] JWT验证成功，用户ID: 68a31289e62a866dfaa87598
[COMMERCE API] 处理积分余额查询，用户ID: 68a31289e62a866dfaa87598
```

**可能的失败点和诊断：**

#### **A. JWKS端点问题**
```
[COMMERCE API] JWKS端点状态: 404 Not Found
[COMMERCE API] JWKS端点不可访问
```
**解决方案**: OIDC配置问题，需要检查issuer URL

#### **B. Token格式问题**
```
[COMMERCE API] 无法解析token payload: Invalid character
```
**解决方案**: Token格式损坏，需要重新登录

#### **C. Token过期**
```
[COMMERCE API] Token是否过期: true
[COMMERCE API] Token 验证失败: JWTExpired
```
**解决方案**: Token已过期，需要刷新token

#### **D. Issuer/Audience不匹配**
```
[COMMERCE API] Token 验证失败: JWTClaimValidationFailed
[COMMERCE API] 错误声明: iss
```
**解决方案**: OIDC配置不匹配

#### **E. 签名验证失败**
```
[COMMERCE API] Token 验证失败: JWSSignatureVerificationFailed
```
**解决方案**: JWKS密钥不匹配或网络问题

## 🔍 具体诊断方法

### **方法1: 使用auth-debug端点**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://draworld-opal.vercel.app/api/user?action=auth-debug
```

### **方法2: 检查前端token**
在浏览器控制台运行：
```javascript
const session = JSON.parse(localStorage.getItem('auth_session'));
const token = session?.tokens?.id_token;
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Frontend Token Info:', {
    iss: payload.iss,
    aud: payload.aud,
    sub: payload.sub,
    exp: payload.exp,
    isExpired: Date.now() > payload.exp * 1000,
    expiresAt: new Date(payload.exp * 1000)
  });
}
```

### **方法3: 手动验证JWKS**
```bash
curl https://draworld.authing.cn/oidc/.well-known/jwks.json
```

## 🎯 预期发现

基于症状分析，最可能的问题是：

1. **JWKS端点网络问题** - Vercel函数无法访问Authing的JWKS端点
2. **环境变量配置** - OIDC_ISSUER或OIDC_AUDIENCE在生产环境中不正确
3. **Token传递问题** - Authorization头在API整合过程中被修改
4. **时区/时间同步** - 服务器时间导致token被误判为过期

## 📊 下一步行动

1. **立即测试** - 运行积分查询并收集Vercel函数日志
2. **分析日志** - 确定具体失败点
3. **针对性修复** - 根据日志结果实施特定修复
4. **验证修复** - 确认401错误解决

## 🚀 修复策略

根据日志分析结果，我将实施以下修复之一：

- **网络问题**: 添加JWKS重试逻辑和缓存
- **配置问题**: 修正OIDC环境变量
- **Token问题**: 修复token提取和传递逻辑
- **时间问题**: 添加时间容差处理

请运行测试并分享Vercel函数日志，我将根据具体错误信息提供精确的修复方案！🔧
