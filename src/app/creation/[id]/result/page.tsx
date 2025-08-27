'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { VideoCreation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function CreationResultPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [video, setVideo] = useState<VideoCreation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/video/${videoId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load video');
        }

        // Only show public videos or videos that are completed
        if (!data.isPublic && data.status !== 'completed') {
          throw new Error('Video not found or not available');
        }

        setVideo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const handleShare = async () => {
    try {
      // Track share
      await fetch(`/api/video/${videoId}/share`, { method: 'POST' });
      
      const shareUrl = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: `Check out this Draworld creation: ${video?.title || video?.prompt}`,
          text: 'Amazing AI-generated video from a child\'s drawing!',
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Share link copied to clipboard!');
      } catch {
        alert('Unable to share. Please copy the URL from your browser.');
      }
    }
  };

  const handleDownload = () => {
    if (!video?.videoUrl) return;
    
    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = `${(video.title || video.prompt).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The video you\'re looking for doesn\'t exist or is no longer available.'}
          </p>
          <div className="space-y-3">
            <Link href="/gallery">
              <Button variant="primary" className="w-full">
                Browse Gallery
              </Button>
            </Link>
            <Link href="/create">
              <Button variant="secondary" className="w-full">
                Create Your Own
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Draworld
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/gallery">
                <Button variant="ghost">Gallery</Button>
              </Link>
              <Link href="/create">
                <Button variant="primary">Create</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Video Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {video.title || video.prompt}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Created {formatRelativeTime(video.createdAt.toDate())}</span>
              {video.mood && (
                <span className="capitalize">• {video.mood} mood</span>
              )}
              {video.views > 0 && (
                <span>• {video.views} views</span>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="p-6">
            {video.status === 'completed' && video.videoUrl ? (
              <VideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                title={video.title || video.prompt}
                onShare={handleShare}
                onDownload={handleDownload}
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                {video.status === 'processing' ? (
                  <div className="text-center">
                    <div className="w-16 h-16 animate-spin rounded-full border-4 border-pink-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-600">Video is still processing...</p>
                  </div>
                ) : video.status === 'failed' ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600">Video generation failed</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-blue-600">Video generation pending</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              {video.status === 'completed' && video.videoUrl && (
                <>
                  <Button onClick={handleShare} variant="primary" className="flex-1">
                    🔗 Share This Creation
                  </Button>
                  <Button onClick={handleDownload} variant="secondary" className="flex-1">
                    📥 Download
                  </Button>
                </>
              )}
              <Link href="/create" className="flex-1">
                <Button variant="ghost" className="w-full">
                  🎨 Create Your Own
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bring Your Child's Art to Life
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Transform any drawing into a magical animated video with AI. 
            Upload your child's artwork and watch it come alive!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button variant="primary" size="lg">
                Start Creating
              </Button>
            </Link>
            <Link href="/gallery">
              <Button variant="secondary" size="lg">
                Browse Gallery
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}