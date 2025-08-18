// 语言: TypeScript
// 说明: 作品相关的React Hooks

import { useState, useEffect, useCallback } from 'react';
import { artworkService } from '../services/artworkService';
import { useAuth } from './useAuthContext';
import toast from 'react-hot-toast';
import type {
  Artwork,
  ArtworkListResponse,
  ArtworkDetailResponse,
  ArtworkListRequest,
  ArtworkSortBy,
  CreateArtworkRequest,
  UpdateArtworkRequest,
} from '../types/artwork';

// 作品列表Hook
export function useArtworks(initialRequest: ArtworkListRequest = {}) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchArtworks = useCallback(async (request: ArtworkListRequest = {}, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await artworkService.getArtworks({
        page: 1,
        limit: 20,
        ...initialRequest,
        ...request,
      });

      if (append) {
        setArtworks(prev => [...prev, ...response.artworks]);
      } else {
        setArtworks(response.artworks);
      }
      
      setHasMore(response.hasMore);
      setTotal(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品列表失败');
      console.error('获取作品列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [initialRequest]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    await fetchArtworks({
      ...initialRequest,
      page: currentPage + 1,
    }, true);
  }, [hasMore, loading, currentPage, initialRequest, fetchArtworks]);

  const refresh = useCallback(() => {
    fetchArtworks(initialRequest);
  }, [fetchArtworks, initialRequest]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  return {
    artworks,
    loading,
    error,
    hasMore,
    total,
    currentPage,
    fetchArtworks,
    loadMore,
    refresh,
  };
}

// 作品详情Hook
export function useArtworkDetail(artworkId: string) {
  const [artwork, setArtwork] = useState<ArtworkDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtworkDetail = useCallback(async () => {
    if (!artworkId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await artworkService.getArtworkDetail(artworkId);
      setArtwork(response);
      
      // 记录浏览
      await artworkService.recordArtworkView(artworkId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品详情失败');
      console.error('获取作品详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, [artworkId]);

  useEffect(() => {
    fetchArtworkDetail();
  }, [fetchArtworkDetail]);

  const refresh = useCallback(() => {
    fetchArtworkDetail();
  }, [fetchArtworkDetail]);

  return {
    artwork,
    loading,
    error,
    refresh,
  };
}

// 点赞Hook
export function useLikeArtwork() {
  const [loading, setLoading] = useState(false);

  const toggleLike = useCallback(async (artworkId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await artworkService.toggleLikeArtwork(artworkId);
      
      if (response.creditsEarned && response.creditsEarned > 0) {
        toast.success(`${response.isLiked ? '点赞' : '取消点赞'}成功！获得 ${response.creditsEarned} 积分`);
      } else {
        toast.success(response.isLiked ? '点赞成功！' : '取消点赞成功！');
      }
      
      return response.isLiked;
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
      console.error('点赞操作失败:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    toggleLike,
    loading,
  };
}

// 评论Hook
export function useArtworkComments(artworkId: string) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchComments = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!artworkId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await artworkService.getArtworkComments(artworkId, page);
      
      if (append) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      
      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取评论失败');
      console.error('获取评论失败:', err);
    } finally {
      setLoading(false);
    }
  }, [artworkId]);

  const addComment = useCallback(async (content: string) => {
    try {
      const response = await artworkService.commentArtwork(artworkId, { content });
      setComments(prev => [response.comment, ...prev]);
      setTotal(prev => prev + 1);
      
      if (response.creditsEarned && response.creditsEarned > 0) {
        toast.success(`评论成功！获得 ${response.creditsEarned} 积分`);
      } else {
        toast.success('评论成功！');
      }
      
      return response.comment;
    } catch (err) {
      const message = err instanceof Error ? err.message : '评论失败';
      toast.error(message);
      console.error('评论失败:', err);
      return null;
    }
  }, [artworkId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    hasMore,
    total,
    fetchComments,
    addComment,
  };
}

// 创建作品Hook
export function useCreateArtwork() {
  const [loading, setLoading] = useState(false);

  const createArtwork = useCallback(async (request: CreateArtworkRequest): Promise<Artwork | null> => {
    try {
      setLoading(true);
      const artwork = await artworkService.createArtwork(request);
      toast.success('作品发布成功！');
      return artwork;
    } catch (err) {
      const message = err instanceof Error ? err.message : '发布作品失败';
      toast.error(message);
      console.error('发布作品失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createArtwork,
    loading,
  };
}

// 用户作品Hook
export function useUserArtworks() {
  const { currentUser } = useAuth();
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [likedArtworks, setLikedArtworks] = useState<Artwork[]>([]);
  const [commentedArtworks, setCommentedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyArtworks = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await artworkService.getMyArtworks();
      setMyArtworks(response.artworks);
    } catch (err) {
      console.error('获取我的作品失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchLikedArtworks = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await artworkService.getMyLikedArtworks();
      setLikedArtworks(response.artworks);
    } catch (err) {
      console.error('获取点赞作品失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchCommentedArtworks = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await artworkService.getMyCommentedArtworks();
      setCommentedArtworks(response.artworks);
    } catch (err) {
      console.error('获取评论作品失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return {
    myArtworks,
    likedArtworks,
    commentedArtworks,
    loading,
    fetchMyArtworks,
    fetchLikedArtworks,
    fetchCommentedArtworks,
  };
}
