// 社区功能相关的 React Hooks
import { useState, useEffect, useCallback, useMemo } from 'react';
import { communityService, Artwork, ArtworkComment, ArtworksResponse } from '../services/communityService';
import { toast } from 'react-hot-toast';
import { useErrorHandler } from '../utils/errorHandler';

// 防抖Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 获取作品列表的Hook
export const useArtworks = (
  limit: number = 20,
  sortBy: 'latest' | 'popular' | 'most_liked' = 'latest',
  searchQuery?: string
) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const { handleError, executeWithRetry } = useErrorHandler();

  const loadArtworks = async (offset: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await executeWithRetry(
        () => communityService.getArtworks(limit, offset, sortBy, searchQuery),
        {
          maxAttempts: 2,
          onRetry: (attempt) => {
            console.log(`重试获取作品列表 (第${attempt}次)`);
          }
        }
      );

      if (append) {
        setArtworks(prev => [...prev, ...response.artworks]);
      } else {
        setArtworks(response.artworks);
      }

      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (error: any) {
      console.error('获取作品列表失败:', error);
      const errorInfo = handleError(error, '获取作品列表失败');
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadArtworks(artworks.length, true);
    }
  };

  const refresh = () => {
    loadArtworks(0, false);
  };

  useEffect(() => {
    loadArtworks();

    // 监听社区数据更新事件
    const handleCommunityUpdate = () => {
      refresh();
    };

    window.addEventListener('communityUpdated', handleCommunityUpdate);

    return () => {
      window.removeEventListener('communityUpdated', handleCommunityUpdate);
    };
  }, [limit, sortBy, searchQuery]);

  return {
    artworks,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
};

// 获取单个作品详情的Hook
export const useArtwork = (artworkId: string) => {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArtwork = async () => {
    if (!artworkId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await communityService.getArtwork(artworkId);
      setArtwork(data);
    } catch (error: any) {
      console.error('获取作品详情失败:', error);
      setError(error.message || '获取作品详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtwork();
  }, [artworkId]);

  return {
    artwork,
    loading,
    error,
    refresh: loadArtwork,
  };
};

// 点赞功能的Hook
export const useLike = (artworkId: string) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkLikeStatus = async () => {
    try {
      const isLiked = await communityService.isLikedByUser(artworkId);
      setLiked(isLiked);
    } catch (error) {
      console.error('检查点赞状态失败:', error);
    }
  };

  const toggleLike = async () => {
    try {
      setLoading(true);

      const result = await communityService.toggleLike(artworkId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);

      // 显示基本操作提示
      const baseMessage = result.liked ? '点赞成功' : '取消点赞';

      // 显示奖励信息
      if (result.rewards && result.rewards.success && result.rewards.messages.length > 0) {
        // 如果有奖励，显示奖励信息
        const rewardMessages = result.rewards.messages.join('，');
        toast.success(`${baseMessage}！${rewardMessages}`, { duration: 4000 });

        // 触发积分更新事件
        window.dispatchEvent(new CustomEvent('creditsUpdated'));
      } else {
        toast.success(baseMessage);
      }
    } catch (error: any) {
      console.error('点赞操作失败:', error);
      toast.error('点赞操作失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (artworkId) {
      checkLikeStatus();
    }
  }, [artworkId]);

  return {
    liked,
    likeCount,
    loading,
    toggleLike,
  };
};

// 评论功能的Hook
export const useComments = (artworkId: string) => {
  const [comments, setComments] = useState<ArtworkComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    if (!artworkId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await communityService.getArtworkComments(artworkId);
      setComments(data);
    } catch (error: any) {
      console.error('获取评论列表失败:', error);
      setError(error.message || '获取评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    try {
      setSubmitting(true);
      
      const newComment = await communityService.addComment(artworkId, content);
      
      // 只有通过审核的评论才显示
      if (newComment.is_approved) {
        setComments(prev => [...prev, newComment]);
        toast.success('评论发表成功');
      } else {
        toast('评论已提交，正在审核中', { icon: 'ℹ️' });
      }
      
      return true;
    } catch (error: any) {
      console.error('发表评论失败:', error);
      toast.error('发表评论失败');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [artworkId]);

  return {
    comments,
    loading,
    error,
    submitting,
    addComment,
    refresh: loadComments,
  };
};

// 用户作品的Hook
export const useUserArtworks = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserArtworks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await communityService.getUserArtworks();
      setArtworks(data);
    } catch (error: any) {
      console.error('获取用户作品失败:', error);
      setError(error.message || '获取用户作品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserArtworks();

    // 监听社区数据更新事件
    const handleCommunityUpdate = () => {
      loadUserArtworks();
    };

    window.addEventListener('communityUpdated', handleCommunityUpdate);

    return () => {
      window.removeEventListener('communityUpdated', handleCommunityUpdate);
    };
  }, []);

  return {
    artworks,
    loading,
    error,
    refresh: loadUserArtworks,
  };
};

// 用户点赞作品的Hook
export const useUserLikedArtworks = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserLikedArtworks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await communityService.getUserLikedArtworks();
      setArtworks(data);
    } catch (error: any) {
      console.error('获取用户点赞作品失败:', error);
      setError(error.message || '获取用户点赞作品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserLikedArtworks();

    // 监听社区数据更新事件
    const handleCommunityUpdate = () => {
      loadUserLikedArtworks();
    };

    window.addEventListener('communityUpdated', handleCommunityUpdate);

    return () => {
      window.removeEventListener('communityUpdated', handleCommunityUpdate);
    };
  }, []);

  return {
    artworks,
    loading,
    error,
    refresh: loadUserLikedArtworks,
  };
};

// 用户评论的Hook
export const useUserComments = () => {
  const [comments, setComments] = useState<ArtworkComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await communityService.getUserComments();
      setComments(data);
    } catch (error: any) {
      console.error('获取用户评论失败:', error);
      setError(error.message || '获取用户评论失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserComments();

    // 监听社区数据更新事件
    const handleCommunityUpdate = () => {
      loadUserComments();
    };

    window.addEventListener('communityUpdated', handleCommunityUpdate);

    return () => {
      window.removeEventListener('communityUpdated', handleCommunityUpdate);
    };
  }, []);

  return {
    comments,
    loading,
    error,
    refresh: loadUserComments,
  };
};

// 搜索Hook，支持防抖和实时搜索
export const useArtworkSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'most_liked'>('latest');
  const [isSearching, setIsSearching] = useState(false);

  // 防抖搜索查询
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 使用防抖后的搜索查询获取作品
  const {
    artworks,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  } = useArtworks(20, sortBy, debouncedSearchQuery);

  // 搜索状态管理
  useEffect(() => {
    setIsSearching(loading && debouncedSearchQuery.length > 0);
  }, [loading, debouncedSearchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSortChange = useCallback((newSortBy: 'latest' | 'popular' | 'most_liked') => {
    setSortBy(newSortBy);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // 搜索统计信息
  const searchStats = useMemo(() => {
    if (!debouncedSearchQuery) {
      return null;
    }

    return {
      query: debouncedSearchQuery,
      total,
      hasResults: total > 0,
    };
  }, [debouncedSearchQuery, total]);

  return {
    // 搜索状态
    searchQuery,
    debouncedSearchQuery,
    isSearching,
    searchStats,

    // 排序状态
    sortBy,

    // 结果数据
    artworks,
    loading,
    error,
    hasMore,
    total,

    // 操作方法
    handleSearch,
    handleSortChange,
    clearSearch,
    loadMore,
    refresh,
  };
};

// 分页Hook，用于更精细的分页控制
export const useArtworkPagination = (
  pageSize: number = 20,
  sortBy: 'latest' | 'popular' | 'most_liked' = 'latest',
  searchQuery?: string
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const loadPage = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;
      const response = await communityService.getArtworks(pageSize, offset, sortBy, searchQuery);

      setAllArtworks(response.artworks);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / pageSize));
      setCurrentPage(page);
    } catch (error: any) {
      console.error('获取作品列表失败:', error);
      setError(error.message || '获取作品列表失败');
      toast.error('获取作品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadPage(page);
    }
  }, [currentPage, totalPages, loadPage]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const refresh = useCallback(() => {
    loadPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    loadPage(1);
  }, [pageSize, sortBy, searchQuery]);

  return {
    // 数据
    artworks: allArtworks,
    loading,
    error,
    total,

    // 分页状态
    currentPage,
    totalPages,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,

    // 操作方法
    goToPage,
    nextPage,
    prevPage,
    refresh,
  };
};
