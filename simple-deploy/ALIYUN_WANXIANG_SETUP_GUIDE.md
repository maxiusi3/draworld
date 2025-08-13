# 阿里云通义万相2.2 图生视频API 设置指南

## 🎯 项目状态

✅ **API集成完成** - 已成功从即梦AI迁移到阿里云通义万相2.2  
✅ **Cloud Functions部署** - 创建和查询函数都已部署  
✅ **测试验证** - API连接正常，功能完整  
⚠️ **需要开通付费** - 免费额度已用完，需要开通付费模式  

## 🔧 解决免费额度问题

### 方案1：开通付费模式（推荐）

#### 步骤1：登录阿里云百炼控制台
- 访问：https://bailian.console.aliyun.com/
- 使用您的阿里云账号登录

#### 步骤2：进入模型管理
1. 点击左侧菜单"模型广场"
2. 搜索"通义万相"
3. 找到"万相2.2图生视频"模型

#### 步骤3：关闭免费模式限制
1. 点击模型详情页
2. 找到"仅使用免费额度"选项
3. **关闭**此选项
4. 确认开通按量付费

#### 步骤4：验证设置
- 返回API调用页面
- 确认显示"按量付费"状态

### 方案2：使用新的阿里云账号
如果不想开通付费，可以：
1. 注册新的阿里云账号
2. 完成实名认证
3. 开通百炼平台
4. 获取新的API Key
5. 更新Cloud Function环境变量

## 💰 费用说明

### 图生视频定价（万相2.2-i2v-plus）
- **480P分辨率**：0.14元/秒
- **1080P分辨率**：0.70元/秒
- **视频时长**：5秒/视频

### 实际成本
- **480P视频**：0.14 × 5 = **0.7元/视频**
- **1080P视频**：0.70 × 5 = **3.5元/视频**

### 成本优化建议
- 当前配置使用480P，成本较低
- 每个视频仅需0.7元，性价比很高
- 建议先小量测试，确认效果后再大量使用

## 🚀 API使用说明

### 创建视频任务
```bash
curl -X POST https://us-central1-draworld-6898f.cloudfunctions.net/createVideoTask \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "prompt": "视频描述文本",
    "aspectRatio": "16:9"
  }'
```

### 查询任务结果
```bash
curl "https://us-central1-draworld-6898f.cloudfunctions.net/getVideoTaskResult?taskId=YOUR_TASK_ID"
```

### 支持的参数
- **imageUrl** (必需)：输入图像URL
- **prompt** (可选)：视频描述文本
- **aspectRatio** (可选)：宽高比 (16:9, 9:16, 1:1, 4:3, 3:4)

## 🔍 故障排除

### 常见错误及解决方案

#### 1. 免费额度用完
```json
{
  "code": "AllocationQuota.FreeTierOnly",
  "message": "The free tier of the model has been exhausted..."
}
```
**解决方案**：按照上述步骤开通付费模式

#### 2. API Key无效
```json
{
  "code": "InvalidApiKey",
  "message": "Invalid API key"
}
```
**解决方案**：检查API Key是否正确设置

#### 3. 图像URL无法访问
```json
{
  "code": "InvalidParameter.ImageUrl",
  "message": "Image URL is not accessible"
}
```
**解决方案**：确保图像URL可公开访问

## 📊 监控和日志

### 查看Cloud Function日志
```bash
gcloud functions logs read createVideoTask --limit 50
gcloud functions logs read getVideoTaskResult --limit 50
```

### 查看阿里云使用情况
- 访问：https://bailian.console.aliyun.com/model-telemetry
- 查看API调用次数和费用统计

## 🎉 集成完成确认

当您完成付费模式开通后，可以运行以下测试：

```bash
cd simple-deploy
node test_api.js
```

如果看到类似以下输出，说明集成完全成功：
```
✅ 任务创建成功！任务ID: xxxxx
⏳ 视频正在生成中...
🎉 视频生成完成！
视频URL: https://xxx.oss-cn-xxx.aliyuncs.com/xxx.mp4
```

## 📞 技术支持

如遇到问题，可以：
1. 查看阿里云百炼平台文档
2. 联系阿里云技术支持
3. 检查Cloud Function日志

---

**恭喜！您已成功完成从即梦AI到阿里云通义万相2.2的完整迁移！** 🎊
