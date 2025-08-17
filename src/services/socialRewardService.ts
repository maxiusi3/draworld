// 社交奖励系统服务
import { creditsService } from './creditsService';
import { demoCreditsService } from './demoCreditsService';
import { CreditTransactionReason } from '../types/credits';

interface SocialRewardResult {
  success: boolean;
  rewards: {
    likerReward?: number;  // 点赞者获得的奖励
    authorReward?: number; // 作品作者获得的奖励
  };
  messages: string[];
}

interface DailyLikeStatus {
  dailyLikeGiven: number;
  remainingLikes: number;
  canEarnReward: boolean;
}

class SocialRewardService {
  // 奖励规则常量
  private readonly LIKES_PER_AUTHOR_REWARD = 5;  // 每5个点赞作者获得1积分
  private readonly LIKES_PER_LIKER_REWARD = 10;  // 每10个点赞用户获得1积分
  private readonly DAILY_LIKE_REWARD_LIMIT = 5;  // 每日点赞奖励上限5积分
  private readonly MAX_DAILY_REWARDED_LIKES = 50; // 每日最多50个有效点赞

  // 检查是否为演示模式
  private isDemoMode(): boolean {
    return true; // 目前总是使用演示模式
  }

  // 获取当前用户ID
  private async getCurrentUserId(): Promise<string> {
    if (this.isDemoMode()) {
      let demoUserId = localStorage.getItem('demo_user_id');
      if (!demoUserId) {
        demoUserId = `demo-user-${Date.now()}`;
        localStorage.setItem('demo_user_id', demoUserId);
      }
      return demoUserId;
    }
    
    // 生产模式实现...
    return 'user-unknown';
  }

  // 检查是否需要重置每日数据
  private isNewDay(lastResetDate: string): boolean {
    const today = new Date().toDateString();
    const lastReset = new Date(lastResetDate).toDateString();
    return today !== lastReset;
  }

  // 获取用户每日点赞状态
  async getDailyLikeStatus(userId?: string): Promise<DailyLikeStatus> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      
      if (this.isDemoMode()) {
        const userData = demoCreditsService.getUserData(targetUserId);
        
        // 检查是否需要重置每日数据
        if (userData.credits.last_daily_reset && this.isNewDay(userData.credits.last_daily_reset)) {
          userData.credits.daily_like_given = 0;
          userData.credits.last_daily_reset = new Date().toISOString();
          demoCreditsService.setUserData(targetUserId, userData);
        }
        
        const dailyLikeGiven = userData.credits.daily_like_given || 0;
        const remainingLikes = Math.max(0, this.MAX_DAILY_REWARDED_LIKES - dailyLikeGiven);
        
        return {
          dailyLikeGiven,
          remainingLikes,
          canEarnReward: remainingLikes > 0,
        };
      }

      // 生产模式实现...
      return {
        dailyLikeGiven: 0,
        remainingLikes: this.MAX_DAILY_REWARDED_LIKES,
        canEarnReward: true,
      };
    } catch (error) {
      console.error('获取每日点赞状态失败:', error);
      return {
        dailyLikeGiven: 0,
        remainingLikes: this.MAX_DAILY_REWARDED_LIKES,
        canEarnReward: true,
      };
    }
  }

  // 处理点赞奖励
  async processLikeReward(
    artworkId: string,
    artworkAuthorId: string,
    newLikeCount: number,
    isLiking: boolean // true表示点赞，false表示取消点赞
  ): Promise<SocialRewardResult> {
    const result: SocialRewardResult = {
      success: true,
      rewards: {},
      messages: [],
    };

    try {
      const currentUserId = await this.getCurrentUserId();
      
      // 不能给自己的作品点赞获得奖励
      if (currentUserId === artworkAuthorId) {
        return result;
      }

      if (isLiking) {
        // 处理点赞奖励
        await this.handleLikeRewards(currentUserId, artworkAuthorId, newLikeCount, result);
      } else {
        // 处理取消点赞（暂时不扣除已发放的奖励）
        result.messages.push('取消点赞成功');
      }

    } catch (error) {
      console.error('处理点赞奖励失败:', error);
      result.success = false;
      result.messages.push('奖励处理失败');
    }

    return result;
  }

  // 处理点赞时的奖励逻辑
  private async handleLikeRewards(
    likerId: string,
    authorId: string,
    newLikeCount: number,
    result: SocialRewardResult
  ): Promise<void> {
    // 1. 检查作品作者是否应该获得点赞奖励
    if (newLikeCount > 0 && newLikeCount % this.LIKES_PER_AUTHOR_REWARD === 0) {
      try {
        // 为作品作者发放奖励
        if (this.isDemoMode()) {
          demoCreditsService.createTransaction(
            authorId,
            'EARN',
            1,
            CreditTransactionReason.LIKE_RECEIVED,
            null,
            `作品获得${newLikeCount}个点赞奖励`
          );
        } else {
          // 生产模式实现...
        }

        result.rewards.authorReward = 1;
        result.messages.push(`作品获得${this.LIKES_PER_AUTHOR_REWARD}个点赞，作者获得1积分奖励！`);
      } catch (error) {
        console.error('发放作者点赞奖励失败:', error);
      }
    }

    // 2. 检查点赞者是否应该获得点赞奖励
    const likeStatus = await this.getDailyLikeStatus(likerId);
    
    if (likeStatus.canEarnReward) {
      // 更新点赞者的每日点赞数
      await this.updateDailyLikeCount(likerId);
      
      // 检查是否达到奖励条件
      const newDailyLikeCount = likeStatus.dailyLikeGiven + 1;
      if (newDailyLikeCount % this.LIKES_PER_LIKER_REWARD === 0) {
        try {
          // 为点赞者发放奖励
          if (this.isDemoMode()) {
            demoCreditsService.createTransaction(
              likerId,
              'EARN',
              1,
              CreditTransactionReason.LIKE_GIVEN,
              null,
              `给他人点赞${newDailyLikeCount}次奖励`
            );
          } else {
            // 生产模式实现...
          }

          result.rewards.likerReward = 1;
          result.messages.push(`今日点赞${this.LIKES_PER_LIKER_REWARD}次，获得1积分奖励！`);
        } catch (error) {
          console.error('发放点赞者奖励失败:', error);
        }
      }
      
      // 提示剩余可奖励点赞次数
      const remaining = this.MAX_DAILY_REWARDED_LIKES - newDailyLikeCount;
      if (remaining > 0) {
        result.messages.push(`今日还可获得奖励的点赞次数：${remaining}`);
      } else {
        result.messages.push('今日点赞奖励已达上限');
      }
    } else {
      result.messages.push('今日点赞奖励已达上限');
    }
  }

  // 更新用户每日点赞数
  private async updateDailyLikeCount(userId: string): Promise<void> {
    if (this.isDemoMode()) {
      const userData = demoCreditsService.getUserData(userId);
      
      // 检查是否需要重置每日数据
      if (userData.credits.last_daily_reset && this.isNewDay(userData.credits.last_daily_reset)) {
        userData.credits.daily_like_given = 0;
      }
      
      userData.credits.daily_like_given = (userData.credits.daily_like_given || 0) + 1;
      userData.credits.last_daily_reset = new Date().toISOString();
      
      demoCreditsService.setUserData(userId, userData);
    }

    // 生产模式实现...
  }

  // 获取点赞奖励规则说明
  getRewardRules(): {
    authorReward: string;
    likerReward: string;
    dailyLimit: string;
  } {
    return {
      authorReward: `作品每获得${this.LIKES_PER_AUTHOR_REWARD}个点赞，作者获得1积分`,
      likerReward: `给他人点赞每${this.LIKES_PER_LIKER_REWARD}次获得1积分`,
      dailyLimit: `每日点赞奖励上限${this.DAILY_LIKE_REWARD_LIMIT}积分（${this.MAX_DAILY_REWARDED_LIKES}次点赞）`,
    };
  }

  // 获取用户今日点赞进度
  async getUserLikeProgress(userId?: string): Promise<{
    dailyLikeGiven: number;
    nextRewardAt: number;
    rewardsEarned: number;
    remainingRewards: number;
  }> {
    const targetUserId = userId || await this.getCurrentUserId();
    const status = await this.getDailyLikeStatus(targetUserId);
    
    const rewardsEarned = Math.floor(status.dailyLikeGiven / this.LIKES_PER_LIKER_REWARD);
    const remainingRewards = this.DAILY_LIKE_REWARD_LIMIT - rewardsEarned;
    const nextRewardAt = (rewardsEarned + 1) * this.LIKES_PER_LIKER_REWARD;
    
    return {
      dailyLikeGiven: status.dailyLikeGiven,
      nextRewardAt: Math.min(nextRewardAt, this.MAX_DAILY_REWARDED_LIKES),
      rewardsEarned,
      remainingRewards: Math.max(0, remainingRewards),
    };
  }
}

export const socialRewardService = new SocialRewardService();
export type { SocialRewardResult, DailyLikeStatus };
