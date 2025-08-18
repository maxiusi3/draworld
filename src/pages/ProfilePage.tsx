import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Heart, MessageCircle, Video } from 'lucide-react';
import { useUserArtworks, useUserLikedArtworks, useUserComments } from '../hooks/useCommunity';
import ArtworkCard from '../components/ArtworkCard';
import LikeProgress from '../components/LikeProgress';

type TabType = 'artworks' | 'likes' | 'comments';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('artworks');

  const { artworks, loading: artworksLoading, error: artworksError } = useUserArtworks();
  const { artworks: likedArtworks, loading: likesLoading, error: likesError } = useUserLikedArtworks();
  const { comments, loading: commentsLoading, error: commentsError } = useUserComments();

  const handleArtworkClick = (artworkId: string) => {
    navigate(`/community/artwork/${artworkId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'artworks':
        if (artworksLoading) {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (artworksError) {
          return (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{artworksError}</p>
            </div>
          );
        }

        if (artworks.length === 0) {
          return (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有作品</h3>
              <p className="text-gray-500 mb-4">创作你的第一个视频作品吧！</p>
              <button
                onClick={() => navigate('/create')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                创作新视频
              </button>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={() => handleArtworkClick(artwork.id)}
                showLikeButton={false}
                showVisibilityToggle={true}
                isOwner={true}
              />
            ))}
          </div>
        );

      case 'likes':
        if (likesLoading) {
          return (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          );
        }

        if (likesError) {
          return (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{likesError}</p>
            </div>
          );
        }

        if (likedArtworks.length === 0) {
          return (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有点赞的作品</h3>
              <p className="text-gray-500 mb-4">去创意广场发现更多精彩作品吧！</p>
              <button
                onClick={() => navigate('/community')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                浏览作品
              </button>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={() => handleArtworkClick(artwork.id)}
              />
            ))}
          </div>
        );

      case 'comments':
        if (commentsLoading) {
          return (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          );
        }

        if (commentsError) {
          return (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{commentsError}</p>
            </div>
          );
        }

        if (comments.length === 0) {
          return (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有发表评论</h3>
              <p className="text-gray-500 mb-4">去作品下方发表你的看法吧！</p>
              <button
                onClick={() => navigate('/community')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                浏览作品
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.created_at)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                    已发布
                  </span>
                </div>
                <p className="text-gray-900 mb-3 leading-relaxed">
                  {comment.content}
                </p>
                <button
                  onClick={() => navigate(`/community/artwork/${comment.id}`)}
                  className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                >
                  查看原作品 →
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'artworks':
        return artworks.length;
      case 'likes':
        return likedArtworks.length;
      case 'comments':
        return comments.length;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">个人中心</h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* 用户信息 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">我的创作空间</h2>
              <p className="text-gray-600">管理你的作品、点赞和评论</p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { key: 'artworks', label: '我的作品', icon: Video },
              { key: 'likes', label: '我的点赞', icon: Heart },
              { key: 'comments', label: '我的评论', icon: MessageCircle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabType)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  activeTab === key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getTabCount(key as TabType)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏 - 点赞进度 */}
          <div className="lg:col-span-1">
            <LikeProgress />
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
