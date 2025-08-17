import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useArtworkSearch } from '../hooks/useCommunity';
import ArtworkCard from './ArtworkCard';

interface ArtworkSearchProps {
  className?: string;
}

export function ArtworkSearch({ className = '' }: ArtworkSearchProps) {
  const {
    searchQuery,
    debouncedSearchQuery,
    isSearching,
    searchStats,
    sortBy,
    artworks,
    loading,
    error,
    hasMore,
    handleSearch,
    handleSortChange,
    clearSearch,
    loadMore,
  } = useArtworkSearch();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索输入框 */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索作品标题或描述..."
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* 排序选择 */}
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              className="block w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="latest">最新发布</option>
              <option value="popular">最多观看</option>
              <option value="most_liked">最多点赞</option>
            </select>
          </div>
        </div>

        {/* 搜索状态和统计 */}
        {isSearching && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            搜索中...
          </div>
        )}

        {searchStats && !isSearching && (
          <div className="mt-4 text-sm text-gray-600">
            {searchStats.hasResults ? (
              <span>
                找到 <span className="font-medium text-gray-900">{searchStats.total}</span> 个相关作品
                {searchStats.query && (
                  <>
                    ，关键词：<span className="font-medium text-gray-900">"{searchStats.query}"</span>
                  </>
                )}
              </span>
            ) : (
              <span>
                没有找到相关作品
                {searchStats.query && (
                  <>
                    ，关键词：<span className="font-medium text-gray-900">"{searchStats.query}"</span>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 作品列表 */}
      {loading && artworks.length === 0 ? (
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
      ) : artworks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={() => {
                  // 导航到作品详情页
                  window.location.href = `/community/artwork/${artwork.id}`;
                }}
                showLikeButton={true}
              />
            ))}
          </div>

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      ) : !loading && searchStats && !searchStats.hasResults ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关作品</h3>
          <p className="text-gray-500 mb-4">
            尝试使用不同的关键词或浏览所有作品
          </p>
          <button
            onClick={clearSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            浏览所有作品
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ArtworkSearch;
