"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DreaminaAPIService = void 0;
const functions = require("firebase-functions");
const crypto = require("crypto");
const node_fetch_1 = require("node-fetch");
/**
 * 即梦AI API服务类
 * 用于调用即梦AI的视频生成API
 */
class DreaminaAPIService {
    constructor() {
        // 从环境变量获取API密钥
        this.accessKeyId = functions.config().dreamina?.access_key_id || process.env.DREAMINA_ACCESS_KEY_ID;
        this.secretAccessKey = functions.config().dreamina?.secret_access_key || process.env.DREAMINA_SECRET_ACCESS_KEY;
        this.baseUrl = 'https://ark.cn-beijing.volces.com';
        this.service = 'ark';
        this.region = 'cn-beijing';
        if (!this.accessKeyId || !this.secretAccessKey) {
            throw new Error('即梦AI API密钥未配置');
        }
        functions.logger.info('即梦AI服务初始化成功');
    }
    /**
     * 创建视频生成任务
     */
    async createVideoTask(params) {
        const { imageUrl, prompt, musicStyle = 'Joyful', aspectRatio = '16:9' } = params;
        const requestBody = {
            req_key: this.generateReqKey(),
            image_url: imageUrl,
            prompt: prompt,
            music_style: musicStyle,
            aspect_ratio: aspectRatio
        };
        const response = await this.makeRequest('/api/v3/video_generation', 'POST', requestBody);
        if (response.code !== 20000) {
            throw new Error(`即梦AI API错误: ${response.message}`);
        }
        return response.data.task_id;
    }
    /**
     * 获取任务结果
     */
    async getTaskResult(taskId) {
        const requestBody = {
            req_key: this.generateReqKey(),
            task_id: taskId
        };
        const response = await this.makeRequest('/api/v3/video_generation', 'GET', requestBody);
        if (response.code !== 20000) {
            throw new Error(`即梦AI API错误: ${response.message}`);
        }
        const taskData = response.data;
        return {
            status: taskData.status,
            videoUrl: taskData.video_url,
            error: taskData.error_message
        };
    }
    /**
     * 发送HTTP请求
     */
    async makeRequest(path, method, body) {
        const url = `${this.baseUrl}${path}`;
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const headers = {
            'Content-Type': 'application/json',
            'X-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
            'Authorization': this.generateAuthHeader(method, path, body, timestamp)
        };
        functions.logger.info('调用即梦AI API:', { url, method, headers: { ...headers, Authorization: '[HIDDEN]' } });
        const response = await (0, node_fetch_1.default)(url, {
            method,
            headers,
            body: method !== 'GET' ? JSON.stringify(body) : undefined
        });
        const responseData = await response.json();
        functions.logger.info('即梦AI API响应:', responseData);
        return responseData;
    }
    /**
     * 生成请求唯一标识
     */
    generateReqKey() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 生成AWS4签名认证头
     */
    generateAuthHeader(method, path, body, timestamp) {
        const date = new Date().toISOString().substr(0, 10).replace(/-/g, '');
        const credentialScope = `${date}/${this.region}/${this.service}/aws4_request`;
        // 创建规范请求
        const canonicalHeaders = `host:${new URL(this.baseUrl).host}\nx-date:${timestamp}\n`;
        const signedHeaders = 'host;x-date';
        const payloadHash = crypto.createHash('sha256').update(JSON.stringify(body) || '').digest('hex');
        const canonicalRequest = [
            method,
            path,
            '', // query string
            canonicalHeaders,
            signedHeaders,
            payloadHash
        ].join('\n');
        // 创建待签名字符串
        const algorithm = 'AWS4-HMAC-SHA256';
        const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
        const stringToSign = [
            algorithm,
            timestamp,
            credentialScope,
            canonicalRequestHash
        ].join('\n');
        // 计算签名
        const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(date).digest();
        const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
        const kService = crypto.createHmac('sha256', kRegion).update(this.service).digest();
        const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
        // 构建认证头
        return `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    }
}
exports.DreaminaAPIService = DreaminaAPIService;
