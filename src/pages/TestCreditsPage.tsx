// 语言: TypeScript
// 说明: 积分系统测试页面

import React from 'react';
import { CreditBalance, SimpleCreditBalance, InsufficientCreditsAlert } from '../components/Credits/CreditBalance';
import { DailySignin, SigninIndicator } from '../components/Credits/DailySignin';
import { useCreditBalance, useDailySignin, useConsumeCredits } from '../hooks/useCredits';
import { CREDIT_RULES } from '../types/credits';
import { useAuth } from '../hooks/useAuth';

const TestCreditsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { balance, loading, error, refresh: refreshBalance } = useCreditBalance();
  const { signin, loading: signinLoading } = useDailySignin();
  const { consumeCreditsForVideo, loading: consumeLoading } = useConsumeCredits();

  const handleTestConsume = async () => {
    const result = await consumeCreditsForVideo('test-video-id');
    if (result) {
      console.log('测试消费积分成功:', result);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">积分系统测试</h1>
          <p className="text-gray-600">请先登录以测试积分功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">积分系统测试页面</h1>
          <p className="text-gray-600">测试各个积分组件和功能</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 积分余额测试 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">积分余额组件测试</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">标准积分余额显示</h3>
                <CreditBalance 
                  size="medium" 
                  showRechargeButton={true}
                  onRechargeClick={() => alert('充值功能测试')}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">简化积分余额显示</h3>
                <SimpleCreditBalance showIcon={true} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">大尺寸积分余额</h3>
                <CreditBalance size="large" />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">小尺寸积分余额</h3>
                <CreditBalance size="small" />
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                加载状态: {loading ? '加载中...' : '已加载'}
              </p>
              {error && (
                <p className="text-sm text-red-600">错误: {error}</p>
              )}
              {balance !== null && (
                <div className="text-sm text-gray-600 mt-2">
                  <p>当前余额: {balance}</p>
                  <p>总获得: --</p>
                  <p>总消费: --</p>
                </div>
              )}
            </div>

            <button
              onClick={refreshBalance}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              刷新余额
            </button>
          </div>

          {/* 每日签到测试 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">每日签到组件测试</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">签到按钮</h3>
                <DailySignin showAsButton={true} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">签到卡片</h3>
                <DailySignin showAsButton={false} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">签到状态指示器</h3>
                <SigninIndicator />
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                签到状态: {signinLoading ? '处理中...' : '就绪'}
              </p>
            </div>
          </div>

          {/* 积分消费测试 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">积分消费测试</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">视频生成消费测试</h3>
                <button
                  onClick={handleTestConsume}
                  disabled={consumeLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {consumeLoading ? '消费中...' : `测试消费 ${(() => {
                    try {
                      const { getVideoGenerationCost } = require('../config/demo');
                      return getVideoGenerationCost();
                    } catch {
                      return CREDIT_RULES.VIDEO_GENERATION_COST;
                    }
                  })()} 积分`}
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">积分不足提示</h3>
                <InsufficientCreditsAlert 
                  requiredCredits={1000}
                  onRechargeClick={() => alert('充值功能测试')}
                />
              </div>
            </div>
          </div>

          {/* 积分规则显示 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">积分规则</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>新用户注册奖励:</span>
                <span className="font-medium">{CREDIT_RULES.REGISTRATION_REWARD} 积分</span>
              </div>
              <div className="flex justify-between">
                <span>每日签到奖励:</span>
                <span className="font-medium">{CREDIT_RULES.DAILY_SIGNIN_REWARD} 积分</span>
              </div>
              <div className="flex justify-between">
                <span>视频生成消费:</span>
                <span className="font-medium">
                  {(() => {
                    try {
                      const { getVideoGenerationCost } = require('../config/demo');
                      return getVideoGenerationCost();
                    } catch {
                      return CREDIT_RULES.VIDEO_GENERATION_COST;
                    }
                  })()} 积分
                  {(() => {
                    try {
                      const { getDemoEnvironmentInfo } = require('../config/demo');
                      return getDemoEnvironmentInfo() ? ' (演示环境)' : '';
                    } catch {
                      return '';
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>邀请注册奖励:</span>
                <span className="font-medium">{CREDIT_RULES.INVITE_REGISTER_REWARD} 积分</span>
              </div>
              <div className="flex justify-between">
                <span>邀请首次生成奖励:</span>
                <span className="font-medium">{CREDIT_RULES.INVITE_FIRST_VIDEO_REWARD} 积分</span>
              </div>
              <div className="flex justify-between">
                <span>被点赞奖励 (每{CREDIT_RULES.LIKE_THRESHOLD_FOR_REWARD}个):</span>
                <span className="font-medium">{CREDIT_RULES.LIKE_RECEIVED_PER_5} 积分</span>
              </div>
              <div className="flex justify-between">
                <span>点赞奖励 (每{CREDIT_RULES.LIKE_GIVEN_THRESHOLD_FOR_REWARD}个):</span>
                <span className="font-medium">{CREDIT_RULES.LIKE_GIVEN_PER_10} 积分</span>
              </div>
              <div className="flex justify-between">
                <span>每日点赞奖励上限:</span>
                <span className="font-medium">{CREDIT_RULES.LIKE_GIVEN_DAILY_LIMIT} 积分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCreditsPage;
