# 支付宝集成指南

## 🎯 概述

本系统已预留支付宝支付集成接口，支持沙箱测试和生产环境部署。当前实现包含完整的支付流程，只需配置相应的支付宝应用参数即可启用真实支付功能。

## 🔧 环境配置

### 开发环境（沙箱）

```bash
# 支付宝沙箱配置
ALIPAY_SANDBOX_APP_ID=2021000000000000
ALIPAY_SANDBOX_PRIVATE_KEY=your_sandbox_private_key
ALIPAY_SANDBOX_PUBLIC_KEY=your_sandbox_public_key
ALIPAY_SANDBOX_NOTIFY_URL=https://your-domain.com/api/payment?action=notify
ALIPAY_SANDBOX_RETURN_URL=https://your-domain.com/payment/success

# 环境标识
NODE_ENV=development
```

### 生产环境

```bash
# 支付宝正式环境配置
ALIPAY_APP_ID=your_production_app_id
ALIPAY_PRIVATE_KEY=your_production_private_key
ALIPAY_PUBLIC_KEY=your_production_public_key
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment?action=notify
ALIPAY_RETURN_URL=https://your-domain.com/payment/success

# 环境标识
NODE_ENV=production
```

## 📋 支付宝应用配置步骤

### 1. 创建支付宝应用

1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 创建应用，选择"网页&移动应用"
3. 配置应用信息和功能权限
4. 获取 APPID

### 2. 配置密钥

1. 生成RSA2密钥对
2. 上传公钥到支付宝开放平台
3. 下载支付宝公钥
4. 配置到环境变量中

### 3. 配置回调地址

- **异步通知地址**: `https://your-domain.com/api/payment?action=notify`
- **同步返回地址**: `https://your-domain.com/payment/success`

### 4. 申请功能权限

需要申请以下功能权限：
- 手机网站支付 (alipay.trade.wap.pay)
- 统一收单交易创建接口 (alipay.trade.create)
- 统一收单线下交易预创建 (alipay.trade.precreate)
- 统一收单交易查询 (alipay.trade.query)

## 🔄 支付流程

### 1. 创建订单
```javascript
// 前端调用
const response = await fetch('/api/orders?action=create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ packageId: 'package_1' }),
});
```

### 2. 发起支付
```javascript
// 系统自动调用支付宝API创建支付
const paymentResult = await alipayService.createTrade({
  outTradeNo: orderId,
  totalAmount: '9.99',
  subject: '积分充值',
  productCode: 'QUICK_WAP_WAY',
});
```

### 3. 用户支付
- 用户扫描二维码或跳转支付页面
- 完成支付宝支付流程

### 4. 支付回调
```javascript
// 支付宝异步通知
POST /api/payment?action=notify
{
  "out_trade_no": "order_123",
  "trade_status": "TRADE_SUCCESS",
  "total_amount": "9.99",
  "trade_no": "alipay_trade_123",
  // ... 其他参数
}
```

### 5. 订单完成
- 验证支付宝签名
- 更新订单状态
- 发放积分给用户

## 🛠️ API 接口

### 创建支付

**请求**
```http
POST /api/payment?action=create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "order_123",
  "amount": 9.99,
  "subject": "积分充值"
}
```

**响应**
```json
{
  "success": true,
  "paymentMethod": "ALIPAY",
  "paymentId": "alipay_trade_123",
  "qrCode": "https://qr.alipay.com/...",
  "paymentUrl": "https://openapi.alipay.com/gateway.do?...",
  "expireTime": "2024-01-01T12:30:00Z"
}
```

### 查询支付状态

**请求**
```http
GET /api/payment?action=query&orderId=order_123&paymentId=alipay_trade_123
```

**响应**
```json
{
  "success": true,
  "orderId": "order_123",
  "paymentId": "alipay_trade_123",
  "status": "TRADE_SUCCESS",
  "paidAmount": "9.99",
  "paidTime": "2024-01-01T12:00:00Z"
}
```

### 支付回调处理

**请求**
```http
POST /api/payment?action=notify
Content-Type: application/x-www-form-urlencoded

out_trade_no=order_123&trade_status=TRADE_SUCCESS&...
```

**响应**
```
success
```

## 🔒 安全考虑

### 1. 签名验证
- 所有支付宝回调都会验证RSA2签名
- 防止恶意请求和数据篡改

### 2. 幂等性保护
- 订单状态更新具有幂等性
- 防止重复处理同一笔支付

### 3. 金额校验
- 回调金额与订单金额进行校验
- 防止金额篡改攻击

### 4. 超时处理
- 支付订单30分钟自动过期
- 定期清理过期订单

## 📊 监控与日志

### 支付日志记录
- 所有支付请求和响应都会记录到 `payment_logs` 表
- 包含请求数据、响应数据、处理时间等信息

### 关键指标监控
- 支付成功率
- 支付响应时间
- 异常支付数量
- 回调处理成功率

## 🧪 测试

### 沙箱测试
1. 配置沙箱环境变量
2. 使用支付宝提供的测试账号
3. 验证完整支付流程

### 生产测试
1. 小额真实支付测试
2. 验证回调处理
3. 确认积分发放正确

## 🚀 部署清单

### 上线前检查
- [ ] 支付宝应用已审核通过
- [ ] 生产环境密钥已配置
- [ ] 回调地址可正常访问
- [ ] 支付流程测试通过
- [ ] 监控和日志系统就绪

### 环境变量配置
```bash
# Vercel 环境变量
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_NOTIFY_URL=https://your-domain.vercel.app/api/payment?action=notify
ALIPAY_RETURN_URL=https://your-domain.vercel.app/payment/success

# 阿里云函数计算环境变量
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_NOTIFY_URL=https://your-fc-domain.com/api/payment?action=notify
ALIPAY_RETURN_URL=https://your-domain.com/payment/success
```

## 🔧 故障排查

### 常见问题

1. **签名验证失败**
   - 检查私钥格式是否正确
   - 确认参数排序和编码方式
   - 验证支付宝公钥是否最新

2. **回调接收失败**
   - 检查回调URL是否可访问
   - 确认HTTPS证书有效
   - 验证服务器响应格式

3. **支付创建失败**
   - 检查APPID和权限配置
   - 验证金额格式是否正确
   - 确认商户订单号唯一性

### 调试工具
- 支付宝开放平台调试工具
- 本地ngrok隧道测试
- 日志分析和错误追踪

---

**注意**: 当前系统已完全支持支付宝集成，只需按照本指南配置相应参数即可启用真实支付功能。在演示模式下，系统会使用模拟支付流程进行测试。
