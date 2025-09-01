'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GalleryVideo, SortOption, CategoryOption } from '@/services/galleryService';
import { useErrorToast } from '@/components/ui/Toast';
import { monitoringService } from '@/lib/monitoring';
import { VideoItem } from '@/components/ui/VideoGallery';
import { VIDEOS_PER_PAGE } from '@/lib/constants';

export function useGallery(
  initialSort: SortOption = 'trending',
  initialCategory: CategoryOption = 'all'
) {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState(initialSort);
  const [category, setCategory] = useState(initialCategory);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const { showErrorToast } = useErrorToast();

  const fetchVideos = useCallback(
    async (newSort?: SortOption, newCategory?: CategoryOption, loadMore = false) => {
      if (loading) return;
      setLoading(true);
      setError(null);

      try {
        const currentSort = newSort || sort;
        const currentCategory = newCategory || category;
        const isNewQuery = newSort || newCategory || !loadMore;

        let q = query(
          collection(db, 'galleryVideos'),
          orderBy(currentSort, 'desc'),
          limit(VIDEOS_PER_PAGE)
        );

        if (currentCategory !== 'all') {
          q = query(q, where('category', '==', currentCategory));
        }

        if (loadMore && lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(q);
        const newVideos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as GalleryVideo[];

        setVideos(prev => (isNewQuery ? newVideos : [...prev, ...newVideos]));
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === VIDEOS_PER_PAGE);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch videos';
        setError(errorMessage);
        showErrorToast('Failed to load gallery', errorMessage);
        monitoringService.logError(err, { context: 'useGallery' });
      } finally {
        setLoading(false);
      }
    },
    [loading, sort, category, lastDoc, showErrorToast]
  );

  useEffect(() => {
    fetchVideos(sort, category);
  }, [sort, category, fetchVideos]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchVideos(sort, category, true);
    }
  };

  return { videos, loading, error, hasMore, sort, category, setSort, setCategory, loadMore };
}

export function useFeaturedVideos() {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showErrorToast } = useErrorToast();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(
          collection(db, 'galleryVideos'),
          where('isFeatured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const querySnapshot = await getDocs(q);
        const featuredVideos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as GalleryVideo[];
        setVideos(featuredVideos);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured videos';
        setError(errorMessage);
        showErrorToast('Failed to load featured videos', errorMessage);
        monitoringService.logError(err, { context: 'useFeaturedVideos' });
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [showErrorToast]);

  return { videos, loading, error };
}

export function useVideoSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(window.location.search);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.push(`/gallery?${params.toString()}`);
  };

  return { searchTerm, handleSearch };
}

export function useVideo(videoId: string) {
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const videoDocRef = doc(db, 'galleryVideos', videoId);
        const videoDoc = await getDoc(videoDocRef);

        if (videoDoc.exists()) {
          setVideo({ id: videoDoc.id, ...videoDoc.data() } as VideoItem);
        } else {
          setError('Video not found');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video';
        setError(errorMessage);
        monitoringService.logError(err, { context: 'useVideo' });
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  return { video, loading, error };
}