// 语言: TypeScript
// 说明: 订单系统数据访问层，基于TableStore实现

import TableStore from 'tablestore';
import { v4 as uuidv4 } from 'uuid';

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'PENDING',       // 待支付
  PAID = 'PAID',            // 已支付
  FAILED = 'FAILED',        // 支付失败
  CANCELLED = 'CANCELLED',   // 已取消
  REFUNDED = 'REFUNDED',    // 已退款
}

// 支付方式枚举
export enum PaymentMethod {
  ALIPAY = 'ALIPAY',        // 支付宝
  WECHAT = 'WECHAT',        // 微信支付
  BANK_CARD = 'BANK_CARD',  // 银行卡
}

// 订单接口
export interface Order {
  tenantId: string;
  orderId: string;
  userId: string;
  packageId: string;
  packageName: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceYuan: number;
  currency: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  paymentUrl?: string;
  idempotencyKey: string;
  failureReason?: string;
  refundReason?: string;
  refundAmount?: number;
  creditsGranted: boolean;
  notificationSent: boolean;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
  expiredAt?: number;
}

// 支付日志接口
export interface PaymentLog {
  tenantId: string;
  logId: string;
  orderId: string;
  userId: string;
  action: string;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  requestData?: string;
  responseData?: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  processingTime: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
}

export class OrdersRepository {
  private client: any;
  private instanceName: string;
  private tenantId: string;

  constructor(instanceName: string, tenantId: string = 'default') {
    this.instanceName = instanceName;
    this.tenantId = tenantId;
    this.client = new TableStore.Client({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
      secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
      endpoint: `https://${instanceName}.cn-hangzhou.ots.aliyuncs.com`,
      instancename: instanceName,
    });
  }

  // 生成订单ID
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `order_${timestamp}_${random}`;
  }

  // 生成日志ID
  private generateLogId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, '');
    return `log_${timestamp}_${uuid}`;
  }

  // 创建订单
  async createOrder(orderData: Omit<Order, 'tenantId' | 'orderId' | 'status' | 'creditsGranted' | 'notificationSent' | 'createdAt' | 'updatedAt'>): Promise<Order | null> {
    try {
      const orderId = this.generateOrderId();
      const now = Date.now();
      const expiredAt = now + (30 * 60 * 1000); // 30分钟后过期

      const order: Order = {
        tenantId: this.tenantId,
        orderId,
        status: OrderStatus.PENDING,
        creditsGranted: false,
        notificationSent: false,
        createdAt: now,
        updatedAt: now,
        expiredAt,
        currency: 'CNY',
        ...orderData,
      };

      const params = {
        tableName: 'orders',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'orderId': orderId }
        ],
        attributeColumns: [
          { 'userId': order.userId },
          { 'packageId': order.packageId },
          { 'packageName': order.packageName },
          { 'credits': order.credits },
          { 'bonusCredits': order.bonusCredits },
          { 'totalCredits': order.totalCredits },
          { 'priceYuan': order.priceYuan },
          { 'currency': order.currency },
          { 'status': order.status },
          { 'idempotencyKey': order.idempotencyKey },
          { 'creditsGranted': order.creditsGranted },
          { 'notificationSent': order.notificationSent },
          { 'createdAt': order.createdAt },
          { 'updatedAt': order.updatedAt },
          { 'expiredAt': order.expiredAt },
        ],
      };

      await this.client.putRow(params);
      return order;
    } catch (error) {
      console.error('创建订单失败:', error);
      return null;
    }
  }

  // 获取订单详情
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const params = {
        tableName: 'orders',
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'orderId': orderId }
        ],
      };

      const result = await this.client.getRow(params);
      if (!result.row || !result.row.attributes) {
        return null;
      }

      const attrs = result.row.attributes;
      return {
        tenantId: this.tenantId,
        orderId,
        userId: attrs.userId[0],
        packageId: attrs.packageId[0],
        packageName: attrs.packageName[0],
        credits: attrs.credits[0],
        bonusCredits: attrs.bonusCredits[0],
        totalCredits: attrs.totalCredits[0],
        priceYuan: attrs.priceYuan[0],
        currency: attrs.currency?.[0] || 'CNY',
        status: attrs.status[0] as OrderStatus,
        paymentMethod: attrs.paymentMethod?.[0] as PaymentMethod,
        paymentId: attrs.paymentId?.[0],
        paymentUrl: attrs.paymentUrl?.[0],
        idempotencyKey: attrs.idempotencyKey[0],
        failureReason: attrs.failureReason?.[0],
        refundReason: attrs.refundReason?.[0],
        refundAmount: attrs.refundAmount?.[0],
        creditsGranted: attrs.creditsGranted?.[0] || false,
        notificationSent: attrs.notificationSent?.[0] || false,
        createdAt: attrs.createdAt[0],
        updatedAt: attrs.updatedAt[0],
        paidAt: attrs.paidAt?.[0],
        expiredAt: attrs.expiredAt?.[0],
      };
    } catch (error) {
      console.error('获取订单失败:', error);
      return null;
    }
  }

  // 更新订单状态
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updateData: Partial<Pick<Order, 'paymentMethod' | 'paymentId' | 'paymentUrl' | 'failureReason' | 'refundReason' | 'refundAmount' | 'paidAt'>> = {}
  ): Promise<boolean> {
    try {
      const now = Date.now();
      const attributeColumns: any[] = [
        { 'status': status },
        { 'updatedAt': now },
      ];

      // 添加可选字段
      if (updateData.paymentMethod) attributeColumns.push({ 'paymentMethod': updateData.paymentMethod });
      if (updateData.paymentId) attributeColumns.push({ 'paymentId': updateData.paymentId });
      if (updateData.paymentUrl) attributeColumns.push({ 'paymentUrl': updateData.paymentUrl });
      if (updateData.failureReason) attributeColumns.push({ 'failureReason': updateData.failureReason });
      if (updateData.refundReason) attributeColumns.push({ 'refundReason': updateData.refundReason });
      if (updateData.refundAmount !== undefined) attributeColumns.push({ 'refundAmount': updateData.refundAmount });
      if (updateData.paidAt) attributeColumns.push({ 'paidAt': updateData.paidAt });

      const params = {
        tableName: 'orders',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'orderId': orderId }
        ],
        attributeColumns,
      };

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      return false;
    }
  }

  // 标记积分已发放
  async markCreditsGranted(orderId: string): Promise<boolean> {
    try {
      const params = {
        tableName: 'orders',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'orderId': orderId }
        ],
        attributeColumns: [
          { 'creditsGranted': true },
          { 'updatedAt': Date.now() },
        ],
      };

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('标记积分已发放失败:', error);
      return false;
    }
  }

  // 获取用户订单列表
  async getUserOrders(userId: string, limit: number = 20): Promise<Order[]> {
    try {
      const params = {
        tableName: 'orders',
        direction: TableStore.Direction.BACKWARD, // 按创建时间倒序
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'orderId': TableStore.INF_MAX }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'orderId': TableStore.INF_MIN }
        ],
        limit: 1000, // 扫描更多记录以过滤用户订单
      };

      const result = await this.client.getRange(params);
      const orders: Order[] = [];

      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.userId && attrs.userId[0] === userId) {
          orders.push({
            tenantId: this.tenantId,
            orderId: row.primaryKey[1].value,
            userId: attrs.userId[0],
            packageId: attrs.packageId[0],
            packageName: attrs.packageName[0],
            credits: attrs.credits[0],
            bonusCredits: attrs.bonusCredits[0],
            totalCredits: attrs.totalCredits[0],
            priceYuan: attrs.priceYuan[0],
            currency: attrs.currency?.[0] || 'CNY',
            status: attrs.status[0] as OrderStatus,
            paymentMethod: attrs.paymentMethod?.[0] as PaymentMethod,
            paymentId: attrs.paymentId?.[0],
            paymentUrl: attrs.paymentUrl?.[0],
            idempotencyKey: attrs.idempotencyKey[0],
            failureReason: attrs.failureReason?.[0],
            refundReason: attrs.refundReason?.[0],
            refundAmount: attrs.refundAmount?.[0],
            creditsGranted: attrs.creditsGranted?.[0] || false,
            notificationSent: attrs.notificationSent?.[0] || false,
            createdAt: attrs.createdAt[0],
            updatedAt: attrs.updatedAt[0],
            paidAt: attrs.paidAt?.[0],
            expiredAt: attrs.expiredAt?.[0],
          });

          if (orders.length >= limit) break;
        }
      }

      return orders;
    } catch (error) {
      console.error('获取用户订单列表失败:', error);
      return [];
    }
  }

  // 记录支付日志
  async logPaymentAction(logData: Omit<PaymentLog, 'tenantId' | 'logId' | 'createdAt'>): Promise<boolean> {
    try {
      const logId = this.generateLogId();
      const now = Date.now();

      const log: PaymentLog = {
        tenantId: this.tenantId,
        logId,
        createdAt: now,
        ...logData,
      };

      const params = {
        tableName: 'payment_logs',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'logId': logId }
        ],
        attributeColumns: [
          { 'orderId': log.orderId },
          { 'userId': log.userId },
          { 'action': log.action },
          { 'status': log.status },
          { 'processingTime': log.processingTime },
          { 'createdAt': log.createdAt },
        ],
      };

      // 添加可选字段
      if (log.paymentMethod) params.attributeColumns.push({ 'paymentMethod': log.paymentMethod });
      if (log.paymentId) params.attributeColumns.push({ 'paymentId': log.paymentId });
      if (log.requestData) params.attributeColumns.push({ 'requestData': log.requestData });
      if (log.responseData) params.attributeColumns.push({ 'responseData': log.responseData });
      if (log.errorCode) params.attributeColumns.push({ 'errorCode': log.errorCode });
      if (log.errorMessage) params.attributeColumns.push({ 'errorMessage': log.errorMessage });
      if (log.ipAddress) params.attributeColumns.push({ 'ipAddress': log.ipAddress });
      if (log.userAgent) params.attributeColumns.push({ 'userAgent': log.userAgent });

      await this.client.putRow(params);
      return true;
    } catch (error) {
      console.error('记录支付日志失败:', error);
      return false;
    }
  }
}
