import React, { useState } from 'react';
import { Heart, MessageCircle, Eye, Play, User } from 'lucide-react';
import { Artwork } from '../services/communityService';
import { useLike } from '../hooks/useCommunity';
import { ArtworkVisibilityToggle, ArtworkVisibilityStatus } from './ArtworkVisibilityToggle';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick?: () => void;
  showLikeButton?: boolean;
  showVisibilityToggle?: boolean;
  isOwner?: boolean;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  onClick,
  showLikeButton = true,
  showVisibilityToggle = false,
  isOwner = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState(artwork);
  const { liked, likeCount, loading: likeLoading, toggleLike } = useLike(artwork.id);

  const handleVisibilityToggle = (isPublic: boolean) => {
    // 在新的Artwork接口中，我们假设所有作品都是公开的
    // 这个功能可能需要在后端API中实现
    console.log('切换作品可见性:', isPublic);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-100 hover:border-gray-200"
      onClick={onClick}
    >
      {/* 视频缩略图 */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {artwork.thumbnail_url && !imageError ? (
          <img
            src={artwork.thumbnail_url}
            alt={artwork.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-150 to-gray-200">
            <Play className="w-12 h-12 text-gray-400 group-hover:text-gray-500 transition-colors" />
          </div>
        )}

        {/* 播放按钮覆盖层 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="w-14 h-14 bg-white bg-opacity-95 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-lg">
            <Play className="w-6 h-6 text-gray-800 ml-1" />
          </div>
        </div>

        {/* 浏览次数 */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center space-x-1 backdrop-blur-sm">
          <Eye className="w-3 h-3" />
          <span>{formatCount(artwork.views_count)}</span>
        </div>

        {/* 时长标识（如果有的话） */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          <span>02:34</span>
        </div>
      </div>

      {/* 作品信息 */}
      <div className="p-4 sm:p-5">
        {/* 标题 */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors text-base leading-tight">
          {artwork.title}
        </h3>

        {/* 描述 */}
        {artwork.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
            {artwork.description}
          </p>
        )}

        {/* 创作者和时间 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="font-medium">用户 {artwork.user_id.slice(-8)}</span>
          </div>
          <span className="text-xs font-medium">{formatDate(artwork.created_at)}</span>
        </div>
        
        {/* 互动数据 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {/* 点赞 */}
            {showLikeButton ? (
              <button
                onClick={handleLikeClick}
                disabled={likeLoading}
                className={`flex items-center space-x-1.5 transition-all duration-200 hover:scale-105 ${
                  liked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-500 hover:text-red-500'
                } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart
                  className={`w-4 h-4 ${liked ? 'fill-current' : ''} transition-all`}
                />
                <span className="text-sm font-medium">{formatCount(likeCount || artwork.likes_count)}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 text-gray-500">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">{formatCount(artwork.likes_count)}</span>
              </div>
            )}

            {/* 评论 */}
            <div className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-700 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{formatCount(0)}</span>
            </div>
          </div>

          {/* 可见性控制 */}
          {showVisibilityToggle && isOwner ? (
            <ArtworkVisibilityToggle
              artworkId={currentArtwork.id}
              isPublic={true}
              onToggle={handleVisibilityToggle}
              className="text-xs"
            />
          ) : (
            <ArtworkVisibilityStatus
              isPublic={true}
              className="text-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;
