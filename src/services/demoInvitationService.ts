// 演示模式邀请奖励服务 - 前端状态管理
// 解决 Vercel 无服务器环境中 API 函数不共享内存的问题

interface DemoInvitationCode {
  id: string;
  user_id: string;
  invitation_code: string;
  is_active: boolean;
  created_at: string;
}

interface DemoInvitationRelationship {
  id: string;
  inviter_user_id: string;
  invitee_user_id: string;
  invitation_code: string;
  registration_reward_given: boolean;
  first_video_reward_given: boolean;
  total_rewards_given: number;
  created_at: string;
}

class DemoInvitationService {
  private storageKey = 'demo_invitation_data';
  
  private getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { codes: {}, relationships: {} };
    } catch (error) {
      console.error('读取演示邀请数据失败:', error);
      return { codes: {}, relationships: {} };
    }
  }
  
  private setStorageData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // 触发邀请数据更新事件
      window.dispatchEvent(new CustomEvent('invitationUpdated'));
    } catch (error) {
      console.error('保存演示邀请数据失败:', error);
    }
  }
  
  // 生成邀请码
  private generateInvitationCode(userId: string): string {
    // 使用用户ID的一部分 + 随机字符串生成邀请码
    const userPart = userId.slice(-4).toUpperCase();
    const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${userPart}${randomPart}`;
  }
  
  // 获取或创建用户的邀请码
  getUserInvitationCode(userId: string): DemoInvitationCode {
    const data = this.getStorageData();
    
    // 检查用户是否已有邀请码
    let userCode = Object.values(data.codes).find((code: any) => code.user_id === userId);
    
    if (!userCode) {
      // 生成新的邀请码
      const invitationCode = this.generateInvitationCode(userId);
      
      // 确保邀请码唯一性
      while (data.codes[invitationCode]) {
        const newCode = this.generateInvitationCode(userId);
        if (newCode !== invitationCode) {
          break;
        }
      }
      
      userCode = {
        id: `demo-code-${Date.now()}`,
        user_id: userId,
        invitation_code: invitationCode,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      
      data.codes[invitationCode] = userCode;
      this.setStorageData(data);
    }
    
    return userCode as DemoInvitationCode;
  }
  
  // 验证邀请码是否有效
  validateInvitationCode(invitationCode: string): { valid: boolean; inviterUserId?: string } {
    const data = this.getStorageData();
    const codeData = data.codes[invitationCode];
    
    if (!codeData || !codeData.is_active) {
      return { valid: false };
    }
    
    return { valid: true, inviterUserId: codeData.user_id };
  }
  
  // 处理邀请注册
  processInvitationRegistration(
    invitationCode: string,
    inviteeUserId: string
  ): { success: boolean; message: string; rewards?: { inviter: number; invitee: number } } {
    const data = this.getStorageData();
    
    // 验证邀请码
    const validation = this.validateInvitationCode(invitationCode);
    if (!validation.valid || !validation.inviterUserId) {
      return { success: false, message: '邀请码无效' };
    }
    
    // 防止自邀请
    if (validation.inviterUserId === inviteeUserId) {
      return { success: false, message: '不能使用自己的邀请码' };
    }
    
    // 检查是否已经被邀请过
    const existingRelationship = Object.values(data.relationships).find(
      (rel: any) => rel.invitee_user_id === inviteeUserId
    );
    
    if (existingRelationship) {
      return { success: false, message: '您已经使用过邀请码了' };
    }
    
    // 创建邀请关系
    const relationshipId = `demo-rel-${Date.now()}`;
    const relationship: DemoInvitationRelationship = {
      id: relationshipId,
      inviter_user_id: validation.inviterUserId,
      invitee_user_id: inviteeUserId,
      invitation_code: invitationCode,
      registration_reward_given: true, // 立即标记为已发放
      first_video_reward_given: false,
      total_rewards_given: 30, // 邀请者获得30积分
      created_at: new Date().toISOString(),
    };
    
    data.relationships[relationshipId] = relationship;
    this.setStorageData(data);
    
    return {
      success: true,
      message: '邀请注册成功',
      rewards: {
        inviter: 30, // 邀请者获得30积分
        invitee: 50, // 被邀请者获得50积分
      },
    };
  }
  
  // 处理首次视频生成奖励
  processFirstVideoReward(userId: string): { success: boolean; reward?: number; inviterUserId?: string } {
    const data = this.getStorageData();
    
    // 查找该用户作为被邀请者的关系
    const relationship = Object.values(data.relationships).find(
      (rel: any) => rel.invitee_user_id === userId && !rel.first_video_reward_given
    ) as DemoInvitationRelationship;
    
    if (!relationship) {
      return { success: false };
    }
    
    // 检查总奖励是否已达上限
    if (relationship.total_rewards_given >= 100) {
      return { success: false };
    }
    
    // 发放首次视频奖励
    const reward = Math.min(70, 100 - relationship.total_rewards_given);
    relationship.first_video_reward_given = true;
    relationship.total_rewards_given += reward;
    
    data.relationships[relationship.id] = relationship;
    this.setStorageData(data);
    
    return {
      success: true,
      reward,
      inviterUserId: relationship.inviter_user_id,
    };
  }
  
  // 获取用户的邀请记录
  getUserInvitations(userId: string): {
    invitationCode: string;
    totalInvited: number;
    totalRewards: number;
    invitations: Array<{
      inviteeUserId: string;
      registrationDate: string;
      registrationReward: number;
      firstVideoReward: number;
      totalReward: number;
      status: string;
    }>;
  } {
    const data = this.getStorageData();
    
    // 获取用户的邀请码
    const userCode = this.getUserInvitationCode(userId);
    
    // 获取该用户的所有邀请关系
    const userInvitations = Object.values(data.relationships).filter(
      (rel: any) => rel.inviter_user_id === userId
    ) as DemoInvitationRelationship[];
    
    const totalRewards = userInvitations.reduce((sum, rel) => sum + rel.total_rewards_given, 0);
    
    const invitations = userInvitations.map(rel => ({
      id: rel.id,
      inviteeUserId: rel.invitee_user_id,
      registrationDate: rel.created_at,
      registrationReward: rel.registration_reward_given ? 30 : 0,
      firstVideoReward: rel.first_video_reward_given ? Math.min(70, 100 - 30) : 0,
      totalReward: rel.total_rewards_given,
      status: rel.first_video_reward_given ? '已完成' : '待首次视频',
    }));
    
    return {
      invitationCode: userCode.invitation_code,
      totalInvited: userInvitations.length,
      totalRewards,
      invitations,
    };
  }
  
  // 清除演示数据（用于测试）
  clearDemoData() {
    localStorage.removeItem(this.storageKey);
  }
}

export const demoInvitationService = new DemoInvitationService();
