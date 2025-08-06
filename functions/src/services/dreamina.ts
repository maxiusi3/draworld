import { createHash, createHmac } from 'crypto';
import * as functions from 'firebase-functions';

interface SubmitTaskParams {
  imageUrl: string;
  prompt?: string;
  aspectRatio?: string;
}

interface TaskResult {
  status: 'processing' | 'done' | 'failed';
  videoUrl?: string;
  error?: string;
}

export class DreaminaAPIService {
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly endpoint = 'https://visual.volcengineapi.com';
  private readonly region = 'cn-north-1';
  private readonly service = 'cv';

  constructor() {
    // 优先使用functions.config()，然后回退到环境变量
    const config = functions.config();
    let accessKeyId = config.dreamina?.access_key_id || process.env.DREAMINA_ACCESS_KEY_ID;
    let secretAccessKey = config.dreamina?.secret_access_key || process.env.DREAMINA_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('即梦AI API密钥未配置。请使用Firebase CLI设置配置：firebase functions:config:set dreamina.access_key_id="YOUR_KEY" dreamina.secret_access_key="YOUR_SECRET"');
    }

    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;

    functions.logger.info('即梦AI服务初始化成功', {
      accessKeyId: this.accessKeyId ? `${this.accessKeyId.slice(0, 8)}...` : 'undefined',
      hasSecretKey: !!this.secretAccessKey,
      configSource: config.dreamina?.access_key_id ? 'functions.config()' : 'environment'
    });
  }

  /**
   * 提交图生视频任务
   */
  async submitTask(params: SubmitTaskParams): Promise<string> {
    const requestBody = {
      req_key: 'jimeng_vgfm_i2v_l20',
      image_urls: [params.imageUrl],
      prompt: params.prompt || '',
      aspect_ratio: params.aspectRatio || '16:9',
      seed: -1
    };

    const response = await this.makeRequest('CVSync2AsyncSubmitTask', requestBody);
    
    if (response.code !== 10000) {
      throw new Error(`提交任务失败: ${response.message}`);
    }
    
    return response.data.task_id;
  }

  /**
   * 获取任务结果
   */
  async getTaskResult(taskId: string): Promise<TaskResult> {
    const requestBody = {
      req_key: 'jimeng_vgfm_i2v_l20',
      task_id: taskId
    };

    const response = await this.makeRequest('CVSync2AsyncGetResult', requestBody);
    
    if (response.code !== 10000) {
      return {
        status: 'failed',
        error: response.message
      };
    }

    const { status } = response.data;
    
    if (status === 'done') {
      return {
        status: 'done',
        videoUrl: response.data.video_url
      };
    } else if (status === 'failed') {
      return {
        status: 'failed',
        error: response.data.error?.message || '生成失败'
      };
    } else {
      return {
        status: 'processing'
      };
    }
  }

  /**
   * 发起API请求
   */
  private async makeRequest(action: string, body: any): Promise<any> {
    const url = `${this.endpoint}/?Action=${action}&Version=2022-08-31`;
    const method = 'POST';
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const bodyStr = JSON.stringify(body);
    
    // 计算内容哈希
    const contentHash = createHash('sha256').update(bodyStr).digest('hex');
    
    // 构建签名
    const authorization = this.buildAuthorization(method, url, timestamp, contentHash, body);
    
    const headers = {
      'Host': 'visual.volcengineapi.com',
      'Content-Type': 'application/json',
      'X-Date': timestamp,
      'X-Content-Sha256': contentHash,
      'Authorization': authorization,
      'Region': this.region,
      'Service': this.service
    };

    functions.logger.info('调用即梦AI API:', { action, url });
    
    const response = await fetch(url, {
      method,
      headers,
      body: bodyStr
    });

    if (!response.ok) {
      throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    functions.logger.info('即梦AI API响应:', result);
    
    return result;
  }

  /**
   * 构建签名认证头
   */
  private buildAuthorization(method: string, url: string, timestamp: string, contentHash: string, body: any): string {
    const urlObj = new URL(url);
    const canonicalUri = urlObj.pathname;
    const canonicalQueryString = urlObj.search.slice(1); // 去掉问号
    
    // 构建规范化请求
    const canonicalHeaders = [
      `content-type:application/json`,
      `host:visual.volcengineapi.com`,
      `x-content-sha256:${contentHash}`,
      `x-date:${timestamp}`
    ].join('\n');
    
    const signedHeaders = 'content-type;host;x-content-sha256;x-date';
    
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      '',
      signedHeaders,
      contentHash
    ].join('\n');
    
    // 构建待签名字符串
    const algorithm = 'HMAC-SHA256';
    const credentialScope = `${timestamp.slice(0, 8)}/${this.region}/${this.service}/request`;
    const stringToSign = [
      algorithm,
      timestamp,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    // 计算签名
    const kDate = createHmac('sha256', this.secretAccessKey).update(timestamp.slice(0, 8)).digest();
    const kRegion = createHmac('sha256', kDate).update(this.region).digest();
    const kService = createHmac('sha256', kRegion).update(this.service).digest();
    const kSigning = createHmac('sha256', kService).update('request').digest();
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    
    // 构建认证头
    const credential = `${this.accessKeyId}/${credentialScope}`;
    return `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }
}