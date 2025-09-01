"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { SocialProof } from "@/components/ui/SocialProof";
import { ShareButton } from "@/components/ui/ShareButton";
import { useFeaturedVideos } from "@/hooks/useGallery";
import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { usePageView } from "@/hooks/useAnalytics";
import { GalleryVideo } from "@/services/galleryService";
import { formatRelativeTime } from "@/lib/utils";
import Image from 'next/image';

export default function HomePage() {
  const { videos: featuredVideos, loading: featuredLoading, loadFeaturedVideos } = useFeaturedVideos();
  const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
  
  usePageView('homepage');

  useEffect(() => {
    loadFeaturedVideos();
  }, [loadFeaturedVideos]);

  const gradients = [
    "from-pink-500/20 to-purple-500/20",
    "from-blue-500/20 to-cyan-500/20",
    "from-green-500/20 to-emerald-500/20",
    "from-yellow-500/20 to-orange-500/20",
    "from-purple-500/20 to-indigo-500/20",
    "from-red-500/20 to-pink-500/20",
  ];

  const getGradientClass = (index: number) => {
    return gradients[index % gradients.length];
  };
  return (
    <div className="min-h-screen bg-black text-white" data-oid="y1-zq.:">
      <Header data-oid="ooe30_l" />

      <main data-oid="ffc0ykb">
        {/* Hero Section */}
        <section
          className="relative py-20 px-4 sm:px-6 lg:px-8"
          data-oid="yjpd20.">

          <div className="max-w-7xl mx-auto text-center" data-oid="3_8xy11">
            <h1
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
              data-oid=".:o42pp">

              Bring Your Child's Art to Life with AI
            </h1>
            <p
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
              data-oid="hvwumct">

              Turn any drawing into a magical animated video in seconds.
              Preserve their masterpieces forever.
            </p>
            <Button
              as="link"
              href="/create"
              variant="primary"
              size="lg"
              className="text-lg px-8 py-4"
              data-oid=":hymtxr">

              Create Your Masterpiece for Free
            </Button>

            {/* Visual Element Placeholder */}
            <div
              className="mt-12 bg-zinc-900 rounded-2xl p-8 max-w-4xl mx-auto"
              data-oid="7ewqboa">

              <div
                className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center"
                data-oid="tv-m_m3">

                <p className="text-gray-400" data-oid="xl0nm_6">
                  ✨ Demo video showcasing before/after animations ✨
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto">
            <SocialProof />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" data-oid="qgggad:">
          <div className="max-w-7xl mx-auto" data-oid="5r0j:o.">
            <h2
              className="text-4xl font-bold text-center mb-16"
              data-oid="izlt.:a">

              Three Easy Steps to Magic
            </h2>
            <div className="grid md:grid-cols-3 gap-8" data-oid="k-4:zh2">
              <div className="text-center" data-oid="0odif8p">
                <div
                  className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  data-oid="br3:o92">

                  <span className="text-2xl" data-oid="zk0c1vt">
                    📸
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2" data-oid="bmpr-00">
                  Upload a Drawing
                </h3>
                <p className="text-gray-400" data-oid="a_rjatn">
                  Snap a photo or upload from your device.
                </p>
              </div>
              <div className="text-center" data-oid="41nsa6e">
                <div
                  className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  data-oid="3-vr27e">

                  <span className="text-2xl" data-oid="f03beg3">
                    ✍️
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2" data-oid="21l-3b8">
                  Add a Prompt
                </h3>
                <p className="text-gray-400" data-oid="a:spxcc">
                  Describe the action, like "A lion roaring on a mountain".
                </p>
              </div>
              <div className="text-center" data-oid="bcxuw5x">
                <div
                  className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  data-oid="7qcrtyz">

                  <span className="text-2xl" data-oid="hkc1zcb">
                    🎬
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2" data-oid="h61fh5_">
                  Generate & Share
                </h3>
                <p className="text-gray-400" data-oid=".g1jtow">
                  Watch the magic unfold and share your animated story.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Creations Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">
              See What Young Artists Are Creating
            </h2>
            
            {featuredLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                <span className="ml-3 text-gray-400">Loading featured creations...</span>
              </div>
            ) : featuredVideos.length > 0 ? (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {featuredVideos.slice(0, 3).map((video, index) => (
                    <div
                      key={video.id}
                      className="bg-zinc-800 rounded-xl p-4 cursor-pointer hover:bg-zinc-700 transition-colors group"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="aspect-video relative rounded-lg mb-4 overflow-hidden">
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title || video.prompt}
                            className="w-full h-full object-cover"
                            width={500}
                            height={281}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getGradientClass(index)}`} />
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {video.title || video.prompt}
                      </h3>
                      <p className="text-sm text-gray-400">
                        A magical creation by a young artist
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(new Date(video.createdAt))}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button as="link" href="/gallery" variant="secondary" size="lg">
                    Explore the Gallery
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0V1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No featured creations yet</h3>
                <p className="text-gray-400 mb-6">Be the first to create and share your magical video!</p>
                <Button as="link" href="/create" variant="primary" size="lg">
                  Create First Video
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Parent Testimonials Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" data-oid="ef:51ug">
          <div className="max-w-7xl mx-auto" data-oid="a:1g3qu">
            <h2
              className="text-4xl font-bold text-center mb-16"
              data-oid=":_rpxet">

              Why Parents and Kids Love Draworld
            </h2>
            <div className="grid md:grid-cols-3 gap-8" data-oid="x5:kjzg">
              {[
              {
                quote:
                "My daughter was absolutely amazed when she saw her drawing come to life. It's like magic!",
                author: "Sarah M., Mom of Two"
              },
              {
                quote:
                "Finally, a way to preserve all those precious artworks without cluttering the house.",
                author: "Mike R., Dad of Three"
              },
              {
                quote:
                "The kids are so motivated to draw more now. It's sparked their creativity in amazing ways.",
                author: "Lisa K., Art Teacher & Mom"
              }].
              map((testimonial: { quote: string; author: string }, i: number) =>
              <div
                key={i}
                className="bg-zinc-800 rounded-xl p-6"
                data-oid="zeqyu-r">

                  <div className="flex mb-4" data-oid="4qb9fg6">
                    {[...Array(5)].map((_, j: number) =>
                  <span
                    key={j}
                    className="text-yellow-400"
                    data-oid="3eto0jj">

                        ⭐
                      </span>
                  )}
                  </div>
                  <p className="text-gray-300 mb-4" data-oid=":5_hqsf">
                    "{testimonial.quote}"
                  </p>
                  <p className="text-sm text-gray-400" data-oid="czxd1uq">
                    — {testimonial.author}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-500/10 to-purple-500/10"
          data-oid="oksvtyv">

          <div className="max-w-4xl mx-auto text-center" data-oid="viozn6u">
            <h2 className="text-4xl font-bold mb-6" data-oid="4n87jyn">
              Ready to Animate Their Imagination?
            </h2>
            <p className="text-xl text-gray-300 mb-8" data-oid="dg7ant-">
              Join thousands of families creating magical memories with
              Draworld.
            </p>
            <Button
              as="link"
              href="/signup"
              variant="primary"
              size="lg"
              className="text-lg px-8 py-4"
              data-oid="_9lqe-m">

              Sign Up and Start Creating
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Featured Video Modal */}
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
                  By a young artist • {formatRelativeTime(new Date(selectedVideo.createdAt))}
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
                  as="link"
                  href="/create"
                  variant="primary"
                  className="flex-1"
                >
                  🎨 Create Your Own Animation
                </Button>
                <Button
                  as="link"
                  href="/gallery"
                  variant="secondary"
                  className="flex-1"
                >
                  🖼️ Explore More Creations
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}