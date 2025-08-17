// 语言: TypeScript
// 说明: 支付宝支付服务集成，提供统一的支付接口

import crypto from 'crypto';

// 支付宝配置接口
export interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gatewayUrl: string;
  notifyUrl: string;
  returnUrl: string;
  signType: 'RSA2' | 'RSA';
  charset: 'utf-8';
  version: '1.0';
  format: 'JSON';
}

// 支付请求参数
export interface AlipayTradeCreateRequest {
  outTradeNo: string;        // 商户订单号
  totalAmount: string;       // 订单总金额（元）
  subject: string;           // 订单标题
  body?: string;             // 订单描述
  timeoutExpress?: string;   // 订单超时时间
  productCode: string;       // 产品码
  passbackParams?: string;   // 回传参数
}

// 支付响应
export interface AlipayTradeCreateResponse {
  code: string;
  msg: string;
  subCode?: string;
  subMsg?: string;
  tradeNo?: string;          // 支付宝交易号
  outTradeNo?: string;       // 商户订单号
  qrCode?: string;           // 二维码内容
}

// 支付查询响应
export interface AlipayTradeQueryResponse {
  code: string;
  msg: string;
  tradeNo?: string;
  outTradeNo?: string;
  tradeStatus?: 'WAIT_BUYER_PAY' | 'TRADE_SUCCESS' | 'TRADE_FINISHED' | 'TRADE_CLOSED';
  totalAmount?: string;
  buyerPayAmount?: string;
  gmtPayment?: string;
}

// 支付通知参数
export interface AlipayNotifyParams {
  [key: string]: string;
  notify_time: string;
  notify_type: string;
  notify_id: string;
  app_id: string;
  charset: string;
  version: string;
  sign_type: string;
  sign: string;
  trade_no: string;
  out_trade_no: string;
  trade_status: string;
  total_amount: string;
  receipt_amount: string;
  buyer_pay_amount: string;
  gmt_payment: string;
  gmt_create: string;
}

export class AlipayService {
  private config: AlipayConfig;

  constructor(config: AlipayConfig) {
    this.config = config;
  }

  // 创建支付订单
  async createTrade(request: AlipayTradeCreateRequest): Promise<AlipayTradeCreateResponse> {
    try {
      // 构建请求参数
      const bizContent = {
        out_trade_no: request.outTradeNo,
        total_amount: request.totalAmount,
        subject: request.subject,
        body: request.body,
        timeout_express: request.timeoutExpress || '30m',
        product_code: request.productCode,
        passback_params: request.passbackParams,
      };

      const params = {
        app_id: this.config.appId,
        method: 'alipay.trade.precreate', // 预创建订单，生成二维码
        charset: this.config.charset,
        sign_type: this.config.signType,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: this.config.version,
        notify_url: this.config.notifyUrl,
        biz_content: JSON.stringify(bizContent),
      };

      // 生成签名
      const sign = this.generateSign(params);
      params.sign = sign;

      // 发送请求到支付宝网关
      const response = await this.sendRequest(params);
      
      return this.parseResponse(response);
    } catch (error) {
      console.error('创建支付订单失败:', error);
      return {
        code: '40004',
        msg: '业务处理失败',
        subCode: 'SYSTEM_ERROR',
        subMsg: error.message,
      };
    }
  }

  // 查询支付状态
  async queryTrade(outTradeNo: string): Promise<AlipayTradeQueryResponse> {
    try {
      const bizContent = {
        out_trade_no: outTradeNo,
      };

      const params = {
        app_id: this.config.appId,
        method: 'alipay.trade.query',
        charset: this.config.charset,
        sign_type: this.config.signType,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: this.config.version,
        biz_content: JSON.stringify(bizContent),
      };

      const sign = this.generateSign(params);
      params.sign = sign;

      const response = await this.sendRequest(params);
      return this.parseQueryResponse(response);
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return {
        code: '40004',
        msg: '业务处理失败',
      };
    }
  }

  // 验证支付通知签名
  verifyNotify(params: AlipayNotifyParams): boolean {
    try {
      const sign = params.sign;
      delete params.sign;
      delete params.sign_type;

      const expectedSign = this.generateSign(params);
      return sign === expectedSign;
    } catch (error) {
      console.error('验证支付通知签名失败:', error);
      return false;
    }
  }

  // 生成签名
  private generateSign(params: Record<string, any>): string {
    // 排序参数
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
      .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 使用私钥签名
    const sign = crypto
      .createSign(this.config.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1')
      .update(signString, 'utf8')
      .sign(this.config.privateKey, 'base64');

    return sign;
  }

  // 发送请求到支付宝网关
  private async sendRequest(params: Record<string, any>): Promise<any> {
    // 在实际实现中，这里会发送HTTP请求到支付宝网关
    // 目前返回模拟响应
    console.log('[ALIPAY] 模拟发送请求到支付宝网关:', params);
    
    // 模拟成功响应
    return {
      alipay_trade_precreate_response: {
        code: '10000',
        msg: 'Success',
        out_trade_no: params.biz_content ? JSON.parse(params.biz_content).out_trade_no : '',
        qr_code: 'https://qr.alipay.com/bax08888888888888888',
      },
      sign: 'mock_sign_value',
    };
  }

  // 解析支付创建响应
  private parseResponse(response: any): AlipayTradeCreateResponse {
    const result = response.alipay_trade_precreate_response || response;
    
    return {
      code: result.code,
      msg: result.msg,
      subCode: result.sub_code,
      subMsg: result.sub_msg,
      tradeNo: result.trade_no,
      outTradeNo: result.out_trade_no,
      qrCode: result.qr_code,
    };
  }

  // 解析支付查询响应
  private parseQueryResponse(response: any): AlipayTradeQueryResponse {
    const result = response.alipay_trade_query_response || response;
    
    return {
      code: result.code,
      msg: result.msg,
      tradeNo: result.trade_no,
      outTradeNo: result.out_trade_no,
      tradeStatus: result.trade_status,
      totalAmount: result.total_amount,
      buyerPayAmount: result.buyer_pay_amount,
      gmtPayment: result.gmt_payment,
    };
  }
}

// 支付宝配置工厂
export class AlipayConfigFactory {
  static createConfig(env: 'development' | 'production' = 'development'): AlipayConfig {
    if (env === 'production') {
      return {
        appId: process.env.ALIPAY_APP_ID || '',
        privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
        alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
        gatewayUrl: 'https://openapi.alipay.com/gateway.do',
        notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
        returnUrl: process.env.ALIPAY_RETURN_URL || '',
        signType: 'RSA2',
        charset: 'utf-8',
        version: '1.0',
        format: 'JSON',
      };
    } else {
      // 开发环境配置（沙箱）
      return {
        appId: process.env.ALIPAY_SANDBOX_APP_ID || '2021000000000000',
        privateKey: process.env.ALIPAY_SANDBOX_PRIVATE_KEY || 'mock_private_key',
        alipayPublicKey: process.env.ALIPAY_SANDBOX_PUBLIC_KEY || 'mock_public_key',
        gatewayUrl: 'https://openapi.alipaydev.com/gateway.do',
        notifyUrl: process.env.ALIPAY_SANDBOX_NOTIFY_URL || 'http://localhost:3000/api/payment/notify',
        returnUrl: process.env.ALIPAY_SANDBOX_RETURN_URL || 'http://localhost:3000/payment/success',
        signType: 'RSA2',
        charset: 'utf-8',
        version: '1.0',
        format: 'JSON',
      };
    }
  }
}

// 支付宝工具函数
export class AlipayUtils {
  // 生成商户订单号
  static generateOutTradeNo(prefix: string = 'ORDER'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  // 格式化金额（元转分）
  static formatAmount(yuan: number): string {
    return (yuan * 100 / 100).toFixed(2);
  }

  // 验证金额格式
  static validateAmount(amount: string): boolean {
    const regex = /^\d+(\.\d{1,2})?$/;
    return regex.test(amount) && parseFloat(amount) > 0;
  }

  // 生成支付二维码HTML
  static generateQRCodeHtml(qrCode: string, title: string = '扫码支付'): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      </head>
      <body style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
        <h2>${title}</h2>
        <div id="qrcode" style="margin: 20px auto;"></div>
        <p style="color: #666;">请使用支付宝扫描二维码完成支付</p>
        <script>
          QRCode.toCanvas(document.getElementById('qrcode'), '${qrCode}', {
            width: 256,
            height: 256,
            margin: 2
          });
        </script>
      </body>
      </html>
    `;
  }
}
