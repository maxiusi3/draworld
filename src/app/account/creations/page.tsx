"use client";

import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/Button";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { useState, useEffect } from "react";
import { useUserVideos } from "@/hooks/useVideoGeneration";
import { VideoService } from "@/services/videoService";
import { VideoCreation } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const gradients = [
  "from-red-500/20 to-orange-500/20",
  "from-green-500/20 to-blue-500/20", 
  "from-purple-500/20 to-pink-500/20",
  "from-yellow-500/20 to-red-500/20",
  "from-indigo-500/20 to-purple-500/20",
  "from-pink-500/20 to-rose-500/20",
  "from-cyan-500/20 to-blue-500/20",
  "from-emerald-500/20 to-teal-500/20"
];

export default function MyCreationsPage() {
  const [selectedCreation, setSelectedCreation] = useState<VideoCreation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { videos, loading, error, hasMore, loadVideos, deleteVideo, refresh } = useUserVideos();

  // Load videos on component mount
  useEffect(() => {
    loadVideos(true);
  }, []);

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this creation? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(videoId);
    try {
      await deleteVideo(videoId);
      // Close modal if the deleted video was selected
      if (selectedCreation?.id === videoId) {
        setSelectedCreation(null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete video';
      alert(errorMessage);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleShare = async (videoId: string) => {
    try {
      await VideoService.shareVideo(videoId);
      
      // Create shareable URL
      const shareUrl = `${window.location.origin}/creation/${videoId}/result`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my Draworld creation!',
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback: copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/creation/${videoId}/result`;
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      } catch {
        alert('Unable to share. Please try again.');
      }
    }
  };

  const handleDownload = (videoUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGradientClass = (index: number) => {
    return gradients[index % gradients.length];
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Unknown date';
    
    // Handle Firestore Timestamp or regular dates
    const date = typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp 
      ? (timestamp as { toDate: () => Date }).toDate() 
      : new Date(timestamp as string | number | Date);
    return formatRelativeTime(date);
  };

  if (loading && videos.length === 0) {
    return (
      <AccountLayout title="My Creations">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="ml-3 text-gray-400">Loading your creations...</span>
        </div>
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout title="My Creations">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Failed to load creations</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => refresh()} variant="primary">
            Try Again
          </Button>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="My Creations">
      {videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((creation, index) => (
              <div
                key={creation.id}
                className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-600 transition-all group"
              >
                {/* Video Thumbnail */}
                <div className="aspect-video relative overflow-hidden cursor-pointer">
                  {creation.thumbnailUrl ? (
                    <img
                      src={creation.thumbnailUrl}
                      alt={creation.title || creation.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getGradientClass(index)}`} />
                  )}
                  
                  <div
                    className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition-colors"
                    onClick={() => setSelectedCreation(creation)}
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {creation.status !== 'completed' && (
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        creation.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                        creation.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {creation.status === 'processing' ? 'Processing' :
                         creation.status === 'failed' ? 'Failed' :
                         'Pending'}
                      </span>
                    </div>
                  )}

                  {/* Action Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      {creation.status === 'completed' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(creation.id);
                            }}
                            className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            title="Share"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(creation.id);
                        }}
                        disabled={deleteLoading === creation.id}
                        className="w-8 h-8 bg-red-500/50 hover:bg-red-500/70 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleteLoading === creation.id ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">
                    {creation.title || creation.prompt}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formatDate(creation.createdAt)}
                  </p>
                  {creation.mood && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {creation.mood} mood
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button
                onClick={() => loadVideos()}
                disabled={loading}
                variant="secondary"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* Video Modal */}
          {selectedCreation && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedCreation.title || selectedCreation.prompt}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {formatDate(selectedCreation.createdAt)}
                    </p>
                    {selectedCreation.mood && (
                      <p className="text-gray-500 text-sm capitalize">
                        {selectedCreation.mood} mood
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCreation(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Video Player */}
                <div className="p-6">
                  {selectedCreation.status === 'completed' && selectedCreation.videoUrl ? (
                    <VideoPlayer
                      src={selectedCreation.videoUrl}
                      poster={selectedCreation.thumbnailUrl}
                      title={selectedCreation.title || selectedCreation.prompt}
                      className="mb-6"
                      onShare={() => handleShare(selectedCreation.id)}
                      onDownload={() => handleDownload(selectedCreation.videoUrl!, selectedCreation.title || selectedCreation.prompt)}
                    />
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-xl flex items-center justify-center mb-6">
                      {selectedCreation.status === 'processing' ? (
                        <div className="text-center">
                          <div className="w-16 h-16 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent mb-4"></div>
                          <p className="text-yellow-400">Processing video...</p>
                        </div>
                      ) : selectedCreation.status === 'failed' ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-red-400">Video generation failed</p>
                          {selectedCreation.error && (
                            <p className="text-gray-400 text-sm mt-2">{selectedCreation.error}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-blue-400">Video generation pending</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {selectedCreation.status === 'completed' && selectedCreation.videoUrl && (
                      <>
                        <Button
                          onClick={() => handleDownload(selectedCreation.videoUrl!, selectedCreation.title || selectedCreation.prompt)}
                          variant="primary"
                          className="flex-1"
                        >
                          📥 Download
                        </Button>
                        <Button
                          onClick={() => handleShare(selectedCreation.id)}
                          variant="secondary"
                          className="flex-1"
                        >
                          🔗 Share
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => {
                        handleDelete(selectedCreation.id);
                        setSelectedCreation(null);
                      }}
                      disabled={deleteLoading === selectedCreation.id}
                      variant="ghost"
                      className="flex-1 text-red-400 hover:text-red-300"
                    >
                      {deleteLoading === selectedCreation.id ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>🗑️ Delete</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V1" />
            </svg>
          </div>

          <h3 className="text-xl font-semibold mb-2">Your gallery is empty</h3>
          <p className="text-gray-400 mb-6">Let's create some magic!</p>

          <Button as="link" href="/create" variant="primary" size="lg">
            🎨 Start Creating
          </Button>
        </div>
      )}
    </AccountLayout>
  );
}