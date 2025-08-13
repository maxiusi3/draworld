const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// 初始化 Firebase Admin
admin.initializeApp({
  storageBucket: 'draworld-6898f.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage();

// 阿里云通义万相2.2 API服务类
class TongyiWanxiangAPIService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
    
    if (!this.apiKey) {
      throw new Error('DASHSCOPE_API_KEY environment variable is required');
    }
    
    functions.logger.info('通义万相2.2服务初始化成功');
    functions.logger.info('API Key length:', this.apiKey.length);
  }

  /**
   * 创建视频生成任务
   */
  async createVideoTask(params) {
    const { imageUrl, prompt, aspectRatio = '16:9' } = params;
    
    // 映射宽高比到分辨率
    const resolutionMap = {
      '16:9': '480P',  // 使用480P降低成本
      '4:3': '480P',
      '1:1': '480P',
      '3:4': '480P',
      '9:16': '480P',
      '21:9': '480P',
      '9:21': '480P'
    };

    const requestBody = {
      model: 'wan2.2-i2v-plus',
      input: {
        prompt: prompt,
        img_url: imageUrl
      },
      parameters: {
        resolution: resolutionMap[aspectRatio] || '480P',
        duration: 5,
        prompt_extend: true,
        watermark: false
      }
    };

    functions.logger.info('创建视频任务 - 使用通义万相2.2图生视频');
    functions.logger.info('参数:', requestBody.parameters);
    functions.logger.info('请求体:', JSON.stringify(requestBody));

    try {
      const response = await fetch(`${this.baseUrl}/services/aigc/video-generation/video-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(requestBody),
        timeout: 30000
      });

      functions.logger.info('API响应状态:', response.status);
      
      const responseText = await response.text();
      functions.logger.info('API响应内容:', responseText);

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      
      if (result.output && result.output.task_id) {
        return result.output.task_id;
      } else {
        throw new Error(`API返回格式错误: ${responseText}`);
      }
    } catch (error) {
      functions.logger.error('创建视频任务失败:', error);
      throw error;
    }
  }

  /**
   * 查询任务结果
   */
  async getTaskResult(taskId) {
    try {
      const requestBody = {
        model: 'wan2.2-i2v-plus',
        task_id: taskId
      };

      functions.logger.info('查询任务状态 - taskId:', taskId);
      functions.logger.info('查询请求体:', JSON.stringify(requestBody));

      const response = await fetch(`${this.baseUrl}/services/aigc/video-generation/video-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(requestBody),
        timeout: 15000
      });

      functions.logger.info('查询响应状态:', response.status);

      const responseText = await response.text();
      functions.logger.info('查询响应内容:', responseText);

      if (!response.ok) {
        throw new Error(`查询任务失败: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);

      if (result.output) {
        const status = result.output.task_status;

        if (status === 'SUCCEEDED') {
          return {
            status: 'completed',
            videoUrl: result.output.video_url
          };
        } else if (status === 'FAILED') {
          return {
            status: 'failed',
            error: result.output.message || '任务执行失败'
          };
        } else {
          return {
            status: 'processing'
          };
        }
      } else {
        throw new Error(`查询结果格式错误: ${responseText}`);
      }
    } catch (error) {
      functions.logger.error('查询任务结果失败:', error);
      throw error;
    }
  }
}

// 兼容 HTTP 和 Firebase Functions 的创建视频任务函数
exports.createVideoTask = functions.https.onRequest(async (req, res) => {
  // 设置 CORS 头
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    let requestData;
    let isFirebaseCall = false;

    // 检查是否是 Firebase Functions 调用格式
    if (req.body && req.body.data) {
      // Firebase Functions 调用格式
      requestData = req.body.data;
      isFirebaseCall = true;
      functions.logger.info('收到 Firebase Functions 调用');
    } else {
      // HTTP 调用格式
      requestData = req.body;
      functions.logger.info('收到 HTTP 调用');
    }

    const { imageUrl, prompt, musicStyle, aspectRatio } = requestData;

    if (!imageUrl) {
      const error = '图片URL不能为空';
      if (isFirebaseCall) {
        res.status(400).json({ error: { code: 'invalid-argument', message: error } });
      } else {
        res.status(400).json({ error });
      }
      return;
    }

    if (!prompt) {
      const error = '提示词不能为空';
      if (isFirebaseCall) {
        res.status(400).json({ error: { code: 'invalid-argument', message: error } });
      } else {
        res.status(400).json({ error });
      }
      return;
    }

    functions.logger.info('收到创建视频任务请求:', { imageUrl, prompt, aspectRatio });

    // 调用阿里云通义万相2.2 API
    const apiService = new TongyiWanxiangAPIService();
    const aliyunTaskId = await apiService.createVideoTask({
      imageUrl,
      prompt,
      aspectRatio: aspectRatio || '16:9'
    });

    // 验证taskId是否有效
    if (!aliyunTaskId) {
      throw new Error('API返回的taskId为空');
    }

    functions.logger.info('API返回的taskId:', aliyunTaskId);

    // 将任务信息存储到Firestore
    const taskRef = db.collection('videoTasks').doc();
    const taskId = taskRef.id;

    // 注意：这里我们使用 'anonymous' 作为 userId，因为前端可能以匿名用户身份运行
    // 在生产环境中，应该从认证上下文中获取真实的 userId
    const userId = 'anonymous'; // 临时解决方案

    await taskRef.set({
      id: taskId,
      taskId: taskId,
      userId: userId, // 添加 userId 字段
      aliyunTaskId: aliyunTaskId,
      prompt: prompt || '',
      aspectRatio: aspectRatio || '16:9',
      imageUrl: imageUrl || '',
      musicStyle: musicStyle || 'Joyful',
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    functions.logger.info('任务创建成功:', taskId);

    // 启动轮询检查任务状态
    pollTaskStatus(taskId, aliyunTaskId);

    // 返回响应
    if (isFirebaseCall) {
      res.status(200).json({ result: { taskId } });
    } else {
      res.status(200).json({ taskId });
    }

  } catch (error) {
    functions.logger.error('创建视频任务失败:', error);
    
    if (isFirebaseCall) {
      res.status(500).json({ 
        error: { 
          code: 'internal', 
          message: '创建任务失败: ' + error.message 
        } 
      });
    } else {
      res.status(500).json({ 
        error: '创建任务失败: ' + error.message 
      });
    }
  }
});

// 轮询任务状态
async function pollTaskStatus(taskId, aliyunTaskId, attempt = 0) {
  const maxAttempts = 60; // 最多轮询5分钟 (每5秒一次)
  const delayMs = 5000; // 5秒间隔
  
  if (attempt >= maxAttempts) {
    await db.collection('videoTasks').doc(taskId).update({
      status: 'failed',
      error: '任务超时',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return;
  }
  
  const apiService = new TongyiWanxiangAPIService();
  
  try {
    const result = await apiService.getTaskResult(aliyunTaskId);
    
    if (result.status === 'completed' && result.videoUrl) {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'completed',
        videoUrl: result.videoUrl,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    else if (result.status === 'failed') {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'failed',
        error: result.error || '生成失败',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    else {
      // 继续轮询
      setTimeout(() => {
        pollTaskStatus(taskId, aliyunTaskId, attempt + 1);
      }, delayMs);
    }
  }
  catch (error) {
    functions.logger.error(`轮询任务状态失败 (attempt ${attempt}):`, error);
    if (attempt < maxAttempts - 1) {
      setTimeout(() => {
        pollTaskStatus(taskId, aliyunTaskId, attempt + 1);
      }, delayMs);
    }
    else {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'failed',
        error: '轮询失败',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}
