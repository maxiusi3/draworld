import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, Users, Gift, TrendingUp, QrCode } from 'lucide-react';
import { invitationService, InvitationSummary } from '../services/invitationService';
import { toast } from 'react-hot-toast';

const InvitationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationSummary | null>(null);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copyingLink, setCopyingLink] = useState(false);

  useEffect(() => {
    loadInvitationData();
  }, []);

  const loadInvitationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取邀请数据和邀请码
      const [data, codeData] = await Promise.all([
        invitationService.getMyInvitations(),
        invitationService.getMyInvitationCode()
      ]);

      setInvitationData(data);
      setInvitationCode(codeData.code);
    } catch (error: any) {
      console.error('获取邀请数据失败:', error);
      setError(error.message || '获取邀请数据失败');
      toast.error('获取邀请数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!invitationCode) return;

    try {
      setCopyingLink(true);
      const success = await invitationService.copyInvitationLink(invitationCode);
      
      if (success) {
        toast.success('邀请链接已复制到剪贴板');
      } else {
        toast.error('复制失败，请手动复制');
      }
    } catch (error) {
      toast.error('复制失败');
    } finally {
      setCopyingLink(false);
    }
  };

  const handleShare = async () => {
    if (!invitationCode) return;

    const link = invitationService.generateInvitationLink(invitationCode);
    const shareText = `🎨 邀请您加入创意视频生成平台！使用我的邀请码 ${invitationCode}，注册即可获得额外50积分奖励！\n\n${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '邀请加入创意视频平台',
          text: shareText,
          url: link,
        });
      } catch (error) {
        console.log('分享取消或失败');
      }
    } else {
      // 降级到复制链接
      handleCopyLink();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载邀请数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回首页</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">邀请好友</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadInvitationData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : !invitationCode ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">邀请功能准备中</h3>
            <p className="text-gray-500">正在为您生成专属邀请码...</p>
            <button
              onClick={loadInvitationData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 邀请码卡片 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">我的邀请码</h2>
                  <div className="text-3xl font-bold tracking-wider mb-4">
                    {invitationCode}
                  </div>
                  <p className="text-blue-100">
                    邀请好友注册，您获得30积分，好友获得50积分
                  </p>
                </div>
                <div className="text-right">
                  <QrCode className="w-16 h-16 text-white/80 mb-2" />
                  <p className="text-sm text-blue-100">二维码</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCopyLink}
                  disabled={copyingLink}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copyingLink ? '复制中...' : '复制链接'}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">总邀请人数</p>
                    <p className="text-2xl font-semibold text-gray-900">{invitationData.totalInvitations}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <Gift className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">总获得积分</p>
                    <p className="text-2xl font-semibold text-gray-900">{invitationData.totalRewards}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">平均每人奖励</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {invitationData.totalInvitations > 0
                        ? Math.round(invitationData.totalRewards / invitationData.totalInvitations)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 邀请记录 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  邀请记录 ({invitationData.recentInvitations.length} 条)
                </h3>
              </div>
              
              {invitationData.recentInvitations.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">还没有邀请记录</h4>
                  <p className="text-gray-500">分享您的邀请码，开始赚取积分奖励吧！</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {invitationData.recentInvitations.map((invitation, index) => (
                    <div key={invitation.id || index} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            用户 {invitation.inviteeId ? invitation.inviteeId.slice(-8) : '未知'}
                          </div>
                          <div className="text-sm text-gray-500">
                            注册时间: {formatDate(invitation.usedAt || invitation.createdAt)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            +50 积分
                          </div>
                          <div className="text-sm text-gray-500">
                            {invitation.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex space-x-4 text-sm">
                        <span className="text-blue-600">
                          注册奖励: +50
                        </span>
                        {invitation.rewardClaimed && (
                          <span className="text-purple-600">
                            视频奖励: +30
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 奖励规则说明 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-900 mb-4">邀请奖励规则</h4>
              <div className="space-y-2 text-blue-800">
                <p>• 好友使用您的邀请码注册：您获得 <strong>30积分</strong>，好友获得 <strong>50积分</strong></p>
                <p>• 好友首次生成视频：您额外获得 <strong>70积分</strong></p>
                <p>• 单个好友最多为您带来 <strong>100积分</strong> 奖励</p>
                <p>• 邀请越多好友，获得积分越多！</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationPage;
