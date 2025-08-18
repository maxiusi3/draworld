// 语言: TypeScript
// 说明: 内容审核数据访问层，基于TableStore实现

import TableStore from 'tablestore';
import { v4 as uuidv4 } from 'uuid';

// 审核记录接口
export interface ModerationRecord {
  tenantId: string;
  recordId: string;
  contentType: 'ARTWORK' | 'COMMENT';
  contentId: string;
  contentTitle: string;
  contentBody: string;
  authorId: string;
  authorName: string;
  moderatorId: string;
  moderatorName: string;
  action: 'APPROVE' | 'REJECT' | 'PENDING';
  previousStatus: string;
  newStatus: string;
  reason?: string;
  reportCount: number;
  reportReasons?: string[];
  autoModerated: boolean;
  processingTime: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
}

// 举报记录接口
export interface ContentReport {
  tenantId: string;
  reportId: string;
  contentType: 'ARTWORK' | 'COMMENT';
  contentId: string;
  reporterId: string;
  reporterName: string;
  reason: 'SPAM' | 'INAPPROPRIATE' | 'COPYRIGHT' | 'HARASSMENT' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewerId?: string;
  reviewerName?: string;
  reviewNote?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  reviewedAt?: number;
}

// 审核统计接口
export interface ModerationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalReports: number;
  todayProcessed: number;
  avgProcessingTime: number;
}

export class ModerationRepository {
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

  // 生成记录ID
  private generateRecordId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, '');
    return `mod_${timestamp}_${uuid}`;
  }

  // 生成举报ID
  private generateReportId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, '');
    return `rpt_${timestamp}_${uuid}`;
  }

  // 创建审核记录
  async createModerationRecord(record: Omit<ModerationRecord, 'tenantId' | 'recordId' | 'createdAt'>): Promise<boolean> {
    try {
      const recordId = this.generateRecordId();
      const now = Date.now();

      const params = {
        tableName: 'moderation_records',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'recordId': recordId }
        ],
        attributeColumns: [
          { contentType: record.contentType },
          { contentId: record.contentId },
          { contentTitle: record.contentTitle },
          { contentBody: record.contentBody },
          { authorId: record.authorId },
          { authorName: record.authorName },
          { moderatorId: record.moderatorId },
          { moderatorName: record.moderatorName },
          { action: record.action },
          { previousStatus: record.previousStatus },
          { newStatus: record.newStatus },
          { reportCount: record.reportCount },
          { autoModerated: record.autoModerated },
          { processingTime: record.processingTime },
          { createdAt: now },
        ] as any[],
      };

      // 添加可选字段
      if (record.reason) params.attributeColumns.push({ reason: record.reason });
      if (record.reportReasons) params.attributeColumns.push({ reportReasons: JSON.stringify(record.reportReasons) });
      if (record.ipAddress) params.attributeColumns.push({ ipAddress: record.ipAddress });
      if (record.userAgent) params.attributeColumns.push({ userAgent: record.userAgent });

      await this.client.putRow(params);
      return true;
    } catch (error) {
      console.error('创建审核记录失败:', error);
      return false;
    }
  }

  // 创建举报记录
  async createContentReport(report: Omit<ContentReport, 'tenantId' | 'reportId' | 'status' | 'createdAt'>): Promise<string | null> {
    try {
      const reportId = this.generateReportId();
      const now = Date.now();

      const params = {
        tableName: 'content_reports',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'reportId': reportId }
        ],
        attributeColumns: [
          { contentType: report.contentType },
          { contentId: report.contentId },
          { reporterId: report.reporterId },
          { reporterName: report.reporterName },
          { reason: report.reason },
          { description: report.description },
          { status: 'PENDING' },
          { createdAt: now },
        ] as any[],
      };

      // 添加可选字段
      if (report.ipAddress) params.attributeColumns.push({ ipAddress: report.ipAddress });
      if (report.userAgent) params.attributeColumns.push({ userAgent: report.userAgent });

      await this.client.putRow(params);
      return reportId;
    } catch (error) {
      console.error('创建举报记录失败:', error);
      return null;
    }
  }

  // 获取待审核内容列表
  async getPendingModerationItems(contentType?: 'ARTWORK' | 'COMMENT', limit: number = 50): Promise<any[]> {
    try {
      // 这里需要扫描artworks和comments表，查找moderationStatus为PENDING的内容
      // 由于TableStore的限制，我们需要分别查询两个表
      const items: any[] = [];

      if (!contentType || contentType === 'ARTWORK') {
        const artworkItems = await this.getPendingArtworks(limit);
        items.push(...artworkItems);
      }

      if (!contentType || contentType === 'COMMENT') {
        const commentItems = await this.getPendingComments(limit);
        items.push(...commentItems);
      }

      // 按创建时间排序
      items.sort((a, b) => b.createdAt - a.createdAt);

      return items.slice(0, limit);
    } catch (error) {
      console.error('获取待审核内容失败:', error);
      return [];
    }
  }

  // 获取待审核作品
  private async getPendingArtworks(limit: number): Promise<any[]> {
    try {
      const params = {
        tableName: 'artworks',
        direction: TableStore.Direction.BACKWARD,
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': TableStore.INF_MAX }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': TableStore.INF_MIN }
        ],
        limit: 1000, // 扫描更多记录以过滤
      };

      const result = await this.client.getRange(params);
      const items: any[] = [];

      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.moderationStatus && attrs.moderationStatus[0] === 'PENDING') {
          items.push({
            id: row.primaryKey[1].value,
            type: 'artwork',
            title: attrs.title?.[0] || '',
            content: attrs.description?.[0] || '',
            author: `用户${attrs.userId?.[0]?.slice(-8) || ''}`,
            authorId: attrs.userId?.[0] || '',
            status: attrs.moderationStatus[0],
            createdAt: attrs.createdAt?.[0] || Date.now(),
            reportCount: attrs.reportCount?.[0] || 0,
            thumbnailUrl: attrs.thumbnailUrl?.[0],
            videoUrl: attrs.videoUrl?.[0],
          });

          if (items.length >= limit) break;
        }
      }

      return items;
    } catch (error) {
      console.error('获取待审核作品失败:', error);
      return [];
    }
  }

  // 获取待审核评论
  private async getPendingComments(limit: number): Promise<any[]> {
    try {
      const params = {
        tableName: 'comments',
        direction: TableStore.Direction.BACKWARD,
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'commentId': TableStore.INF_MAX }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'commentId': TableStore.INF_MIN }
        ],
        limit: 1000, // 扫描更多记录以过滤
      };

      const result = await this.client.getRange(params);
      const items: any[] = [];

      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.moderationStatus && attrs.moderationStatus[0] === 'PENDING') {
          items.push({
            id: row.primaryKey[1].value,
            type: 'comment',
            title: '评论内容',
            content: attrs.content?.[0] || '',
            author: `用户${attrs.userId?.[0]?.slice(-8) || ''}`,
            authorId: attrs.userId?.[0] || '',
            status: attrs.moderationStatus[0],
            createdAt: attrs.createdAt?.[0] || Date.now(),
            reportCount: attrs.reportCount?.[0] || 0,
            artworkId: attrs.artworkId?.[0],
          });

          if (items.length >= limit) break;
        }
      }

      return items;
    } catch (error) {
      console.error('获取待审核评论失败:', error);
      return [];
    }
  }

  // 更新内容审核状态
  async updateContentModerationStatus(
    contentType: 'ARTWORK' | 'COMMENT',
    contentId: string,
    status: 'APPROVED' | 'REJECTED',
    moderatorId: string,
    moderatorName: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const now = Date.now();
      const tableName = contentType === 'ARTWORK' ? 'artworks' : 'comments';
      const primaryKeyName = contentType === 'ARTWORK' ? 'artworkId' : 'commentId';

      const params = {
        tableName,
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { [primaryKeyName]: contentId }
        ],
        attributeColumns: [
          { moderationStatus: status },
          { moderatedAt: now },
          { moderatorId: moderatorId },
          { updatedAt: now },
        ] as any[],
      };

      if (reason) {
        params.attributeColumns.push({ moderationReason: reason });
      }

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('更新内容审核状态失败:', error);
      return false;
    }
  }

  // 获取审核统计信息
  async getModerationStats(): Promise<ModerationStats> {
    try {
      // 这里需要扫描所有内容统计审核状态
      // 由于TableStore的限制，这是一个相对昂贵的操作
      // 在生产环境中，建议使用缓存或定期统计

      const stats: ModerationStats = {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        totalReports: 0,
        todayProcessed: 0,
        avgProcessingTime: 0,
      };

      // 统计作品审核状态
      await this.countArtworkModerationStatus(stats);

      // 统计评论审核状态
      await this.countCommentModerationStatus(stats);

      // 统计举报数量
      await this.countReports(stats);

      return stats;
    } catch (error) {
      console.error('获取审核统计失败:', error);
      return {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        totalReports: 0,
        todayProcessed: 0,
        avgProcessingTime: 0,
      };
    }
  }

  // 统计作品审核状态
  private async countArtworkModerationStatus(stats: ModerationStats): Promise<void> {
    // 实现作品审核状态统计逻辑
    // 这里简化处理，实际应该扫描整个表
  }

  // 统计评论审核状态
  private async countCommentModerationStatus(stats: ModerationStats): Promise<void> {
    // 实现评论审核状态统计逻辑
    // 这里简化处理，实际应该扫描整个表
  }

  // 统计举报数量
  private async countReports(stats: ModerationStats): Promise<void> {
    // 实现举报统计逻辑
    // 这里简化处理，实际应该扫描举报表
  }
}
