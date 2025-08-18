// 语言: TypeScript
// 说明: 创意广场页面

import React, { useState } from 'react';
import { useArtworks, useLikeArtwork } from '../hooks/useArtworks';
import { ArtworkSortBy } from '../types/artwork';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { Artwork } from '../types/artwork';

const GalleryPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<ArtworkSortBy>(ArtworkSortBy.LATEST);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { artworks, loading, error, hasMore, loadMore, fetchArtworks } = useArtworks({
    filter: { sortBy, tags: selectedTags },
    limit: 12,
  });
  
  const { toggleLike, loading: likeLoading } = useLikeArtwork();

  const handleSortChange = (newSortBy: ArtworkSortBy) => {
    setSortBy(newSortBy);
    fetchArtworks({ filter: { sortBy: newSortBy, tags: selectedTags } });
  };

  const handleLike = async (artwork: Artwork) => {
    const newLikeStatus = await toggleLike(artwork.id);
    // 更新本地状态
    // 这里可以优化为更新artworks数组中对应项目的点赞状态
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 实现搜索功能
      console.log('搜索:', searchQuery);
    }
  };

  const sortOptions = [
    { value: ArtworkSortBy.LATEST, label: '最新' },
    { value: ArtworkSortBy.POPULAR, label: '最热门' },
    { value: ArtworkSortBy.MOST_LIKED, label: '最多点赞' },
    { value: ArtworkSortBy.MOST_VIEWED, label: '最多浏览' },
  ];

  const popularTags = ['可爱', '梦幻', '科幻', '自然', '动物', '城市', '抽象', '卡通'];

  if (loading && artworks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && artworks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <SparklesIcon className="w-12 h-12 mr-3" />
              <h1 className="text-4xl font-bold">创意广场</h1>
            </div>
            <p className="text-xl opacity-90">
              发现和分享精彩的AI创作作品
            </p>
          </div>

          {/* 搜索栏 */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索作品、标签或创作者..."
                className="w-full px-4 py-3 pl-12 pr-16 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                搜索
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 筛选和排序 */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          {/* 排序选项 */}
          <div className="flex items-center space-x-4">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${sortBy === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 热门标签 */}
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const newTags = selectedTags.includes(tag)
                    ? selectedTags.filter(t => t !== tag)
                    : [...selectedTags, tag];
                  setSelectedTags(newTags);
                  fetchArtworks({ filter: { sortBy, tags: newTags } });
                }}
                className={`
                  px-3 py-1 rounded-full text-sm transition-colors
                  ${selectedTags.includes(tag)
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* 作品网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* 作品缩略图 */}
              <div className="relative aspect-video bg-gray-200">
                <img
                  src={artwork.thumbnailUrl}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <button className="opacity-0 hover:opacity-100 bg-white bg-opacity-90 rounded-full p-3 transform scale-90 hover:scale-100 transition-all duration-200">
                    <EyeIcon className="w-6 h-6 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* 作品信息 */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {artwork.title}
                </h3>
                
                {artwork.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {artwork.description}
                  </p>
                )}

                {/* 创作者信息 */}
                <div className="flex items-center mb-3">
                  <img
                    src={artwork.userAvatar || '/default-avatar.png'}
                    alt={artwork.userName}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-600">{artwork.userName}</span>
                </div>

                {/* 标签 */}
                {artwork.tags && artwork.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {artwork.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 互动数据 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {(artwork.viewsCount || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                      {artwork.commentsCount || 0}
                    </div>
                  </div>

                  {/* 点赞按钮 */}
                  <button
                    onClick={() => handleLike(artwork)}
                    disabled={likeLoading}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <HeartIcon className="w-4 h-4" />
                    <span>{artwork.likesCount}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 加载更多 */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}

        {/* 空状态 */}
        {artworks.length === 0 && !loading && (
          <div className="text-center py-12">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无作品</h3>
            <p className="text-gray-500">
              {searchQuery || selectedTags.length > 0 
                ? '没有找到符合条件的作品，试试其他关键词或标签'
                : '还没有作品，快来创作第一个吧！'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
