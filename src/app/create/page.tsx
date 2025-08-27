"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { InsufficientCreditsModal } from "@/components/ui/InsufficientCreditsModal";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";
import { useRouter } from "next/navigation";
import { CREDITS, MOODS } from "@/lib/constants";

type Step = "upload" | "crop" | "prompt" | "generating" | "result";
type Mood = "joyful" | "calm" | "epic" | "mysterious";

const promptTemplates = [
  "A [character] is [action] in a [place]",
  "A magical [creature] flying through [environment]",
  "A brave [hero] exploring a [mysterious place]",
  "A happy [animal] playing in the [location]",
  "The [object] is glowing in the [time of day]",
  "A [vehicle] racing through [environment]",
];


export default function CreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { generateVideo, pollVideoStatus, loading, error, progress, clearError } = useVideoGeneration();
  
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [title, setTitle] = useState("");
  const [videoCreationId, setVideoCreationId] = useState<string | null>(null);
  const [completedVideo, setCompletedVideo] = useState<any>(null);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/create');
    }
  }, [user, router]);

  if (!user) {
    return null; // Will redirect
  }

  const handleTemplateClick = (template: string) => {
    setPrompt(template);
  };

  const handleGenerate = async () => {
    if (!selectedMood || !prompt.trim() || !croppedImage) return;

    // Check if user has enough credits
    if (user.credits < CREDITS.VIDEO_CREATION_COST) {
      setShowInsufficientCredits(true);
      return;
    }

    clearError();
    setCurrentStep("generating");

    try {
      const videoId = await generateVideo({
        imageUrl: croppedImage,
        prompt: prompt.trim(),
        mood: selectedMood,
        title: title.trim() || 'Untitled Creation',
      });

      setVideoCreationId(videoId);

      // Start polling for completion
      const result = await pollVideoStatus(videoId);
      setCompletedVideo(result);
      setCurrentStep("result");

    } catch (err: any) {
      console.error('Video generation failed:', err);
      // Error is handled by the hook, just stay on current step
      setCurrentStep("prompt");
    }
  };

  const handleStartOver = () => {
    setCurrentStep("upload");
    setUploadedImage(null);
    setCroppedImage(null);
    setPrompt("");
    setSelectedMood(null);
    setTitle("");
    setVideoCreationId(null);
    setCompletedVideo(null);
    clearError();
  };

  const renderUploadStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Step 1: Upload a Drawing
        </h1>
        <p className="text-gray-400">
          Share your child's artwork to bring it to life
        </p>
      </div>

      {!uploadedImage ? (
        <ImageUploader
          onImageUploaded={(imageUrl, file) => {
            setUploadedImage(imageUrl);
          }}
          onError={(error) => {
            console.error('Upload error:', error);
            // You could add a toast notification here
          }}
          className="mb-8"
        />
      ) : (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-700">
          <div className="text-center">
            <div className="max-w-md mx-auto mb-6">
              <img
                src={uploadedImage}
                alt="Uploaded artwork"
                className="w-full rounded-xl border border-zinc-700"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setUploadedImage(null)}
                variant="secondary"
              >
                Choose Different Image
              </Button>

              <Button
                onClick={() => setCurrentStep("crop")}
                variant="primary"
                size="lg"
              >
                Crop & Continue →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCropStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-white">
          Step 2: Crop Your Artwork
        </h1>
        <p className="text-gray-400">
          Select the area you want to bring to life
        </p>
      </div>

      {uploadedImage && (
        <ImageCropper
          imageUrl={uploadedImage}
          onCropComplete={(croppedUrl) => {
            setCroppedImage(croppedUrl);
            setCurrentStep("prompt");
          }}
          onCancel={() => setCurrentStep("upload")}
          className="mb-8"
        />
      )}
    </div>
  );

  const renderPromptStep = () => (
  <div className="max-w-6xl mx-auto" data-oid="hpm1jxu">
      <div className="text-center mb-8" data-oid="3t:xjdq">
        <h1 className="text-4xl font-bold mb-4" data-oid="lul3lb5">
          Step 3: Describe the Action
        </h1>
        <p className="text-gray-400" data-oid="be0me6g">
          Tell us what story you want to see come alive
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8" data-oid="mfe2.zn">
        {/* Image Preview */}
        <div className="bg-zinc-900 rounded-2xl p-6" data-oid="6texasr">
          <h3 className="text-lg font-semibold mb-4" data-oid="4qgvsds">
            Your Artwork
          </h3>
          {(croppedImage || uploadedImage) &&
        <img
          src={croppedImage || uploadedImage}
          alt="Cropped artwork"
          className="w-full rounded-xl border border-zinc-700"
          data-oid="25fzo1o" />

        }
        </div>

        {/* Form */}
        <div className="bg-zinc-900 rounded-2xl p-6">
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your creation a name"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe the story in your art
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A happy sun rising over a green hill"
                className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                maxLength={300}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {prompt.length}/300
              </div>
            </div>

            {/* Prompt Templates */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Prompt Ideas
              </label>
              <div className="grid grid-cols-1 gap-2">
                {promptTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    className="text-left px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Choose a musical mood
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id as Mood)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedMood === mood.id
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mood.emoji}</span>
                      <div>
                        <div className="font-medium">{mood.label}</div>
                        <div className="text-xs text-gray-400">
                          {mood.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-300 hover:text-red-200 text-xs mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Credit Cost & Generate */}
            <div className="border-t border-zinc-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-gray-400">This will use</div>
                  <div className="font-semibold">{CREDITS.VIDEO_CREATION_COST} Credits</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Your balance</div>
                  <div className="font-semibold text-pink-400">
                    {user.credits} Credits
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !selectedMood || !prompt.trim() || user.credits < CREDITS.VIDEO_CREATION_COST}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {loading
                  ? "Generating..."
                  : user.credits < CREDITS.VIDEO_CREATION_COST
                  ? "Insufficient Credits"
                  : "✨ Generate Video"}
              </Button>

              {user.credits < CREDITS.VIDEO_CREATION_COST && (
                <div className="text-center mt-2">
                  <Button
                    as="link"
                    href="/pricing"
                    variant="ghost"
                    size="sm"
                  >
                    Get More Credits
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderGeneratingStep = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-zinc-900 rounded-2xl p-12">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Our AI is working its magic...
          </h1>
          <p className="text-gray-400 mb-8">
            {progress?.message || "Bringing your art to life with creativity and wonder"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-500 animate-pulse"
              style={{ width: progress?.status === 'completed' ? '100%' : '60%' }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {progress?.status === 'pending' && "Analyzing your artwork..."}
            {progress?.status === 'processing' && "Creating the animation..."}
            {progress?.status === 'completed' && "Almost ready!"}
          </p>
        </div>

        {/* Featured Creations Carousel */}
        <div data-oid="z2kedmg">
          <h3 className="text-lg font-semibold mb-4" data-oid="8pm8jt6">
            While you wait, check out these amazing creations
          </h3>
          <div className="grid md:grid-cols-3 gap-4" data-oid="pf0u5i4">
            {[1, 2, 3].map((i) =>
          <div
            key={i}
            className="bg-zinc-800 rounded-xl p-4"
            data-oid="n4xj8o3">

                <div
              className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center"
              data-oid="xzz4lhm">

                  <span className="text-gray-400" data-oid="es5pgkv">
                    Creation {i}
                  </span>
                </div>
                <p className="text-sm text-gray-400" data-oid="u9z6:wo">
                  By a talented young artist
                </p>
              </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );


  const renderResultStep = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          It's Alive! ✨
        </h1>
        <p className="text-gray-400">
          Your masterpiece has been transformed into a magical animation
        </p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-8 mb-8">
        {/* Video Player */}
        {completedVideo?.videoUrl ? (
          <VideoPlayer
            src={completedVideo.videoUrl}
            poster={completedVideo.thumbnailUrl}
            title={completedVideo.title}
            className="aspect-video mb-6"
            onShare={() => {
              navigator.share?.({
                title: completedVideo.title,
                text: `Check out this amazing animated video created with Draworld!`,
                url: window.location.origin + `/creation/${videoCreationId}`,
              }) || navigator.clipboard.writeText(window.location.origin + `/creation/${videoCreationId}`);
            }}
            onDownload={() => {
              const a = document.createElement('a');
              a.href = completedVideo.videoUrl;
              a.download = `${completedVideo.title}.mp4`;
              a.click();
            }}
          />
        ) : (
          <div className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl mb-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-400">Video processing...</p>
            </div>
          </div>
        )}

        {/* Video Info */}
        {completedVideo && (
          <div className="text-left mb-6 p-4 bg-zinc-800 rounded-xl">
            <h3 className="font-semibold text-lg mb-2">{completedVideo.title}</h3>
            <p className="text-gray-400 text-sm mb-2">"{completedVideo.prompt}"</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Mood: {completedVideo.mood}</span>
              <span>Created: {new Date(completedVideo.createdAt?.seconds * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {completedVideo?.videoUrl && (
            <Button
              as="a"
              href={completedVideo.videoUrl}
              download
              variant="primary"
              size="lg"
            >
              📥 Download
            </Button>
          )}
          
          <Button
            onClick={() => {
              if (completedVideo?.videoUrl) {
                navigator.share?.({
                  title: completedVideo.title,
                  text: `Check out this amazing animated video created with Draworld!`,
                  url: window.location.origin + `/creation/${videoCreationId}`,
                }) || navigator.clipboard.writeText(window.location.origin + `/creation/${videoCreationId}`);
              }
            }}
            variant="secondary"
            size="lg"
          >
            🔗 Share
          </Button>
          
          <Button
            onClick={() => router.push('/account/creations')}
            variant="ghost"
            size="lg"
          >
            📁 View Gallery
          </Button>
          
          <Button
            onClick={handleStartOver}
            variant="ghost"
            size="lg"
          >
            🎨 Create Another
          </Button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-20 px-4 sm:px-6 lg:px-8">
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "crop" && renderCropStep()}
        {currentStep === "prompt" && renderPromptStep()}
        {currentStep === "generating" && renderGeneratingStep()}
        {currentStep === "result" && renderResultStep()}
      </main>

      <Footer />

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
        requiredCredits={CREDITS.VIDEO_CREATION_COST}
        currentCredits={user.credits}
      />
    </div>
  );
}