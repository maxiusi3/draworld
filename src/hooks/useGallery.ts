'use client';

import { useState, useCallback } from 'react';
import { GalleryService, GalleryVideo, SortOption, CategoryOption } from '@/services/galleryService';

interface UseGalleryReturn {
  videos: GalleryVideo[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  category: CategoryOption;
  sort: SortOption;
  loadVideos: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setCategory: (category: CategoryOption) => void;
  setSort: (sort: SortOption) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useGallery(): UseGalleryReturn {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryOption>('all');
  const [sort, setSort] = useState<SortOption>('trending');

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadVideos = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const startAfter = refresh ? undefined : lastDoc;
      const result = await GalleryService.getGalleryVideos(20, startAfter, category, sort);

      if (refresh) {
        setVideos(result.videos);
      } else {
        setVideos(prev => [...prev, ...result.videos]);
      }

      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);

    } catch (err: any) {
      setError(err.message || 'Failed to load gallery videos');
    } finally {
      setLoading(false);
    }
  }, [lastDoc, category, sort]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadVideos(false);
  }, [hasMore, loading, loadVideos]);

  const refresh = useCallback(async () => {
    setLastDoc(null);
    await loadVideos(true);
  }, [loadVideos]);

  const handleCategoryChange = useCallback((newCategory: CategoryOption) => {
    setCategory(newCategory);
    setLastDoc(null);
    setVideos([]);
    setHasMore(true);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setLastDoc(null);
    setVideos([]);
    setHasMore(true);
  }, []);

  return {
    videos,
    loading,
    error,
    hasMore,
    category,
    sort,
    loadVideos,
    loadMore,
    setCategory: handleCategoryChange,
    setSort: handleSortChange,
    refresh,
    clearError,
  };
}

// Hook for featured videos (homepage)
export function useFeaturedVideos() {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeaturedVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await GalleryService.getFeaturedVideos(6);
      setVideos(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load featured videos');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    videos,
    loading,
    error,
    loadFeaturedVideos,
  };
}

// Hook for video search
export function useVideoSearch() {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const searchVideos = useCallback(async (searchQuery: string, refresh = true) => {
    if (!searchQuery.trim()) {
      setVideos([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startAfter = refresh ? undefined : lastDoc;
      const result = await GalleryService.searchVideos(searchQuery, 20, startAfter);

      if (refresh) {
        setVideos(result.videos);
        setQuery(searchQuery);
      } else {
        setVideos(prev => [...prev, ...result.videos]);
      }

      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);

    } catch (err: any) {
      setError(err.message || 'Failed to search videos');
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !query) return;
    await searchVideos(query, false);
  }, [hasMore, loading, query, searchVideos]);

  const clearSearch = useCallback(() => {
    setVideos([]);
    setQuery('');
    setLastDoc(null);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    videos,
    loading,
    error,
    hasMore,
    query,
    searchVideos,
    loadMore,
    clearSearch,
  };
}