# 视频生成API - 阿里云通义万相2.2集成

基于Google Cloud Functions和阿里云通义万相2.2的图生视频API服务。

## 🚀 功能特性

- **图生视频**：基于输入图像生成5秒高质量视频
- **多种分辨率**：支持480P和1080P输出
- **多种宽高比**：支持16:9、9:16、1:1、4:3、3:4
- **智能优化**：自动prompt改写和视频优化
- **无水印输出**：干净的视频输出
- **异步处理**：支持长时间视频生成任务

## 📋 API端点

### 创建视频任务
```
POST https://us-central1-draworld-6898f.cloudfunctions.net/createVideoTask
```

### 查询任务结果
```
GET https://us-central1-draworld-6898f.cloudfunctions.net/getVideoTaskResult?taskId={taskId}
```

## 🔧 快速开始

### 1. 创建视频任务

```bash
curl -X POST https://us-central1-draworld-6898f.cloudfunctions.net/createVideoTask \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "prompt": "一个美丽的山景，微风轻拂，阳光洒在山峰上",
    "aspectRatio": "16:9"
  }'
```

**响应示例：**
```json
{
  "success": true,
  "taskId": "wan2.2-i2v-plus-1234567890",
  "message": "视频任务创建成功"
}
```

### 2. 查询任务结果

```bash
curl "https://us-central1-draworld-6898f.cloudfunctions.net/getVideoTaskResult?taskId=wan2.2-i2v-plus-1234567890"
```

**响应示例：**
```json
{
  "success": true,
  "taskId": "wan2.2-i2v-plus-1234567890",
  "status": "completed",
  "videoUrl": "https://xxx.oss-cn-xxx.aliyuncs.com/xxx.mp4"
}
```

## 📝 参数说明

### 创建任务参数

| 参数 | 类型 | 必需 | 说明 | 默认值 |
|------|------|------|------|--------|
| `imageUrl` | string | ✅ | 输入图像的URL地址 | - |
| `prompt` | string | ❌ | 视频描述文本 | "" |
| `aspectRatio` | string | ❌ | 视频宽高比 | "16:9" |

### 支持的宽高比
- `16:9` - 横屏视频
- `9:16` - 竖屏视频  
- `1:1` - 方形视频
- `4:3` - 传统横屏
- `3:4` - 传统竖屏

### 任务状态
- `processing` - 生成中
- `completed` - 已完成
- `failed` - 生成失败

## 💰 费用说明

- **480P视频**：0.7元/视频（5秒）
- **1080P视频**：3.5元/视频（5秒）
- **免费额度**：新用户50秒免费试用

## 🛠 部署说明

### 环境要求
- Node.js 20+
- Google Cloud SDK
- 阿里云百炼平台账号

### 部署步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd simple-deploy
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 设置阿里云API Key
export DASHSCOPE_API_KEY="sk-your-api-key-here"
```

4. **部署Cloud Functions**
```bash
# 部署创建任务函数
gcloud functions deploy createVideoTask \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars DASHSCOPE_API_KEY=sk-your-api-key-here

# 部署查询结果函数  
gcloud functions deploy getVideoTaskResult \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars DASHSCOPE_API_KEY=sk-your-api-key-here
```

## 🧪 测试

运行自动化测试：
```bash
node test_api.js
```

## 📚 相关文档

- [阿里云通义万相2.2设置指南](./ALIYUN_WANXIANG_SETUP_GUIDE.md)
- [阿里云百炼平台文档](https://help.aliyun.com/zh/model-studio/)
- [Google Cloud Functions文档](https://cloud.google.com/functions/docs)

## 🔍 故障排除

### 常见问题

1. **免费额度用完**
   - 解决方案：开通付费模式或使用新账号

2. **图像URL无法访问**
   - 解决方案：确保图像URL可公开访问

3. **API Key无效**
   - 解决方案：检查API Key是否正确设置

详细故障排除请参考：[设置指南](./ALIYUN_WANXIANG_SETUP_GUIDE.md)

## 📊 监控

查看函数日志：
```bash
gcloud functions logs read createVideoTask --limit 50
gcloud functions logs read getVideoTaskResult --limit 50
```

## 🎯 技术架构

- **前端API**：Google Cloud Functions
- **视频生成**：阿里云通义万相2.2
- **数据存储**：Firebase Firestore
- **文件存储**：Firebase Storage

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**🎉 恭喜！您已成功部署阿里云通义万相2.2图生视频API服务！**
