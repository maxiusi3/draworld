'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { AdminService, ModerationVideo } from '@/services/adminService';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

export default function AdminModerationPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<ModerationVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ModerationVideo | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    fetchVideos();
  }, [isAdmin, filter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getModerationQueue({
        status: filter,
        limit: 50,
      });
      setVideos(data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoAction = async (
    videoId: string,
    action: 'approve' | 'reject' | 'promote_to_gallery' | 'remove_from_gallery',
    options: { reason?: string; category?: string; tags?: string[] } = {}
  ) => {
    try {
      setProcessingVideoId(videoId);
      
      const result = await AdminService.moderateVideo(videoId, action, options);
      
      if (result.success) {
        alert(result.message);
        await fetchVideos(); // Refresh the list
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to ${action.replace('_', ' ')}: ${errorMessage}`);
    } finally {
      setProcessingVideoId(null);
    }
  };

  const openVideoModal = (video: ModerationVideo) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const getStatusBadge = (status: string | undefined) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Content Moderation">
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: 'Pending Review' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'all', label: 'All Videos' },
            ].map((tab: { key: string; label: string }) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'pending' | 'approved' | 'rejected' | 'all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No videos found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video: ModerationVideo) => (
            <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Video Thumbnail */}
              <div className="aspect-video bg-gray-200 relative">
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
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={getStatusBadge(video.moderationStatus)}>
                    {getStatusLabel(video.moderationStatus)}
                  </span>
                </div>

                {/* Public Badge */}
                {video.isPublic && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Public
                    </span>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {video.title || video.prompt}
                </h3>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>By: {video.user?.displayName || video.user?.email || 'Unknown'}</p>
                  <p>Created: {formatDate(video.createdAt)}</p>
                  {video.category && (
                    <p>Category: {video.category}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => openVideoModal(video)}
                    variant="secondary"
                    className="w-full text-sm"
                  >
                    View Details
                  </Button>

                  {video.moderationStatus !== 'approved' && video.moderationStatus !== 'rejected' && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleVideoAction(video.id, 'approve')}
                        disabled={processingVideoId === video.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) {
                            handleVideoAction(video.id, 'reject', { reason });
                          }
                        }}
                        disabled={processingVideoId === video.id}
                        variant="secondary"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-sm"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {video.moderationStatus === 'approved' && !video.isPublic && (
                    <Button
                      onClick={() => {
                        const category = prompt('Select category:', video.category || 'general');
                        if (category) {
                          handleVideoAction(video.id, 'promote_to_gallery', { category });
                        }
                      }}
                      disabled={processingVideoId === video.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Promote to Gallery
                    </Button>
                  )}

                  {video.isPublic && (
                    <Button
                      onClick={() => {
                        const reason = prompt('Reason for removal:');
                        if (reason) {
                          handleVideoAction(video.id, 'remove_from_gallery', { reason });
                        }
                      }}
                      disabled={processingVideoId === video.id}
                      variant="secondary"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 text-sm"
                    >
                      Remove from Gallery
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Details Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Video Details</h2>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Player */}
                <div className="space-y-4">
                  {selectedVideo.videoUrl ? (
                    <video
                      src={selectedVideo.videoUrl}
                      controls
                      className="w-full rounded-lg"
                      poster={selectedVideo.thumbnailUrl}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Video not available</p>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title/Prompt</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedVideo.title || selectedVideo.prompt}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Creator</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedVideo.user?.displayName || selectedVideo.user?.email || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-block ${getStatusBadge(selectedVideo.moderationStatus)}`}>
                      {getStatusLabel(selectedVideo.moderationStatus)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedVideo.createdAt)}</p>
                  </div>

                  {selectedVideo.category && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVideo.category}</p>
                    </div>
                  )}

                  {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tags</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedVideo.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedVideo.isPublic}
                      readOnly
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700">Public in Gallery</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}