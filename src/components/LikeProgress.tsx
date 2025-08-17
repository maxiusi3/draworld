import React, { useState, useEffect } from 'react';
import { Heart, Gift, Info } from 'lucide-react';
import { socialRewardService } from '../services/socialRewardService';

interface LikeProgressProps {
  className?: string;
}

const LikeProgress: React.FC<LikeProgressProps> = ({ className = '' }) => {
  const [progress, setProgress] = useState({
    dailyLikeGiven: 0,
    nextRewardAt: 10,
    rewardsEarned: 0,
    remainingRewards: 5,
  });
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await socialRewardService.getUserLikeProgress();
      setProgress(data);
    } catch (error) {
      console.error('获取点赞进度失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
    
    // 监听积分更新事件，刷新进度
    const handleCreditsUpdate = () => {
      loadProgress();
    };
    
    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
    };
  }, []);

  const rules = socialRewardService.getRewardRules();
  
  const progressPercentage = Math.min(
    (progress.dailyLikeGiven % 10) / 10 * 100,
    100
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      {/* 标题和规则按钮 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h3 className="font-medium text-gray-900">今日点赞进度</h3>
        </div>
        <button
          onClick={() => setShowRules(!showRules)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* 奖励规则说明 */}
      {showRules && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
          <div className="space-y-1 text-blue-700">
            <p>• {rules.likerReward}</p>
            <p>• {rules.authorReward}</p>
            <p>• {rules.dailyLimit}</p>
          </div>
        </div>
      )}

      {/* 进度统计 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{progress.dailyLikeGiven}</div>
          <div className="text-xs text-gray-500">今日点赞</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{progress.rewardsEarned}</div>
          <div className="text-xs text-gray-500">已获奖励</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>距离下次奖励</span>
          <span>{progress.nextRewardAt - progress.dailyLikeGiven} 次点赞</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-400 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 状态提示 */}
      {progress.remainingRewards > 0 ? (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <Gift className="w-4 h-4" />
          <span>还可获得 {progress.remainingRewards} 次奖励</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Gift className="w-4 h-4" />
          <span>今日点赞奖励已达上限</span>
        </div>
      )}
    </div>
  );
};

export default LikeProgress;
