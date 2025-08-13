const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const crypto = require('crypto');
const { Signer } = require('@volcengine/openapi');

// 初始化 Firebase Admin
admin.initializeApp({
  storageBucket: 'draworld-6898f.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage();

// 即梦AI API服务类
class DreaminaAPIService {
  constructor() {
    // 从环境变量获取API密钥
    this.accessKeyId = process.env.DREAMINA_ACCESS_KEY_ID;
    // 解码Secret Access Key（可能是base64编码的）
    let secretKey = process.env.DREAMINA_SECRET_ACCESS_KEY;
    try {
      // 尝试base64解码
      const decoded = Buffer.from(secretKey, 'base64').toString('utf8');
      // 如果解码后还是base64格式，再解码一次
      if (decoded.match(/^[A-Za-z0-9+/]+=*$/)) {
        this.secretAccessKey = Buffer.from(decoded, 'base64').toString('utf8');
      } else {
        this.secretAccessKey = decoded;
      }
    } catch (e) {
      this.secretAccessKey = secretKey;
    }
    this.baseUrl = 'https://visual.volcengineapi.com';
    this.service = 'cv';
    this.region = 'cn-north-1';

    functions.logger.info('Secret Access Key (前8位):', this.secretAccessKey.substring(0, 8));

    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error('即梦AI API密钥未配置');
    }

    functions.logger.info('即梦AI服务初始化成功');
  }

  async createVideoTask(params) {
    const { imageUrl, prompt, musicStyle = 'Joyful', aspectRatio = '16:9' } = params;

    functions.logger.info('创建视频任务 - 使用Python SDK');
    functions.logger.info('参数:', { prompt, aspectRatio });

    try {
      // 调用Python脚本
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        const python = spawn('python3', ['dreamina_api.py', 'create_video', prompt, aspectRatio], {
          env: {
            ...process.env,
            DREAMINA_ACCESS_KEY_ID: this.accessKeyId,
            DREAMINA_SECRET_ACCESS_KEY: process.env.DREAMINA_SECRET_ACCESS_KEY
          }
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          functions.logger.info('Python脚本退出码:', code);
          functions.logger.info('Python stdout:', stdout);
          if (stderr) {
            functions.logger.error('Python stderr:', stderr);
          }

          if (code !== 0) {
            reject(new Error(`Python脚本执行失败，退出码: ${code}, stderr: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              // 从响应中提取task_id
              const taskId = result.response?.data?.task_id;
              if (taskId) {
                resolve(taskId);
              } else {
                reject(new Error(`未找到task_id: ${JSON.stringify(result.response)}`));
              }
            } else {
              reject(new Error(`Python API调用失败: ${result.error}`));
            }
          } catch (e) {
            reject(new Error(`解析Python输出失败: ${e.message}, stdout: ${stdout}`));
          }
        });
      });
    } catch (error) {
      functions.logger.error('调用Python脚本失败:', error);
      throw error;
    }
  }

  async getTaskResult(taskId) {
    functions.logger.info('获取任务结果 - 使用Python SDK');
    functions.logger.info('任务ID:', taskId);

    try {
      // 调用Python脚本
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        const python = spawn('python3', ['dreamina_api.py', 'get_result', taskId], {
          env: {
            ...process.env,
            DREAMINA_ACCESS_KEY_ID: this.accessKeyId,
            DREAMINA_SECRET_ACCESS_KEY: process.env.DREAMINA_SECRET_ACCESS_KEY
          }
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          functions.logger.info('Python脚本退出码:', code);
          functions.logger.info('Python stdout:', stdout);
          if (stderr) {
            functions.logger.error('Python stderr:', stderr);
          }

          if (code !== 0) {
            reject(new Error(`Python脚本执行失败，退出码: ${code}, stderr: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              const taskData = result.response?.data;
              if (taskData) {
                resolve({
                  status: taskData.status,
                  videoUrl: taskData.video_url,
                  error: taskData.error_message
                });
              } else {
                reject(new Error(`未找到任务数据: ${JSON.stringify(result.response)}`));
              }
            } else {
              reject(new Error(`Python API调用失败: ${result.error}`));
            }
          } catch (e) {
            reject(new Error(`解析Python输出失败: ${e.message}, stdout: ${stdout}`));
          }
        });
      });
    } catch (error) {
      functions.logger.error('调用Python脚本失败:', error);
      throw error;
    }
  }

  // 根据火山引擎官方文档实现签名算法的辅助方法
  getDateTimeNow() {
    const now = new Date();
    return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  hash(s) {
    return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
  }

  hmac(secret, s) {
    return crypto.createHmac('sha256', secret).update(s, 'utf8').digest();
  }

  // 按照Python示例实现签名生成
  hmacSign(key, msg) {
    return crypto.createHmac('sha256', key).update(msg, 'utf8').digest();
  }

  getSignatureKey(key, dateStamp, regionName, serviceName) {
    // 第一次调用时，key需要编码为UTF-8（与Python示例一致）
    const kDate = this.hmacSign(Buffer.from(key, 'utf8'), dateStamp);
    const kRegion = this.hmacSign(kDate, regionName);
    const kService = this.hmacSign(kRegion, serviceName);
    const kSigning = this.hmacSign(kService, 'request');
    return kSigning;
  }

  generateSignature(secretKey, dateStamp, region, service, stringToSign) {
    const signingKey = this.getSignatureKey(secretKey, dateStamp, region, service);
    return crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  }

  queryParamsToString(params) {
    return Object.keys(params)
      .sort()
      .map((key) => {
        const val = params[key];
        if (typeof val === 'undefined' || val === null) {
          return undefined;
        }
        const escapedKey = this.uriEscape(key);
        if (!escapedKey) {
          return undefined;
        }
        return `${escapedKey}=${this.uriEscape(val)}`;
      })
      .filter((v) => v)
      .join('&');
  }

  uriEscape(str) {
    try {
      // 使用标准的RFC 3986 URL编码
      return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    } catch (e) {
      return '';
    }
  }

  getSignHeaders(originHeaders, needSignHeaders = []) {
    const HEADER_KEYS_TO_IGNORE = new Set([
      "authorization",
      "content-length",
      "user-agent",
      "presigned-expires",
      "expect",
    ]);

    function trimHeaderValue(header) {
      return header.toString?.().trim().replace(/\s+/g, ' ') ?? '';
    }

    let h = Object.keys(originHeaders);
    // 根据 needSignHeaders 过滤
    if (Array.isArray(needSignHeaders) && needSignHeaders.length > 0) {
      const needSignSet = new Set([...needSignHeaders, 'x-date', 'host'].map((k) => k.toLowerCase()));
      h = h.filter((k) => needSignSet.has(k.toLowerCase()));
    }
    // 根据 ignore headers 过滤
    h = h.filter((k) => !HEADER_KEYS_TO_IGNORE.has(k.toLowerCase()));

    const signedHeaderKeys = h
      .slice()
      .map((k) => k.toLowerCase())
      .sort()
      .join(';');
    const canonicalHeaders = h
      .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
      .map((k) => `${k.toLowerCase()}:${trimHeaderValue(originHeaders[k])}`)
      .join('\n');
    return [signedHeaderKeys, canonicalHeaders];
  }

  sign(params) {
    const {
      headers = {},
      query = {},
      region = '',
      serviceName = '',
      method = '',
      pathName = '/',
      accessKeyId = '',
      secretAccessKey = '',
      needSignHeaderKeys = [],
      bodySha,
    } = params;

    const datetime = headers["X-Date"];
    const date = datetime.substring(0, 8); // YYYYMMDD

    // 创建正规化请求
    const [signedHeaders, canonicalHeaders] = this.getSignHeaders(headers, needSignHeaderKeys);
    const canonicalRequest = [
      method.toUpperCase(),
      pathName,
      this.queryParamsToString(query) || '',
      `${canonicalHeaders}\n`,
      signedHeaders,
      bodySha || this.hash(''),
    ].join('\n');

    const credentialScope = [date, region, serviceName, "request"].join('/');

    // 创建签名字符串
    const stringToSign = ["HMAC-SHA256", datetime, credentialScope, this.hash(canonicalRequest)].join('\n');

    // 添加调试信息
    functions.logger.info('签名调试信息:');
    functions.logger.info('- CanonicalRequest:', canonicalRequest);
    functions.logger.info('- StringToSign:', stringToSign);
    functions.logger.info('- CredentialScope:', credentialScope);

    // 计算签名
    const kDate = this.hmac(secretAccessKey, date);
    const kRegion = this.hmac(kDate, region);
    const kService = this.hmac(kRegion, serviceName);
    const kSigning = this.hmac(kService, "request");
    const signature = this.hmac(kSigning, stringToSign).toString('hex');

    functions.logger.info('- Signature:', signature);

    return [
      "HMAC-SHA256",
      `Credential=${accessKeyId}/${credentialScope},`,
      `SignedHeaders=${signedHeaders},`,
      `Signature=${signature}`,
    ].join(' ');
  }

  async makeRequestWithOfficialSDK(action, version, body) {
    // 完全按照Python示例手动实现签名，不使用火山引擎SDK
    const queryParams = {
      Action: action,
      Version: version
    };

    const requestBody = JSON.stringify(body);
    const bodyHash = this.hash(requestBody);

    // 获取当前时间
    const now = new Date();
    const xDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = xDate.substring(0, 8);

    // 构建查询字符串
    const queryString = Object.keys(queryParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    // 构建规范请求
    const method = 'POST';
    const canonicalUri = '/';
    const canonicalQuerystring = queryString;
    const signedHeaders = 'content-type;host;x-content-sha256;x-date';
    const contentType = 'application/json';
    const host = 'visual.volcengineapi.com';

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-content-sha256:${bodyHash}\n` +
      `x-date:${xDate}\n`;

    const canonicalRequest =
      `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

    // 构建签名字符串
    const algorithm = 'HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/request`;
    const stringToSign =
      `${algorithm}\n${xDate}\n${credentialScope}\n${this.hash(canonicalRequest)}`;

    // 生成签名
    const signature = this.generateSignature(this.secretAccessKey, dateStamp, this.region, this.service, stringToSign);

    // 构建授权头
    const authorizationHeader =
      `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // 构建请求头
    const headers = {
      'Content-Type': contentType,
      'Host': host,
      'X-Content-Sha256': bodyHash,
      'X-Date': xDate,
      'Authorization': authorizationHeader
    };

    const fullUrl = `${this.baseUrl}?${queryString}`;

    // 添加调试信息
    functions.logger.info('完全手动实现签名 - POST请求:');
    functions.logger.info('- URL:', fullUrl);
    functions.logger.info('- Method:', method);
    functions.logger.info('- Headers:', JSON.stringify(headers, null, 2));
    functions.logger.info('- Body:', requestBody);
    functions.logger.info('- Body Hash:', bodyHash);
    functions.logger.info('- Canonical Request:', canonicalRequest);
    functions.logger.info('- String to Sign:', stringToSign);
    functions.logger.info('- Signature:', signature);

    const response = await fetch(fullUrl, {
      method: method,
      headers: headers,
      body: requestBody
    });

    functions.logger.info('HTTP响应状态 - Status:', response.status);
    functions.logger.info('HTTP响应状态 - StatusText:', response.statusText);

    const responseText = await response.text();
    functions.logger.info('原始响应内容:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      throw new Error(`即梦AI API错误: ${errorData.ResponseMetadata?.Error?.Message || errorData.message}`);
    }

    return JSON.parse(responseText);
  }

  async makeRequest(path, method, body) {
    const url = `${this.baseUrl}${path}`;

    // 恢复使用当前时间戳，因为我们的签名算法已经验证正确
    const now = new Date();
    const xDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const timestamp = Math.floor(now.getTime() / 1000).toString();

    // 添加时间调试信息
    functions.logger.info('时间调试 - 当前时间:', now.toISOString());
    functions.logger.info('时间调试 - X-Date格式:', xDate);
    functions.logger.info('时间调试 - Timestamp:', timestamp);

    // 尝试多种认证方式
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(body) || '').digest('hex');

    const headers = {
      'Content-Type': 'application/json',
      'X-Date': xDate,
      'X-Content-Sha256': payloadHash,
      'Authorization': this.generateAuthHeader(method, path, body, timestamp, xDate)
    };

    // 添加更多调试信息
    functions.logger.info('请求详细信息:');
    functions.logger.info('- URL:', url);
    functions.logger.info('- Method:', method);
    functions.logger.info('- Headers:', JSON.stringify(headers, null, 2));
    functions.logger.info('- Body:', JSON.stringify(body, null, 2));

    functions.logger.info('调用即梦AI API - URL:', url);
    functions.logger.info('调用即梦AI API - Method:', method);
    functions.logger.info('调用即梦AI API - Content-Type:', headers['Content-Type']);
    functions.logger.info('调用即梦AI API - X-Date:', headers['X-Date']);
    functions.logger.info('调用即梦AI API - X-Content-Sha256:', headers['X-Content-Sha256']);
    functions.logger.info('调用即梦AI API - Authorization:', headers['Authorization']);
    functions.logger.info('调用即梦AI API - Body:', JSON.stringify(body));

    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });

    functions.logger.info('HTTP响应状态 - Status:', response.status);
    functions.logger.info('HTTP响应状态 - StatusText:', response.statusText);

    const responseText = await response.text();
    functions.logger.info('原始响应内容:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      functions.logger.error('JSON解析失败:', error.message);
      throw new Error(`API响应格式错误: ${responseText}`);
    }

    functions.logger.info('即梦AI API响应:', responseData);

    return responseData;
  }

  generateReqKey() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAuthHeader(method, path, body, timestamp, xDate) {
    // 从xDate中提取日期部分 (YYYYMMDD)
    const date = xDate.substr(0, 8);
    const credentialScope = `${date}/${this.region}/${this.service}/request`;

    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(body) || '').digest('hex');
    const canonicalHeaders = `content-type:application/json\nhost:${new URL(this.baseUrl).host}\nx-content-sha256:${payloadHash}\nx-date:${xDate}\n`;
    const signedHeaders = 'content-type;host;x-content-sha256;x-date';

    // 分离路径和查询参数
    const [pathname, querystring] = path.split('?');
    let canonicalQueryString = '';
    if (querystring) {
      // 解析查询参数并按字母顺序排序
      const params = new URLSearchParams(querystring);
      const sortedParams = new URLSearchParams();
      [...params.keys()].sort().forEach(key => {
        sortedParams.append(key, params.get(key));
      });
      canonicalQueryString = sortedParams.toString();
    }

    const canonicalRequest = [
      method,
      pathname || '/',
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = [
      algorithm,
      xDate,
      credentialScope,
      canonicalRequestHash
    ].join('\n');

    // 添加调试日志
    functions.logger.info('签名调试 - Canonical Request:', canonicalRequest);
    functions.logger.info('签名调试 - String to Sign:', stringToSign);

    // 添加密钥派生调试信息
    functions.logger.info('密钥派生调试 - AWS4 + Secret:', `AWS4${this.secretAccessKey}`);

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(date).digest();
    functions.logger.info('密钥派生调试 - kDate (hex):', kDate.toString('hex'));

    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    functions.logger.info('密钥派生调试 - kRegion (hex):', kRegion.toString('hex'));

    const kService = crypto.createHmac('sha256', kRegion).update(this.service).digest();
    functions.logger.info('密钥派生调试 - kService (hex):', kService.toString('hex'));

    const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
    functions.logger.info('密钥派生调试 - kSigning (hex):', kSigning.toString('hex'));

    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    functions.logger.info('最终签名计算结果:', signature);

    return `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }
}

// 创建视频生成任务
exports.createVideoTask = functions.https.onCall(async (data, context) => {
  try {
    // 验证用户身份
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '用户未登录');
    }

    const { imageUrl, prompt, musicStyle, aspectRatio } = data;

    if (!imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', '图片URL不能为空');
    }

    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', '提示词不能为空');
    }

    const userId = context.auth.uid;

    // 创建任务记录
    const taskRef = db.collection('videoTasks').doc();
    const taskId = taskRef.id;

    const taskData = {
      id: taskId,
      userId,
      imageUrl,
      prompt,
      musicStyle: musicStyle || 'Joyful',
      aspectRatio: aspectRatio || '16:9',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await taskRef.set(taskData);

    // 调用即梦AI API
    const dreaminaService = new DreaminaAPIService();
    const dreaminaTaskId = await dreaminaService.createVideoTask({
      imageUrl,
      prompt,
      musicStyle,
      aspectRatio
    });

    // 更新任务状态
    await taskRef.update({
      status: 'processing',
      dreaminaTaskId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 开始轮询任务状态
    pollTaskStatus(taskId, dreaminaTaskId);

    return { taskId };
  } catch (error) {
    functions.logger.error('创建视频任务失败:', error);
    throw new functions.https.HttpsError('internal', '创建任务失败');
  }
});

// 轮询任务状态
async function pollTaskStatus(taskId, dreaminaTaskId, attempt = 0) {
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

  const dreaminaService = new DreaminaAPIService();
  try {
    const result = await dreaminaService.getTaskResult(dreaminaTaskId);

    if (result.status === 'done' && result.videoUrl) {
      // 将视频URL转存到Firebase Storage
      const savedVideoUrl = await saveVideoToStorage(result.videoUrl, taskId);

      await db.collection('videoTasks').doc(taskId).update({
        status: 'completed',
        videoUrl: savedVideoUrl,
        originalVideoUrl: result.videoUrl,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else if (result.status === 'failed') {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'failed',
        error: result.error || '生成失败',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // 继续轮询
      setTimeout(() => {
        pollTaskStatus(taskId, dreaminaTaskId, attempt + 1);
      }, delayMs);
    }
  } catch (error) {
    functions.logger.error(`轮询任务状态失败 (attempt ${attempt}):`, error);
    if (attempt < maxAttempts - 1) {
      setTimeout(() => {
        pollTaskStatus(taskId, dreaminaTaskId, attempt + 1);
      }, delayMs);
    } else {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'failed',
        error: '轮询失败',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}

// 将视频保存到Firebase Storage
async function saveVideoToStorage(videoUrl, taskId) {
  try {
    // 下载视频
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    const fileName = `videos/${taskId}.mp4`;
    const file = storage.bucket().file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'video/mp4'
      }
    });

    // 生成公开URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;

    return publicUrl;
  } catch (error) {
    functions.logger.error('保存视频到Storage失败:', error);
    throw error;
  }
}

// 上传图片
exports.uploadImage = functions.https.onCall(async (data, context) => {
  try {
    const { imageData, fileName, contentType } = data;

    // 验证必要参数
    if (!imageData || !fileName) {
      throw new functions.https.HttpsError('invalid-argument', '缺少必要参数');
    }

    // 验证用户身份
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '用户未登录');
    }

    const userId = context.auth.uid;

    // 生成唯一文件名
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const imagePath = `users/${userId}/images/${timestamp}_${cleanFileName}`;

    // 将base64数据转换为Buffer
    const buffer = Buffer.from(imageData, 'base64');

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new functions.https.HttpsError('invalid-argument', '图片大小不能超过 10MB');
    }

    // 上传到Storage
    const file = storage.bucket().file(imagePath);
    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // 获取下载URL
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491' // 长期有效
    });

    return {
      downloadURL,
      imagePath
    };

  } catch (error) {
    functions.logger.error('上传图片失败:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', '上传失败');
  }
});

// 获取用户的视频任务列表
exports.getUserVideoTasks = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '用户未登录');
    }

    const userId = context.auth.uid;
    const { limit = 20, offset = 0 } = data;

    const tasksSnapshot = await db.collection('videoTasks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { tasks };
  } catch (error) {
    functions.logger.error('获取用户视频任务失败:', error);
    throw new functions.https.HttpsError('internal', '获取任务列表失败');
  }
});