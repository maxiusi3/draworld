// 语言: TypeScript
// 说明: 积分不足检查Hook，单独文件以支持Fast Refresh

import { useState, useCallback } from 'react';

// Hook 用于检查积分并显示不足提示
export const useInsufficientCreditsCheck = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    requiredCredits: number;
    currentCredits: number;
  }>({ requiredCredits: 0, currentCredits: 0 });

  const checkCredits = useCallback(async (requiredCredits: number) => {
    try {
      const { creditsService } = await import('../services/creditsService');
      const balance = await creditsService.getCreditBalance();
      const currentCredits = balance.balance || 0;

      if (currentCredits < requiredCredits) {
        setDialogProps({ requiredCredits, currentCredits });
        setDialogOpen(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error('检查积分失败:', error);
      return false;
    }
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return {
    dialogOpen,
    dialogProps,
    checkCredits,
    closeDialog,
  };
};
