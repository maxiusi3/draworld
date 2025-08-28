"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { useState, useEffect } from "react";
import { useGallery } from "@/hooks/useGallery";
import { GalleryService, CategoryOption, SortOption, GalleryVideo } from "@/services/galleryService";
import { formatRelativeTime } from "@/lib/utils";
import { usePageView } from "@/hooks/useAnalytics";
import { trackGalleryView } from "@/lib/analytics";

const gradients = [
  "from-red-500/20 to-orange-500/20",
  "from-green-500/20 to-blue-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-yellow-500/20 to-red-500/20",
  "from-blue-500/20 to-purple-500/20",
  "from-pink-500/20 to-purple-500/20",
  "from-indigo-500/20 to-purple-500/20",
  "from-cyan-500/20 to-blue-500/20",
];

export default function GalleryPage() {
  const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
  
  usePageView('gallery_page');
  
  // Track gallery view on mount
  useEffect(() => {
    trackGalleryView('public');
  }, []);
  const { 
    videos, 
    loading, 
    error, 
    hasMore, 
    category, 
    sort, 
    loadVideos, 
    loadMore, 
    setCategory, 
    setSort, 
    refresh 
  } = useGallery();

  // Load videos on component mount and when filters change
  useEffect(() => {
    loadVideos(true);
  }, [category, sort]);

  const handleCategoryChange = (newCategory: string) => {
    const categoryOption = newCategory.toLowerCase() as CategoryOption;
    if (GalleryService.isValidCategory(categoryOption)) {
      setCategory(categoryOption);
    }
  };

  const handleSortChange = (newSort: string) => {
    const sortOption = newSort.toLowerCase().replace(' ', '') as SortOption;
    if (newSort === 'Most Popular') {
      setSort('popular');
    } else if (GalleryService.isValidSortOption(sortOption)) {
      setSort(sortOption);
    }
  };

  const handleShare = async (video: GalleryVideo) => {
    try {
      const shareUrl = `${window.location.origin}/creation/${video.id}/result`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Check out this amazing creation: ${video.title || video.prompt}`,
          text: 'Amazing AI-generated video from a child\'s drawing!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      try {
        const shareUrl = `${window.location.origin}/creation/${video.id}/result`;
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      } catch {
        alert('Unable to share. Please try again.');
      }
    }
  };

  const getGradientClass = (index: number) => {
    return gradients[index % gradients.length];
  };

  const getCreatorDescription = (video: GalleryVideo) => {
    if (video.creatorAge) {
      return `talented ${video.creatorAge}-year-old artist`;
    }
    return 'young artist';
  };

  const categories = ['All', 'Animals', 'Fantasy', 'Nature', 'Vehicles'];
  const sortOptions = ['Trending', 'Newest', 'Most Popular'];

  return (
    <div className="min-h-screen bg-black text-white" data-oid=":331woc">
      <Header data-oid="c5bz_7r" />

      <main className="py-20" data-oid="41eh.lo">
        {/* Header Section */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12" data-oid="krr36lz">
          <div className="max-w-7xl mx-auto text-center" data-oid="5ioh5lc">
            <h1
              className="text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
              data-oid="4l99wod">

              The Draworld Gallery
            </h1>
            <p
              className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
              data-oid="x904bgy">

              A universe of imagination from young artists around the globe.
            </p>
          </div>
        </section>

        {/* Filter & Sort Controls */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" data-oid="9yvu1us">
          <div className="max-w-7xl mx-auto" data-oid="jn9gui6">
            <div
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              data-oid="nasy1vo">

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map((categoryName) => (
                  <button
                    key={categoryName}
                    onClick={() => handleCategoryChange(categoryName)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      GalleryService.getCategoryDisplayName(category) === categoryName
                        ? "bg-pink-500 text-white"
                        : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                    }`}
                  >
                    {GalleryService.getCategoryIcon(categoryName.toLowerCase() as CategoryOption)} {categoryName}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Sort by:</span>
                <select
                  value={GalleryService.getSortDisplayName(sort)}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Creations Grid */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            {loading && videos.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                <span className="ml-3 text-gray-400">Loading gallery...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Failed to load gallery</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={refresh} variant="primary">
                  Try Again
                </Button>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No creations found</h3>
                <p className="text-gray-400 mb-6">
                  {category === 'all' 
                    ? 'Be the first to share your creation with the world!'
                    : `No ${GalleryService.getCategoryDisplayName(category).toLowerCase()} creations yet.`
                  }
                </p>
                <Button as="link" href="/create" variant="primary">
                  Create First Video
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all hover:scale-105 cursor-pointer group"
                      onClick={() => setSelectedVideo(video)}
                    >
                      {/* Video Thumbnail */}
                      <div className="aspect-video relative overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || video.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getGradientClass(index)}`} />
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Category Badge */}
                        {video.category && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full capitalize">
                              {video.category}
                            </span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                          {video.views > 0 && (
                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                              👁️ {video.views}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {video.title || video.prompt}
                        </h3>
                        <p className="text-sm text-gray-400">
                          By a {getCreatorDescription(video)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(video.createdAt.toDate())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="secondary"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-500/10 to-purple-500/10 py-16"
          data-oid="k_fe8o-">

          <div className="max-w-4xl mx-auto text-center" data-oid="2ae:6yh">
            <h2 className="text-4xl font-bold mb-6" data-oid="-bpx4at">
              Ready to Create Your Own Magic?
            </h2>
            <p className="text-xl text-gray-300 mb-8" data-oid="dett6h6">
              Join thousands of young artists bringing their drawings to life.
            </p>
            <Button
              as="link"
              href="/create"
              variant="primary"
              size="lg"
              className="text-lg px-8 py-4"
              data-oid="xl:ti:u">

              Start Creating Now
            </Button>
          </div>
        </section>
      </main>

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedVideo.title || selectedVideo.prompt}
                </h3>
                <p className="text-gray-400 text-sm">
                  By a {getCreatorDescription(selectedVideo)}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatRelativeTime(selectedVideo.createdAt.toDate())}
                </p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Player */}
            <div className="p-6">
              {selectedVideo.videoUrl ? (
                <VideoPlayer
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.thumbnailUrl}
                  title={selectedVideo.title || selectedVideo.prompt}
                  className="mb-6"
                  onShare={() => handleShare(selectedVideo)}
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleShare(selectedVideo)}
                  variant="secondary"
                  className="flex-1"
                >
                  🔗 Share This Creation
                </Button>
                <Button
                  as="link"
                  href="/create"
                  variant="primary"
                  className="flex-1"
                >
                  🎨 Create Your Own Animation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer data-oid="a1skovc" />
    </div>);

}