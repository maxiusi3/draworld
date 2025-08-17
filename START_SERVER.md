# 🚀 启动Whimsy Brush服务器

## 快速启动

在项目根目录运行以下命令：

```bash
# 方法1: 使用环境变量启动
DASHSCOPE_API_KEY=sk-bac53038fc8e433bb2c42f394649a379 npm run dev

# 方法2: 使用启动脚本
chmod +x start-server.sh
./start-server.sh

# 方法3: 直接启动（已配置.env.local）
npm run dev
```

## 🌐 访问地址

服务器启动后，访问：
- **主页**: http://localhost:5173
- **积分商店**: http://localhost:5173/credits
- **个人资料**: http://localhost:5173/profile
- **社区画廊**: http://localhost:5173/gallery
- **审核后台**: http://localhost:5173/admin/moderation

## 🔑 测试配置

### 环境变量已配置
- ✅ **DASHSCOPE_API_KEY**: sk-bac53038fc8e433bb2c42f394649a379
- ✅ **NODE_ENV**: development (演示模式)
- ✅ **视频生成**: 真实API调用通义千问

### 测试Token
- **通用**: `demo-token`
- **新用户**: `new-user-token`
- **管理员**: `admin-token`

## 🎯 功能测试

### 1. 视频生成（真实API）
1. 访问主页 http://localhost:5173
2. 上传图片
3. 输入提示词
4. 点击生成视频
5. 查看真实的视频生成进度

### 2. 邀请系统
1. 访问 http://localhost:5173/profile
2. 查看邀请码
3. 使用新token测试邀请注册

### 3. 积分系统
1. 访问 http://localhost:5173/credits
2. 查看积分余额
3. 测试购买积分流程

### 4. 社区功能
1. 访问 http://localhost:5173/gallery
2. 浏览作品
3. 测试点赞和评论功能

### 5. 审核后台
1. 访问 http://localhost:5173/admin/moderation
2. 查看待审核内容
3. 测试审核操作

## 🧪 API测试

### 测试积分余额
```bash
curl -H "Authorization: Bearer demo-token" \
     http://localhost:5173/api/credits?action=balance
```

### 测试视频生成
```bash
curl -X POST \
     -H "Authorization: Bearer demo-token" \
     -H "Content-Type: application/json" \
     -d '{"inputImageUrl":"https://example.com/image.jpg","params":{"prompt":"测试视频"}}' \
     http://localhost:5173/api/video/start
```

### 测试邀请码
```bash
curl -H "Authorization: Bearer demo-token" \
     http://localhost:5173/api/invitations?action=my-code
```

## 📊 系统状态

### ✅ 已实现功能
- **邀请奖励系统**: 后端代发机制
- **积分系统统一**: 后端统一入账
- **社区后端化**: 防刷机制和社交奖励
- **支付集成**: 订单管理和支付宝真实链路
- **审核举报后台**: 内容审核系统
- **视频生成**: 真实通义千问API集成

### 🎮 演示模式特点
- **数据存储**: 内存存储（重启清空）
- **JWT验证**: 跳过验证（接受任何token）
- **支付系统**: 模拟支付（3秒自动成功）
- **视频生成**: 真实API调用（使用您的密钥）

## 🔧 故障排查

### 端口占用
如果5173端口被占用，Vite会自动选择下一个可用端口。

### 依赖问题
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 环境变量问题
检查 `.env.local` 文件是否存在并包含正确的配置。

## 🎉 启动成功

当看到以下信息时，服务器启动成功：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

现在您可以访问 http://localhost:5173 开始测试所有功能！
