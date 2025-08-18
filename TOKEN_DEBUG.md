# Token调试指南

## 🔍 如何验证修复是否有效

### 1. 打开浏览器开发者工具
- 按 F12 或右键 → 检查
- 切换到 Console 标签页

### 2. 登录后检查存储
在控制台输入以下命令：

```javascript
// 检查localStorage中的认证信息
const authSession = localStorage.getItem('auth_session');
console.log('Auth session exists:', !!authSession);

if (authSession) {
  const session = JSON.parse(authSession);
  console.log('Session structure:', {
    hasTokens: !!session.tokens,
    hasIdToken: !!session.tokens?.id_token,
    hasAccessToken: !!session.tokens?.access_token,
    expiresAt: session.expiresAt
  });
}
```

### 3. 测试积分API调用
访问 `/auth-test` 页面，点击"获取积分余额"按钮，观察控制台输出：

**期望看到的日志**：
```
[AUTH TEST] localStorage auth_session: exists
[AUTH TEST] Session tokens: {hasIdToken: true, hasAccessToken: true, ...}
[CREDITS SERVICE] 使用token: eyJhbGciOiJSUzI1NiI...
[CREDITS SERVICE] 发送请求: {url: "/api/credits?action=balance", hasToken: true, ...}
```

**如果仍然有问题，会看到**：
```
[AUTH TEST] localStorage auth_session: not found
[CREDITS SERVICE] 请求异常: Error: 请求失败: 401
```

### 4. 检查API端日志
在Vercel的Function Logs中应该看到：

**成功的情况**：
```
[AUTH] 开始验证JWT token
[AUTH] Token payload: {iss: "https://draworld.authing.cn/oidc", sub: "...", ...}
[AUTH] JWT 验证成功，用户ID: ...
```

**失败的情况**：
```
[AUTH] JWT 验证失败: ...
```

## 🛠️ 如果问题仍然存在

### 清除浏览器存储
```javascript
// 清除所有认证相关存储
localStorage.removeItem('auth_session');
sessionStorage.removeItem('auth_session');
localStorage.clear();
sessionStorage.clear();

// 然后重新登录
```

### 检查token格式
```javascript
const authSession = localStorage.getItem('auth_session');
if (authSession) {
  const session = JSON.parse(authSession);
  const token = session.tokens?.id_token;
  
  if (token) {
    // 解析JWT payload（不验证签名）
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      console.log('Token expires at:', new Date(payload.exp * 1000));
      console.log('Token is expired:', Date.now() > payload.exp * 1000);
    }
  }
}
```

## 📋 验证清单

- [ ] localStorage中存在auth_session
- [ ] session包含有效的tokens
- [ ] id_token格式正确且未过期
- [ ] 积分API调用返回200而不是401
- [ ] 控制台显示正确的调试日志
- [ ] 用户信息显示真实手机号而不是演示数据

## 🚨 常见问题

### Q: 仍然显示401错误
A: 
1. 清除浏览器存储并重新登录
2. 检查token是否过期
3. 确认API端的OIDC配置正确

### Q: Token存在但API仍然失败
A: 
1. 检查token格式是否正确
2. 验证issuer和audience是否匹配
3. 确认JWKS端点可访问

### Q: 登录后没有保存token
A:
1. 检查回调页面是否正确处理授权码
2. 确认token交换是否成功
3. 验证存储写入是否有错误
