// 语言: TypeScript
// 说明: 积分不足提示对话框组件

import React from 'react';
import { AlertTriangle, Coins, Gift, Users, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits: number;
  currentCredits: number;
  onSignin?: () => void;
}

export const InsufficientCreditsDialog: React.FC<InsufficientCreditsDialogProps> = ({
  open,
  onOpenChange,
  requiredCredits,
  currentCredits,
  onSignin,
}) => {
  const shortfall = requiredCredits - currentCredits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            积分不足
          </DialogTitle>
          <DialogDescription>
            您当前的积分不足以完成此操作
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 积分状态 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">当前积分</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold">{currentCredits.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">所需积分</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-600">{requiredCredits.toLocaleString()}</span>
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-800">还需要</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-orange-600">{shortfall.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 获取积分的方法 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">获取积分的方法：</h4>
            
            <div className="space-y-2">
              {/* 每日签到 */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Gift className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-blue-800">每日签到</div>
                  <div className="text-sm text-blue-600">每天可获得 15 积分</div>
                </div>
                {onSignin && (
                  <Button
                    onClick={() => {
                      onSignin();
                      onOpenChange(false);
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    立即签到
                  </Button>
                )}
              </div>

              {/* 邀请好友 */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-green-800">邀请好友</div>
                  <div className="text-sm text-green-600">邀请注册可获得 30 积分</div>
                </div>
              </div>

              {/* 社交互动 */}
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                <Heart className="w-5 h-5 text-pink-600" />
                <div className="flex-1">
                  <div className="font-medium text-pink-800">社交互动</div>
                  <div className="text-sm text-pink-600">点赞和被点赞可获得积分</div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              稍后再试
            </Button>
            {onSignin && (
              <Button
                onClick={() => {
                  onSignin();
                  onOpenChange(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                立即签到
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook已移至 useInsufficientCreditsCheck.ts 文件
