# TableStore 数据库设计文档

## 🎯 设计目标

为邀请奖励系统和积分系统设计高效的 TableStore 表结构，支持：
- 邀请码生成与管理
- 邀请关系追踪
- 积分交易记录
- 高并发读写操作
- 多租户架构预留

## 📊 表结构设计

### 1. invite_codes 表（邀请码表）

#### 主键设计
```javascript
primaryKey: [
  { name: 'tenantId', type: 'STRING' },    // 多租户ID（预留）
  { name: 'code', type: 'STRING' }         // 邀请码（唯一）
]
```

#### 属性字段
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| userId | STRING | 邀请码创建者ID | "user-123" |
| isActive | BOOLEAN | 是否有效 | true |
| createdAt | INTEGER | 创建时间戳 | 1642694400000 |
| usedAt | INTEGER | 使用时间戳（可选） | 1642694500000 |
| usedByUserId | STRING | 使用者ID（可选） | "user-456" |

#### 查询模式
1. **按邀请码查找**：`GetRow(tenantId, code)` - O(1)
2. **按用户查找邀请码**：`GetRange(tenantId)` + 过滤 userId - O(n)

### 2. invitations 表（邀请关系表）

#### 主键设计
```javascript
primaryKey: [
  { name: 'tenantId', type: 'STRING' },        // 多租户ID（预留）
  { name: 'invitationId', type: 'STRING' }     // 关系ID（UUID）
]
```

#### 属性字段
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| inviterUserId | STRING | 邀请者ID | "user-123" |
| inviteeUserId | STRING | 被邀请者ID | "user-456" |
| invitationCode | STRING | 使用的邀请码 | "USER123A" |
| registrationRewardGiven | BOOLEAN | 注册奖励是否已发放 | true |
| firstVideoRewardGiven | BOOLEAN | 首次视频奖励是否已发放 | false |
| totalRewardsGiven | INTEGER | 已发放的总奖励金额 | 30 |
| createdAt | INTEGER | 创建时间戳 | 1642694400000 |
| updatedAt | INTEGER | 更新时间戳 | 1642694500000 |

#### 查询模式
1. **按关系ID查找**：`GetRow(tenantId, invitationId)` - O(1)
2. **按邀请者查找**：`GetRange(tenantId)` + 过滤 inviterUserId - O(n)
3. **按被邀请者查找**：`GetRange(tenantId)` + 过滤 inviteeUserId - O(n)

### 3. credit_transactions 表（积分交易表）

#### 主键设计
```javascript
primaryKey: [
  { name: 'userId', type: 'STRING' },          // 用户ID
  { name: 'transactionId', type: 'STRING' }    // 交易ID（UUID）
]
```

#### 属性字段
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| type | STRING | 交易类型 | "EARN" / "SPEND" |
| amount | INTEGER | 积分数量 | 30 |
| reason | STRING | 交易原因 | "INVITATION_REWARD" |
| referenceId | STRING | 关联ID（可选） | "invitation-123" |
| description | STRING | 描述 | "邀请新用户奖励" |
| balanceAfter | INTEGER | 交易后余额 | 180 |
| createdAt | INTEGER | 创建时间戳 | 1642694400000 |

### 4. user_credits 表（用户积分表）

#### 主键设计
```javascript
primaryKey: [
  { name: 'userId', type: 'STRING' }           // 用户ID
]
```

#### 属性字段
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| balance | INTEGER | 当前余额 | 180 |
| totalEarned | INTEGER | 累计获得 | 200 |
| totalSpent | INTEGER | 累计消费 | 20 |
| dailyLikeGiven | INTEGER | 今日点赞数 | 5 |
| lastDailyReset | INTEGER | 上次日重置时间 | 1642694400000 |
| createdAt | INTEGER | 创建时间戳 | 1642694400000 |
| updatedAt | INTEGER | 更新时间戳 | 1642694500000 |

## 🔍 查询优化策略

### 高频查询优化
1. **用户邀请码查询**：
   - 当前：扫描 invite_codes 表过滤 userId
   - 优化：考虑添加 GSI (userId, tenantId)

2. **用户邀请关系查询**：
   - 当前：扫描 invitations 表过滤 inviterUserId
   - 优化：考虑添加 GSI (inviterUserId, tenantId)

3. **被邀请者查询**：
   - 当前：扫描 invitations 表过滤 inviteeUserId
   - 优化：考虑添加 GSI (inviteeUserId, tenantId)

### 缓存策略
```javascript
// 推荐缓存模式
const cacheKeys = {
  userInviteCode: `invite_code:${userId}`,
  userInvitations: `invitations:${inviterUserId}`,
  inviteeRelation: `invitee:${inviteeUserId}`,
  userCredits: `credits:${userId}`
};
```

## ⚡ 性能预估

### QPS 预估
- **读操作**：< 100 QPS
  - 邀请码查询：20 QPS
  - 邀请关系查询：30 QPS
  - 积分余额查询：50 QPS

- **写操作**：< 50 QPS
  - 邀请码创建：5 QPS
  - 邀请关系创建：10 QPS
  - 积分交易记录：35 QPS

### 存储预估
- **invite_codes**：~1KB/行，预估 10万行 = 100MB
- **invitations**：~2KB/行，预估 50万行 = 1GB
- **credit_transactions**：~1KB/行，预估 100万行 = 1GB
- **user_credits**：~0.5KB/行，预估 10万行 = 50MB

## 🛡️ 数据一致性设计

### 事务边界
1. **邀请注册事务**：
   ```javascript
   // 原子操作：
   // 1. 更新 invite_codes.usedAt
   // 2. 创建 invitations 记录
   // 3. 创建 credit_transactions 记录（邀请者+被邀请者）
   // 4. 更新 user_credits 余额
   ```

2. **首次视频奖励事务**：
   ```javascript
   // 原子操作：
   // 1. 更新 invitations.firstVideoRewardGiven
   // 2. 更新 invitations.totalRewardsGiven
   // 3. 创建 credit_transactions 记录
   // 4. 更新 user_credits 余额
   ```

### 幂等性保证
- 使用 `referenceId` 字段防止重复交易
- 条件写入确保状态一致性
- 乐观锁机制处理并发更新

## 🔧 实现建议

### 1. 数据访问层
```javascript
class InvitationRepository {
  async getInviteCodeByUser(userId) {
    // 扫描 + 过滤，考虑缓存
  }
  
  async createInvitation(inviterUserId, inviteeUserId, code) {
    // 事务写入多个表
  }
  
  async triggerFirstVideoReward(inviteeUserId) {
    // 条件更新 + 积分发放
  }
}
```

### 2. 缓存集成
```javascript
class CachedInvitationService {
  async getMyInviteCode(userId) {
    const cached = await redis.get(`invite_code:${userId}`);
    if (cached) return JSON.parse(cached);
    
    const result = await repo.getInviteCodeByUser(userId);
    await redis.setex(`invite_code:${userId}`, 3600, JSON.stringify(result));
    return result;
  }
}
```

### 3. 监控指标
- 表读写 QPS
- 查询延迟 P99
- 错误率
- 缓存命中率
- 事务成功率

## 📈 扩展规划

### 短期优化
1. 添加必要的全局二级索引
2. 实现查询结果缓存
3. 添加监控和告警

### 长期规划
1. 考虑分表策略（按时间或用户分片）
2. 实现读写分离
3. 添加数据归档机制
