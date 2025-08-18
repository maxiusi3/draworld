// 邀请系统相关的 React Hook
import { useState, useEffect } from 'react';
import { invitationService, InvitationSummary, InvitationRegistrationResult } from '../services/invitationService';
import { creditsService } from '../services/creditsService';
import { CreditTransactionReason } from '../types/credits';
import { toast } from 'react-hot-toast';

export const useInvitation = () => {
  const [invitationData, setInvitationData] = useState<InvitationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户的邀请数据
  const loadInvitationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invitationService.getMyInvitations();
      setInvitationData(data);
    } catch (error: any) {
      console.error('获取邀请数据失败:', error);
      setError(error.message || '获取邀请数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理邀请注册
  const handleInvitationRegistration = async (invitationCode: string): Promise<InvitationRegistrationResult> => {
    try {
      const result = await invitationService.registerWithInvitationCode(invitationCode);

      if (result.success && result.reward) {
        // 邀请者与被邀请者奖励均由后端代发，前端仅显示提示
        if (result.reward > 0) {
          toast.success(`注册成功！您获得了${result.reward}积分奖励！`);
          // 通知余额刷新（后端已入账）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('creditsUpdated'));
          }
        }
      }

      return result;
    } catch (error: any) {
      console.error('处理邀请注册失败:', error);
      return {
        success: false,
        message: error.message || '处理邀请注册失败',
      };
    }
  };

  // 处理首次视频生成奖励
  const handleFirstVideoReward = async (): Promise<boolean> => {
    try {
      const result = await invitationService.triggerFirstVideoReward();

      if (result.success && result.reward) {
        // 邀请者的首次视频奖励由后端代发；前端不再入账
        toast.success(`您的邀请者获得了${result.reward}积分奖励！`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('处理首次视频奖励失败:', error);
      return false;
    }
  };

  // 复制邀请链接
  const copyInvitationLink = async (invitationCode: string): Promise<boolean> => {
    try {
      const success = await invitationService.copyInvitationLink(invitationCode);
      if (success) {
        toast.success('邀请链接已复制到剪贴板');
      } else {
        toast.error('复制失败，请手动复制');
      }
      return success;
    } catch (error) {
      toast.error('复制失败');
      return false;
    }
  };

  // 检查URL中的邀请码并处理
  const handleUrlInvitation = async (): Promise<InvitationRegistrationResult> => {
    try {
      return await invitationService.handleInvitationFromUrl();
    } catch (error: any) {
      console.error('处理URL邀请码失败:', error);
      return { success: false, message: '处理邀请码失败' };
    }
  };

  // 获取邀请码
  const getInvitationCode = async (): Promise<string | null> => {
    try {
      const codeData = await invitationService.getMyInvitationCode();
      return codeData.code;
    } catch (error: any) {
      console.error('获取邀请码失败:', error);
      return null;
    }
  };

  return {
    invitationData,
    loading,
    error,
    loadInvitationData,
    handleInvitationRegistration,
    handleFirstVideoReward,
    copyInvitationLink,
    handleUrlInvitation,
    getInvitationCode,
  };
};

// 检查URL中是否有邀请码的独立Hook
export const useInvitationFromUrl = () => {
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasChecked) {
      const code = invitationService.extractInvitationCodeFromUrl();
      setInvitationCode(code);
      setHasChecked(true);
    }
  }, [hasChecked]);

  return {
    invitationCode,
    hasInvitationCode: !!invitationCode,
  };
};
