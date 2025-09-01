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
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Video } from '@/types';
import { VIDEOS_PER_PAGE } from '@/lib/constants';
import { useErrorToast } from '@/components/ui/Toast';
import { monitoring } from '@/lib/monitoring';

export function useGallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const showErrorToast = useErrorToast();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      let q = query(
        collection(db, 'videos'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(VIDEOS_PER_PAGE)
      );

      if (lastVisible) {
        q = query(
          collection(db, 'videos'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(VIDEOS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const newVideos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Video[];

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setVideos(prev => (lastVisible ? [...prev, ...newVideos] : newVideos));
      setHasMore(newVideos.length === VIDEOS_PER_PAGE);
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      showErrorToast('Failed to fetch videos', errorMessage);
      monitoring.log('error', 'Failed to fetch gallery videos', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [lastVisible, showErrorToast]);

  const fetchMore = () => {
    if (hasMore && !loading) {
      fetchVideos();
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, hasMore, fetchMore };
}

export function useFeaturedVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showErrorToast = useErrorToast();

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        const q = query(
          collection(db, 'videos'),
          where('isPublic', '==', true),
          where('isFeatured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const featuredVideos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Video[];
        setVideos(featuredVideos);
      } catch (err: unknown) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        showErrorToast('Failed to fetch featured videos', errorMessage);
        monitoring.log('error', 'Failed to fetch featured videos', { error: errorMessage });
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
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showErrorToast = useErrorToast();

  const searchVideos = useCallback(
    async (searchTerm: string, category?: string, sort?: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        // Build query dynamically based on parameters
        let q = query(collection(db, 'videos'), where('isPublic', '==', true));

        if (searchTerm) {
          // Firestore doesn't support full-text search natively.
          // This is a simple "tags" based search.
          q = query(q, where('tags', 'array-contains', searchTerm.toLowerCase()));
        }

        if (category && category !== 'all') {
          q = query(q, where('category', '==', category));
        }

        if (sort === 'popular') {
          q = query(q, orderBy('likes', 'desc'));
        } else {
          q = query(q, orderBy('createdAt', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Video[];
        setSearchResults(results);

        // Update URL query params
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (category) params.set('category', category);
        if (sort) params.set('sort', sort);
        router.push(`/gallery?${params.toString()}`);
      } catch (err: unknown) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        showErrorToast('Failed to search videos', errorMessage);
        monitoring.log('error', 'Failed to search for videos', { error: errorMessage });
      } finally {
        setLoading(false);
      }
    },
    [router, showErrorToast]
  );

  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');

    if (search || category || sort) {
      searchVideos(search || '', category || undefined, sort || undefined);
    }
  }, [searchParams, searchVideos]);

  return { searchResults, loading, error, searchVideos };
}

export function useVideo() {
  const searchParams = useSearchParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showErrorToast = useErrorToast();

  useEffect(() => {
    const fetchVideo = async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        const docRef = doc(db, 'videos', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVideo({ id: docSnap.id, ...docSnap.data() } as Video);
        } else {
          setError('Video not found');
          showErrorToast('Error', 'Video not found');
        }
      } catch (err: unknown) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        showErrorToast('Failed to fetch video', errorMessage);
        monitoring.log('error', 'Failed to fetch video', { id, error: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    const id = searchParams.get('id');
    if (typeof id === 'string') {
      fetchVideo(id);
    }
  }, [searchParams, showErrorToast]);

  return { video, loading, error };
}