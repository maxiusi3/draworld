// 语言: TypeScript
// 说明: 邀请系统数据访问层，基于TableStore实现

import TableStore from 'tablestore';
import { v4 as uuidv4 } from 'uuid';

export interface InviteCode {
  tenantId: string;
  code: string;
  userId: string;
  isActive: boolean;
  createdAt: number;
  usedAt?: number;
  usedByUserId?: string;
}

export interface Invitation {
  tenantId: string;
  invitationId: string;
  inviterUserId: string;
  inviteeUserId: string;
  invitationCode: string;
  registrationRewardGiven: boolean;
  firstVideoRewardGiven: boolean;
  totalRewardsGiven: number;
  createdAt: number;
  updatedAt: number;
}

export class InvitationsRepository {
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

  // 生成唯一邀请码
  private generateInvitationCode(userId: string): string {
    const userPart = userId.slice(-4).toUpperCase();
    const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${userPart}${randomPart}`;
  }

  // 获取用户的邀请码
  async getInviteCodeByUser(userId: string): Promise<InviteCode | null> {
    try {
      // 扫描 invite_codes 表查找用户的邀请码
      const params = {
        tableName: 'invite_codes',
        direction: TableStore.Direction.FORWARD,
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'code': TableStore.INF_MIN }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'code': TableStore.INF_MAX }
        ],
        limit: 1000, // 假设单个租户邀请码不会太多
      };

      const result = await this.client.getRange(params);
      
      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.userId && attrs.userId[0] === userId) {
          return {
            tenantId: this.tenantId,
            code: row.primaryKey[1].value,
            userId: attrs.userId[0],
            isActive: attrs.isActive?.[0] || false,
            createdAt: attrs.createdAt?.[0] || Date.now(),
            usedAt: attrs.usedAt?.[0],
            usedByUserId: attrs.usedByUserId?.[0],
          };
        }
      }

      return null;
    } catch (error) {
      console.error('获取用户邀请码失败:', error);
      return null;
    }
  }

  // 创建邀请码
  async createInviteCode(userId: string): Promise<InviteCode | null> {
    try {
      // 先检查用户是否已有邀请码
      const existing = await this.getInviteCodeByUser(userId);
      if (existing) {
        return existing;
      }

      // 生成新的邀请码，确保唯一性
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        code = this.generateInvitationCode(userId);
        attempts++;
        
        // 检查邀请码是否已存在
        const existingCode = await this.getInviteCodeByCode(code);
        if (!existingCode) {
          break;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('无法生成唯一邀请码');
        }
      } while (true);

      const inviteCode: InviteCode = {
        tenantId: this.tenantId,
        code,
        userId,
        isActive: true,
        createdAt: Date.now(),
      };

      const params = {
        tableName: 'invite_codes',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'code': code }
        ],
        attributeColumns: [
          { 'userId': userId },
          { 'isActive': true },
          { 'createdAt': inviteCode.createdAt },
        ],
      };

      await this.client.putRow(params);
      return inviteCode;
    } catch (error) {
      console.error('创建邀请码失败:', error);
      return null;
    }
  }

  // 根据邀请码获取邀请码信息
  async getInviteCodeByCode(code: string): Promise<InviteCode | null> {
    try {
      const params = {
        tableName: 'invite_codes',
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'code': code }
        ],
      };

      const result = await this.client.getRow(params);
      if (!result.row || !result.row.attributes) {
        return null;
      }

      const attrs = result.row.attributes;
      return {
        tenantId: this.tenantId,
        code,
        userId: attrs.userId[0],
        isActive: attrs.isActive?.[0] || false,
        createdAt: attrs.createdAt?.[0] || Date.now(),
        usedAt: attrs.usedAt?.[0],
        usedByUserId: attrs.usedByUserId?.[0],
      };
    } catch (error) {
      console.error('获取邀请码失败:', error);
      return null;
    }
  }

  // 标记邀请码为已使用
  async markInviteCodeAsUsed(code: string, usedByUserId: string): Promise<boolean> {
    try {
      const params = {
        tableName: 'invite_codes',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'code': code }
        ],
        attributeColumns: [
          { 'usedAt': Date.now() },
          { 'usedByUserId': usedByUserId },
        ],
      };

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('标记邀请码已使用失败:', error);
      return false;
    }
  }

  // 创建邀请关系
  async createInvitation(
    inviterUserId: string,
    inviteeUserId: string,
    invitationCode: string
  ): Promise<Invitation | null> {
    try {
      const invitationId = uuidv4();
      const now = Date.now();

      const invitation: Invitation = {
        tenantId: this.tenantId,
        invitationId,
        inviterUserId,
        inviteeUserId,
        invitationCode,
        registrationRewardGiven: true, // 创建时即表示注册奖励已处理
        firstVideoRewardGiven: false,
        totalRewardsGiven: 30, // 注册奖励30分
        createdAt: now,
        updatedAt: now,
      };

      const params = {
        tableName: 'invitations',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'invitationId': invitationId }
        ],
        attributeColumns: [
          { 'inviterUserId': inviterUserId },
          { 'inviteeUserId': inviteeUserId },
          { 'invitationCode': invitationCode },
          { 'registrationRewardGiven': true },
          { 'firstVideoRewardGiven': false },
          { 'totalRewardsGiven': 30 },
          { 'createdAt': now },
          { 'updatedAt': now },
        ],
      };

      await this.client.putRow(params);
      return invitation;
    } catch (error) {
      console.error('创建邀请关系失败:', error);
      return null;
    }
  }

  // 根据被邀请者查找邀请关系
  async getInvitationByInvitee(inviteeUserId: string): Promise<Invitation | null> {
    try {
      // 扫描 invitations 表查找被邀请者的关系
      const params = {
        tableName: 'invitations',
        direction: TableStore.Direction.FORWARD,
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'invitationId': TableStore.INF_MIN }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'invitationId': TableStore.INF_MAX }
        ],
        limit: 1000,
      };

      const result = await this.client.getRange(params);
      
      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.inviteeUserId && attrs.inviteeUserId[0] === inviteeUserId) {
          return {
            tenantId: this.tenantId,
            invitationId: row.primaryKey[1].value,
            inviterUserId: attrs.inviterUserId[0],
            inviteeUserId: attrs.inviteeUserId[0],
            invitationCode: attrs.invitationCode[0],
            registrationRewardGiven: attrs.registrationRewardGiven?.[0] || false,
            firstVideoRewardGiven: attrs.firstVideoRewardGiven?.[0] || false,
            totalRewardsGiven: attrs.totalRewardsGiven?.[0] || 0,
            createdAt: attrs.createdAt?.[0] || Date.now(),
            updatedAt: attrs.updatedAt?.[0] || Date.now(),
          };
        }
      }

      return null;
    } catch (error) {
      console.error('获取邀请关系失败:', error);
      return null;
    }
  }

  // 更新首次视频奖励状态
  async updateFirstVideoReward(invitationId: string, rewardAmount: number): Promise<boolean> {
    try {
      const params = {
        tableName: 'invitations',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'invitationId': invitationId }
        ],
        attributeColumns: [
          { 'firstVideoRewardGiven': true },
          { 'totalRewardsGiven': TableStore.increment(rewardAmount) },
          { 'updatedAt': Date.now() },
        ],
      };

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('更新首次视频奖励状态失败:', error);
      return false;
    }
  }

  // 获取用户的邀请统计
  async getInvitationsByInviter(inviterUserId: string): Promise<Invitation[]> {
    try {
      const params = {
        tableName: 'invitations',
        direction: TableStore.Direction.FORWARD,
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'invitationId': TableStore.INF_MIN }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'invitationId': TableStore.INF_MAX }
        ],
        limit: 1000,
      };

      const result = await this.client.getRange(params);
      const invitations: Invitation[] = [];
      
      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.inviterUserId && attrs.inviterUserId[0] === inviterUserId) {
          invitations.push({
            tenantId: this.tenantId,
            invitationId: row.primaryKey[1].value,
            inviterUserId: attrs.inviterUserId[0],
            inviteeUserId: attrs.inviteeUserId[0],
            invitationCode: attrs.invitationCode[0],
            registrationRewardGiven: attrs.registrationRewardGiven?.[0] || false,
            firstVideoRewardGiven: attrs.firstVideoRewardGiven?.[0] || false,
            totalRewardsGiven: attrs.totalRewardsGiven?.[0] || 0,
            createdAt: attrs.createdAt?.[0] || Date.now(),
            updatedAt: attrs.updatedAt?.[0] || Date.now(),
          });
        }
      }

      return invitations;
    } catch (error) {
      console.error('获取邀请统计失败:', error);
      return [];
    }
  }
}
