'use client';

import { useState, useCallback } from 'react';
import { VideoService, VideoGenerationRequest, VideoStatusResponse } from '@/services/videoService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  trackVideoGenerationStarted, 
  trackVideoGenerationFailed 
} from '@/lib/analytics';

interface UseVideoGenerationReturn {
  generateVideo: (request: VideoGenerationRequest) => Promise<string>;
  pollVideoStatus: (videoCreationId: string) => Promise<VideoStatusResponse>;
  loading: boolean;
  error: string | null;
  progress: {
    status: string;
    message: string;
    videoCreationId?: string;
  } | null;
  clearError: () => void;
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    message: string;
    videoCreationId?: string;
  } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateVideo = useCallback(async (request: VideoGenerationRequest): Promise<string> => {
    setLoading(true);
    setError(null);
    setProgress({
      status: 'starting',
      message: 'Starting video generation...',
    });

    try {
      // Validate request
      const validation = VideoService.validateGenerationRequest(request);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }

      // Track generation start
      trackVideoGenerationStarted(request.prompt, request.mood);

      // Start generation
      const result = await VideoService.generateVideo(request);
      
      setProgress({
        status: 'initiated',
        message: 'Video generation started successfully!',
        videoCreationId: result.videoCreationId,
      });

      // Refresh user data to update credits
      await refreshUser();

      return result.videoCreationId;

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start video generation';
      setError(errorMessage);
      setProgress({
        status: 'error',
        message: errorMessage,
      });
      
      // Track generation failure
      trackVideoGenerationFailed(errorMessage, request.mood, 0);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const pollVideoStatus = useCallback(async (videoCreationId: string): Promise<VideoStatusResponse> => {
    setLoading(true);
    setError(null);
    setProgress({
      status: 'checking',
      message: 'Checking video status...',
      videoCreationId,
    });

    try {
      const result = await VideoService.pollVideoStatus(
        videoCreationId,
        (status) => {
          // Update progress during polling
          const statusMessages = {
            pending: 'Video generation is queued...',
            processing: 'Creating your magical video...',
            completed: 'Video generation completed!',
            failed: 'Video generation failed',
          };

          setProgress({
            status: status.status,
            message: statusMessages[status.status] || `Status: ${status.status}`,
            videoCreationId,
          });
        }
      );

      setProgress({
        status: 'completed',
        message: 'Video is ready!',
        videoCreationId,
      });

      return result;

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video';
      setError(errorMessage);
      setProgress({
        status: 'error',
        message: errorMessage,
        videoCreationId,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateVideo,
    pollVideoStatus,
    loading,
    error,
    progress,
    clearError,
  };
}

// Hook for managing user's video library
export function useUserVideos() {
  const [videos, setVideos] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<string | null>(null);

  const loadVideos = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const startAfter = refresh ? undefined : lastDoc || undefined;
      const result = await VideoService.getUserVideos(20, startAfter);

      if (refresh) {
        setVideos(result.videos);
      } else {
        setVideos(prev => [...prev, ...result.videos]);
      }

      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      await VideoService.deleteVideo(videoId);
      setVideos(prev => prev.filter(video => video.id !== videoId));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete video';
      throw new Error(errorMessage);
    }
  }, []);

  const updateVideoVisibility = useCallback(async (videoId: string, isPublic: boolean) => {
    try {
      await VideoService.updateVideoVisibility(videoId, isPublic);
      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, isPublic } : video
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update video visibility';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    videos,
    loading,
    error,
    hasMore,
    loadVideos,
    deleteVideo,
    updateVideoVisibility,
    refresh: () => loadVideos(true),
  };
}