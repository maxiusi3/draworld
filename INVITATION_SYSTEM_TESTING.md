# 邀请奖励系统测试指南

## 🎯 测试目标

验证邀请奖励系统的完整功能，包括：
- 邀请码生成与分享
- 邀请注册奖励（邀请者+30，被邀请者+50）
- 首次视频奖励（邀请者+70，总上限100）
- 防重复与防作弊机制
- 后端代发积分的正确性

## 🧪 完整测试流程（演示模式）

### 步骤 1: 准备测试账户
```bash
# 获取测试 token（演示模式接受任何 token）
TEST_TOKEN_A="test-token-user-a"
TEST_TOKEN_B="test-token-user-b"
BASE_URL="https://your-app.vercel.app"
```

### 步骤 2: A账户生成邀请码
```bash
# 获取A账户的邀请码
curl -X GET "${BASE_URL}/api/invitations?action=my-code" \
  -H "Authorization: Bearer ${TEST_TOKEN_A}" \
  -H "Content-Type: application/json"

# 预期响应：
# {
#   "success": true,
#   "data": {
#     "invitation_code": "USERA123",
#     "user_id": "user-test-token-user-a",
#     "is_active": true
#   }
# }
```

### 步骤 3: B账户使用邀请码注册
```bash
# B账户使用邀请码注册
curl -X POST "${BASE_URL}/api/invitations?action=register-with-code" \
  -H "Authorization: Bearer ${TEST_TOKEN_B}" \
  -H "Content-Type: application/json" \
  -d '{
    "invitationCode": "USERA123"
  }'

# 预期响应：
# {
#   "success": true,
#   "message": "邀请注册成功",
#   "rewards": {
#     "inviter": 30,
#     "invitee": 50
#   },
#   "relationship": { ... }
# }
```

### 步骤 4: 验证积分变化
```bash
# 检查A账户积分（应该增加30分）
curl -X GET "${BASE_URL}/api/credits/balance" \
  -H "Authorization: Bearer ${TEST_TOKEN_A}"

# 检查B账户积分（应该增加50分，由前端处理）
curl -X GET "${BASE_URL}/api/credits/balance" \
  -H "Authorization: Bearer ${TEST_TOKEN_B}"
```

### 步骤 5: 触发首次视频奖励
```bash
# B账户触发首次视频奖励
curl -X POST "${BASE_URL}/api/invitations?action=trigger-video-reward" \
  -H "Authorization: Bearer ${TEST_TOKEN_B}" \
  -H "Content-Type: application/json"

# 预期响应：
# {
#   "success": true,
#   "reward": 70,
#   "inviterUserId": "user-test-token-user-a",
#   "message": "邀请者获得70积分奖励"
# }
```

### 步骤 6: 验证最终积分
```bash
# 检查A账户最终积分（应该是 30 + 70 = 100分）
curl -X GET "${BASE_URL}/api/credits/balance" \
  -H "Authorization: Bearer ${TEST_TOKEN_A}"

# 检查邀请关系状态
curl -X GET "${BASE_URL}/api/invitations?action=my-invitations" \
  -H "Authorization: Bearer ${TEST_TOKEN_A}"
```

## 🌐 前端测试流程

### 浏览器测试步骤
1. **生成邀请链接**：
   - 登录账户A，访问个人中心或邀请页面
   - 点击"生成邀请码"或"复制邀请链接"
   - 获得形如 `https://your-app.vercel.app?invite=USERA123` 的链接

2. **使用邀请链接注册**：
   - 在新的浏览器窗口/无痕模式中打开邀请链接
   - 完成注册流程成为账户B
   - 观察登录后的 toast 提示："欢迎加入！您获得了50积分奖励！"

3. **验证积分变化**：
   - 账户B：检查积分余额，应显示 150（注册奖励）+ 50（邀请奖励）= 200分
   - 账户A：检查积分余额，应显示原有积分 + 30分

4. **触发首次视频奖励**：
   - 使用账户B生成第一个视频
   - 视频生成完成后，观察 toast 提示："您的邀请者获得了70积分奖励！"
   - 账户A：检查积分余额，应显示原有积分 + 30 + 70 = +100分

## 🛡️ 边界条件测试

### 防重复测试
```bash
# 尝试重复使用同一邀请码（应该失败）
curl -X POST "${BASE_URL}/api/invitations?action=register-with-code" \
  -H "Authorization: Bearer test-token-user-c" \
  -H "Content-Type: application/json" \
  -d '{"invitationCode": "USERA123"}'

# 预期响应：
# {
#   "success": false,
#   "message": "您已经使用过邀请码了"
# }
```

### 自邀请防护测试
```bash
# 尝试使用自己的邀请码（应该失败）
curl -X POST "${BASE_URL}/api/invitations?action=register-with-code" \
  -H "Authorization: Bearer ${TEST_TOKEN_A}" \
  -H "Content-Type: application/json" \
  -d '{"invitationCode": "USERA123"}'

# 预期响应：
# {
#   "success": false,
#   "message": "不能使用自己的邀请码"
# }
```

### 奖励上限测试
```bash
# 多次触发首次视频奖励（应该只成功一次）
curl -X POST "${BASE_URL}/api/invitations?action=trigger-video-reward" \
  -H "Authorization: Bearer ${TEST_TOKEN_B}" \
  -H "Content-Type: application/json"

# 第二次调用预期响应：
# {
#   "success": false,
#   "message": "没有可发放的首次视频奖励"
# }
```

## 📊 预期结果总结

| 操作 | A账户积分变化 | B账户积分变化 | 说明 |
|------|---------------|---------------|------|
| B使用A的邀请码注册 | +30 | +50 | 邀请者和被邀请者奖励 |
| B首次生成视频 | +70 | 0 | 邀请者额外奖励 |
| **总计** | **+100** | **+50** | 单个邀请关系最大奖励 |

## ⚠️ 注意事项

### 演示模式特性
- 数据存储在内存中，服务重启后重置
- JWT 验证被简化，任何 token 都被接受
- 后端代发通过 `/api/credits/transaction` 的 `x-act-as-user` 头部实现

### 生产模式迁移
- 所有积分入账应在服务端统一执行
- 前端不再使用"负数加分"模式
- 需要真实的数据库存储和 JWT 验证

### 错误处理
- 所有 API 调用都应检查响应状态
- 前端应优雅处理网络错误和业务错误
- 积分变化应有明确的用户反馈

## 🔧 故障排除

### 常见问题
1. **邀请码无效**：检查邀请码是否正确生成和传递
2. **积分未到账**：检查后端代发逻辑和 API 调用
3. **重复奖励**：验证防重复机制是否正常工作
4. **权限错误**：确认 JWT token 有效性

### 调试建议
- 查看浏览器控制台日志
- 检查网络请求和响应
- 验证服务端日志输出
- 使用 API 测试工具直接调用接口
