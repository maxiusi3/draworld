'use client';

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ShareButton } from './ShareButton';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

export interface VideoItem {
  id: string;
  title?: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: Date;
  userId: string;
  userName?: string;
  views?: number;
  likes?: number;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

interface VideoGalleryProps {
  videos: VideoItem[];
  loading?: boolean;
  onVideoClick?: (video: VideoItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showUserInfo?: boolean;
  showStats?: boolean;
  className?: string;
}

export function VideoGallery({
  videos,
  loading = false,
  onVideoClick,
  onLoadMore,
  hasMore = false,
  showUserInfo = true,
  showStats = true,
  className = '',
}: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const handleVideoClick = (video: VideoItem) => {
    setSelectedVideo(video);
    onVideoClick?.(video);
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
        <p className="text-gray-600">Be the first to create and share a magical animation!</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
            onClick={() => handleVideoClick(video)}
            onMouseEnter={() => setHoveredVideo(video.id)}
            onMouseLeave={() => setHoveredVideo(null)}
          >
            {/* Video Thumbnail */}
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title || video.prompt}
                  className="w-full h-full object-cover"
                  width={500}
                  height={281}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Play Button Overlay */}
              <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-200 ${
                hoveredVideo === video.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Category Badge */}
              {video.category && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded-full">
                    {video.category}
                  </span>
                </div>
              )}

              {/* Public Badge */}
              {video.isPublic && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    Public
                  </span>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {video.title || video.prompt}
              </h3>

              {showUserInfo && video.userName && (
                <p className="text-sm text-gray-600 mb-2">
                  By {video.userName}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{formatDate(video.createdAt)}</span>
                
                {showStats && (
                  <div className="flex items-center space-x-3">
                    {video.views !== undefined && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {video.views}
                      </span>
                    )}
                    
                    {video.likes !== undefined && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {video.likes}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {video.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{video.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedVideo.title || selectedVideo.prompt}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Video Player */}
              <div className="mb-6">
                <VideoPlayer
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.thumbnailUrl}
                  title={selectedVideo.title || selectedVideo.prompt}
                />
              </div>

              {/* Video Details */}
              <div className="space-y-4">
                {showUserInfo && selectedVideo.userName && (
                  <div>
                    <span className="text-sm text-gray-600">Created by </span>
                    <span className="font-medium text-gray-900">{selectedVideo.userName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedVideo.createdAt)}
                  </span>
                  
                  <div className="flex items-center space-x-4">
                    {showStats && (
                      <>
                        {selectedVideo.views !== undefined && (
                          <span className="text-sm text-gray-600">
                            {selectedVideo.views} views
                          </span>
                        )}
                        {selectedVideo.likes !== undefined && (
                          <span className="text-sm text-gray-600">
                            {selectedVideo.likes} likes
                          </span>
                        )}
                      </>
                    )}
                    
                    <ShareButton
                      shareUrl={`${window.location.origin}/creation/${selectedVideo.id}/result`}
                      videoTitle={selectedVideo.title || selectedVideo.prompt}
                    />
                  </div>
                </div>

                {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}