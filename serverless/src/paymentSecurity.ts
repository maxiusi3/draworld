// 语言: TypeScript
// 说明: 支付安全与重试机制

import crypto from 'crypto';

// 支付宝官方IP白名单（生产环境需要更新为最新IP段）
const ALIPAY_IP_WHITELIST = [
  '110.75.143.0/24',
  '203.119.24.0/24', 
  '203.119.25.0/24',
  '106.11.204.0/24',
  '110.75.225.0/24',
  '110.75.226.0/24',
  '110.75.227.0/24',
  '110.75.228.0/24',
  '110.75.229.0/24',
  '110.75.230.0/24',
  // 开发环境允许本地IP
  '127.0.0.1',
  '::1',
  '0.0.0.0',
];

// 重试配置
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

// 失败回调记录
interface FailedCallback {
  id: string;
  orderId: string;
  notifyData: any;
  attempts: number;
  lastAttempt: number;
  nextRetry: number;
  error: string;
  createdAt: number;
}

// 内存存储（生产环境应使用Redis或数据库）
const failedCallbacks = new Map<string, FailedCallback>();
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export class PaymentSecurity {
  private retryConfig: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  // IP白名单验证
  verifyIPWhitelist(clientIP: string): boolean {
    // 开发模式跳过IP验证
    if (process.env.NODE_ENV === 'development') {
      console.log('[PAYMENT SECURITY] 开发模式：跳过IP白名单验证');
      return true;
    }

    // 检查是否在白名单中
    for (const allowedIP of ALIPAY_IP_WHITELIST) {
      if (this.isIPInRange(clientIP, allowedIP)) {
        return true;
      }
    }

    console.error('[PAYMENT SECURITY] IP不在白名单中:', clientIP);
    return false;
  }

  // 检查IP是否在指定范围内
  private isIPInRange(ip: string, range: string): boolean {
    if (range.includes('/')) {
      // CIDR格式
      const [network, prefixLength] = range.split('/');
      const prefix = parseInt(prefixLength, 10);
      
      try {
        const ipBuffer = this.ipToBuffer(ip);
        const networkBuffer = this.ipToBuffer(network);
        
        const mask = this.createMask(prefix, ipBuffer.length === 16);
        
        for (let i = 0; i < networkBuffer.length; i++) {
          if ((ipBuffer[i] & mask[i]) !== (networkBuffer[i] & mask[i])) {
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('[PAYMENT SECURITY] IP范围检查失败:', error);
        return false;
      }
    } else {
      // 单个IP
      return ip === range;
    }
  }

  // IP转Buffer
  private ipToBuffer(ip: string): Buffer {
    if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':');
      const buffer = Buffer.alloc(16);
      // 简化的IPv6处理
      return buffer;
    } else {
      // IPv4
      const parts = ip.split('.').map(part => parseInt(part, 10));
      return Buffer.from(parts);
    }
  }

  // 创建子网掩码
  private createMask(prefixLength: number, isIPv6: boolean): Buffer {
    const totalBits = isIPv6 ? 128 : 32;
    const bytes = isIPv6 ? 16 : 4;
    const mask = Buffer.alloc(bytes);
    
    for (let i = 0; i < bytes; i++) {
      const bitsInByte = Math.min(8, Math.max(0, prefixLength - i * 8));
      mask[i] = (0xFF << (8 - bitsInByte)) & 0xFF;
    }
    
    return mask;
  }

  // 频率限制检查
  checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    let record = rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
    }
    
    if (record.count >= maxRequests) {
      console.warn('[PAYMENT SECURITY] 频率限制触发:', identifier, record.count);
      return false;
    }
    
    record.count++;
    return true;
  }

  // 签名验证（增强版）
  verifySignature(data: any, signature: string, publicKey: string, algorithm: 'RSA2' | 'RSA' = 'RSA2'): boolean {
    try {
      // 构建待签名字符串
      const signString = this.buildSignString(data);
      
      // 验证签名
      const verify = crypto.createVerify(algorithm === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1');
      verify.update(signString, 'utf8');
      
      const isValid = verify.verify(publicKey, signature, 'base64');
      
      if (!isValid) {
        console.error('[PAYMENT SECURITY] 签名验证失败:', {
          signString: signString.substring(0, 100) + '...',
          signature: signature.substring(0, 20) + '...',
        });
      }
      
      return isValid;
    } catch (error) {
      console.error('[PAYMENT SECURITY] 签名验证异常:', error);
      return false;
    }
  }

  // 构建签名字符串
  private buildSignString(data: any): string {
    const sortedKeys = Object.keys(data)
      .filter(key => key !== 'sign' && key !== 'sign_type' && data[key] !== '' && data[key] !== null && data[key] !== undefined)
      .sort();
    
    return sortedKeys.map(key => `${key}=${data[key]}`).join('&');
  }

  // 记录失败的回调
  recordFailedCallback(orderId: string, notifyData: any, error: string): string {
    const id = `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const failedCallback: FailedCallback = {
      id,
      orderId,
      notifyData,
      attempts: 1,
      lastAttempt: Date.now(),
      nextRetry: Date.now() + this.retryConfig.baseDelay,
      error,
      createdAt: Date.now(),
    };
    
    failedCallbacks.set(id, failedCallback);
    console.log('[PAYMENT SECURITY] 记录失败回调:', id, orderId);
    
    return id;
  }

  // 重试失败的回调
  async retryFailedCallbacks(): Promise<void> {
    const now = Date.now();
    const toRetry: FailedCallback[] = [];
    
    // 找出需要重试的回调
    for (const [id, callback] of failedCallbacks.entries()) {
      if (callback.nextRetry <= now && callback.attempts < this.retryConfig.maxAttempts) {
        toRetry.push(callback);
      } else if (callback.attempts >= this.retryConfig.maxAttempts) {
        // 超过最大重试次数，移除
        failedCallbacks.delete(id);
        console.error('[PAYMENT SECURITY] 回调重试失败，已放弃:', id, callback.orderId);
      }
    }
    
    // 执行重试
    for (const callback of toRetry) {
      try {
        console.log('[PAYMENT SECURITY] 重试回调:', callback.id, callback.orderId, `第${callback.attempts}次`);
        
        // 这里应该调用实际的回调处理逻辑
        await this.executeCallback(callback.notifyData);
        
        // 重试成功，移除记录
        failedCallbacks.delete(callback.id);
        console.log('[PAYMENT SECURITY] 回调重试成功:', callback.id, callback.orderId);
        
      } catch (error) {
        // 重试失败，更新记录
        callback.attempts++;
        callback.lastAttempt = now;
        callback.error = error.message || 'Unknown error';
        
        // 计算下次重试时间（指数退避）
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, callback.attempts - 1),
          this.retryConfig.maxDelay
        );
        callback.nextRetry = now + delay;
        
        console.error('[PAYMENT SECURITY] 回调重试失败:', callback.id, callback.orderId, error);
      }
    }
  }

  // 执行回调（模拟）
  private async executeCallback(notifyData: any): Promise<void> {
    // 这里应该调用实际的订单处理逻辑
    // 模拟处理
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟可能的失败
    if (Math.random() < 0.3) {
      throw new Error('模拟回调处理失败');
    }
  }

  // 获取失败回调统计
  getFailedCallbackStats(): { total: number; pending: number; abandoned: number } {
    let pending = 0;
    let abandoned = 0;
    
    for (const callback of failedCallbacks.values()) {
      if (callback.attempts >= this.retryConfig.maxAttempts) {
        abandoned++;
      } else {
        pending++;
      }
    }
    
    return {
      total: failedCallbacks.size,
      pending,
      abandoned,
    };
  }

  // 清理过期记录
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    // 清理失败回调记录
    for (const [id, callback] of failedCallbacks.entries()) {
      if (now - callback.createdAt > maxAge) {
        failedCallbacks.delete(id);
      }
    }
    
    // 清理频率限制记录
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
}

// 单例实例
export const paymentSecurity = new PaymentSecurity();

// 定时清理任务
setInterval(() => {
  paymentSecurity.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次

// 定时重试任务
setInterval(() => {
  paymentSecurity.retryFailedCallbacks().catch(error => {
    console.error('[PAYMENT SECURITY] 重试任务失败:', error);
  });
}, 30 * 1000); // 每30秒检查一次重试
