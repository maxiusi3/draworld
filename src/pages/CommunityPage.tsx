import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Heart,
  ArrowLeft,
  Grid3X3,
  List,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useArtworks } from '../hooks/useCommunity';
import ArtworkCard from '../components/ArtworkCard';
import ArtworkSearch from '../components/ArtworkSearch';
import { SearchResultsSkeleton } from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'most_liked'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { artworks, loading, error, hasMore, total, loadMore, refresh } = useArtworks(
    20, 
    sortBy, 
    searchQuery
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索会通过useArtworks的依赖自动触发
  };

  const handleArtworkClick = (artworkId: string) => {
    navigate(`/community/artwork/${artworkId}`);
  };

  const getSortIcon = (sort: string) => {
    switch (sort) {
      case 'latest':
        return <Clock className="w-4 h-4" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4" />;
      case 'most_liked':
        return <Heart className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'latest':
        return '最新';
      case 'popular':
        return '最热';
      case 'most_liked':
        return '最多点赞';
      default:
        return '最新';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回首页</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">创意广场</h1>
              <span className="text-sm text-gray-500">({total} 个作品)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={isMobile ? "搜索作品..." : "搜索作品标题或描述..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>

            {/* 控制按钮组 */}
            <div className="flex items-center justify-between lg:justify-end gap-2">
              {/* 视图模式切换 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="网格视图"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="列表视图"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {!isMobile && <span>筛选</span>}
              </button>

              {/* 排序选择 */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="latest">最新</option>
                  <option value="popular">最热</option>
                  <option value="most_liked">最多点赞</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {getSortIcon(sortBy)}
                </div>
              </div>
            </div>
          </div>

          {/* 筛选选项（展开时显示） */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">快速筛选：</span>
                <button
                  onClick={() => {
                    setSortBy('latest');
                    setSearchQuery('');
                  }}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  最新作品
                </button>
                <button
                  onClick={() => {
                    setSortBy('most_liked');
                    setSearchQuery('');
                  }}
                  className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                >
                  热门作品
                </button>
                <button
                  onClick={() => {
                    setSortBy('popular');
                    setSearchQuery('');
                  }}
                  className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                >
                  浏览最多
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <ErrorDisplay
            error={error}
            onRetry={refresh}
            retryLoading={loading}
            size="lg"
            className="max-w-2xl mx-auto"
          />
        ) : (
          <>
            {/* 作品展示区域 */}
            {loading ? (
              <SearchResultsSkeleton viewMode={viewMode} count={isMobile ? 4 : 8} />
            ) : artworks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {searchQuery ? '没有找到相关作品' : '还没有作品'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchQuery ? '尝试使用其他关键词搜索，或者浏览所有作品' : '成为第一个分享作品的用户吧！'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      浏览所有作品
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/create')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    创作新视频
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 网格视图 */}
                {viewMode === 'grid' && (
                  <div className={`grid gap-4 sm:gap-6 ${
                    isMobile
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {artworks.map((artwork) => (
                      <ArtworkCard
                        key={artwork.id}
                        artwork={artwork}
                        onClick={() => handleArtworkClick(artwork.id)}
                      />
                    ))}
                  </div>
                )}

                {/* 列表视图 */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {artworks.map((artwork) => (
                      <div
                        key={artwork.id}
                        onClick={() => handleArtworkClick(artwork.id)}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {/* 缩略图 */}
                          <div className="sm:w-48 sm:h-32 h-48 bg-gray-200 flex-shrink-0">
                            <img
                              src={artwork.thumbnail_url}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>

                          {/* 内容信息 */}
                          <div className="flex-1 p-4 sm:p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                  {artwork.title}
                                </h3>
                                <p className="text-gray-600 mb-3 line-clamp-2">
                                  {artwork.description}
                                </p>

                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{artwork.like_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(artwork.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 状态指示器 */}
                              {!artwork.is_public && (
                                <span className="ml-4 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  私密
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 加载更多 */}
            {hasMore && artworks.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}

            {/* 加载状态 */}
            {loading && artworks.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
