# 生产环境部署指南

## 概述

本文档描述了将Whimsy Brush应用从开发/演示环境部署到生产环境的完整流程。

## 环境配置

### 1. 环境变量设置

在生产环境中，需要设置以下环境变量：

#### 必需的生产环境变量
```bash
# 环境标识
NODE_ENV=production
VERCEL_ENV=production

# 通义万相API配置
DASHSCOPE_API_KEY=your_dashscope_api_key

# 阿里云OSS配置
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=whimsy-brush-assets

# TableStore配置
TABESTORE_INSTANCE=your_tablestore_instance

# Supabase配置（如果使用）
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Authing.cn OIDC配置
AUTHING_OIDC_ISSUER=https://your-domain.authing.cn/oidc
AUTHING_OIDC_AUDIENCE=your_oidc_audience
```

#### 可选的配置变量
```bash
# 演示模式控制（生产环境应设为false）
DEMO_MODE=false

# 日志级别
LOG_LEVEL=info

# 缓存配置
REDIS_URL=your_redis_url
```

### 2. 环境检测逻辑

应用使用以下逻辑检测当前环境：

- **开发环境**: `localhost`、端口`3000`、`NODE_ENV=development`
- **演示环境**: 包含`demo`或`test`的域名、`DEMO_MODE=true`
- **预发布环境**: 包含`staging`或`preview`的域名
- **生产环境**: 其他所有情况

## 功能差异

### 积分系统

| 环境 | 视频生成积分要求 | 说明 |
|------|------------------|------|
| 开发环境 | 1积分 | 便于开发测试 |
| 演示环境 | 1积分 | 便于功能展示 |
| 预发布环境 | 10积分 | 上线前测试 |
| 生产环境 | 60积分 | 正式运营 |

### 存储系统

| 环境 | 图片存储 | 视频存储 | 用户数据 |
|------|----------|----------|----------|
| 开发/演示 | Base64内联 | 测试视频URL | 内存存储 |
| 生产环境 | 阿里云OSS | 通义万相API | TableStore |

## API端点更新

### 新增的生产API端点

1. **用户作品列表**: `/api/users/me/artworks`
   - 支持分页查询用户创建的所有作品
   - 按创建时间倒序排列
   - 支持演示模式和生产模式

2. **图片上传增强**: `/api/upload/image`
   - 演示模式：Base64内联图片
   - 生产模式：上传到阿里云OSS
   - 完整的JWT认证和错误处理

3. **作品创建集成**: `/api/community?action=artworks`
   - 创建作品时自动同步到用户作品列表
   - 支持公开/私密设置
   - 完整的元数据存储

## 数据库迁移

### TableStore表结构

#### 用户作品表 (user_artworks)
```javascript
{
  user_id: String,        // 分区键
  artwork_id: String,     // 排序键
  title: String,
  description: String,
  video_url: String,
  thumbnail_url: String,
  is_public: Boolean,
  like_count: Number,
  comment_count: Number,
  view_count: Number,
  created_at: String,
  updated_at: String
}
```

#### 社区作品表 (community_artworks)
```javascript
{
  artwork_id: String,     // 分区键
  user_id: String,
  title: String,
  description: String,
  video_url: String,
  thumbnail_url: String,
  is_public: Boolean,
  like_count: Number,
  comment_count: Number,
  view_count: Number,
  created_at: String,
  updated_at: String,
  tags: Array<String>
}
```

## 部署步骤

### 1. 代码准备
```bash
# 确保所有测试通过
npm test

# 构建生产版本
npm run build

# 检查构建产物
npm run start
```

### 2. 环境变量配置
```bash
# 在Vercel Dashboard中设置所有必需的环境变量
# 确保DEMO_MODE=false或未设置
```

### 3. 数据库初始化
```bash
# 创建TableStore表
# 运行数据迁移脚本（如果有）
```

### 4. 部署验证
```bash
# 部署到预发布环境
vercel --prod --env staging

# 运行生产环境测试
npm run test:production

# 部署到生产环境
vercel --prod
```

## 监控和日志

### 1. 应用监控
- 视频生成成功率
- API响应时间
- 错误率统计
- 用户活跃度

### 2. 日志配置
```javascript
// 生产环境日志级别
const logLevel = process.env.LOG_LEVEL || 'info';

// 关键操作日志
console.log('[PRODUCTION] 用户创建作品:', { userId, artworkId });
console.error('[PRODUCTION] 视频生成失败:', error);
```

### 3. 告警设置
- API错误率超过5%
- 视频生成失败率超过10%
- 数据库连接异常
- OSS上传失败

## 安全配置

### 1. CORS设置
```javascript
// 生产环境CORS配置
const allowedOrigins = [
  'https://whimsy-brush.vercel.app',
  'https://your-custom-domain.com'
];
```

### 2. 认证增强
- JWT token过期时间：24小时
- 刷新token机制
- 用户权限验证
- API访问频率限制

### 3. 数据保护
- 敏感数据加密
- 用户隐私保护
- GDPR合规性
- 数据备份策略

## 性能优化

### 1. 缓存策略
- 静态资源CDN缓存
- API响应缓存
- 用户作品列表缓存
- 图片缩略图缓存

### 2. 数据库优化
- 索引优化
- 查询性能监控
- 连接池配置
- 读写分离

### 3. 前端优化
- 代码分割
- 懒加载
- 图片优化
- 服务端渲染

## 回滚计划

### 1. 快速回滚
```bash
# 回滚到上一个版本
vercel rollback

# 切换环境变量
# 恢复数据库状态
```

### 2. 数据恢复
- 数据库备份恢复
- 用户数据一致性检查
- 作品文件恢复

## 测试清单

### 部署前测试
- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 端到端测试通过
- [ ] 性能测试通过
- [ ] 安全测试通过

### 部署后验证
- [ ] 用户注册登录正常
- [ ] 视频生成功能正常
- [ ] 作品保存和显示正常
- [ ] 积分系统正常
- [ ] 社区功能正常

## 联系信息

如有部署问题，请联系：
- 技术负责人：[联系方式]
- 运维团队：[联系方式]
- 紧急联系：[24小时联系方式]
