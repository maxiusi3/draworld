'use client';

import { useState } from 'react';
import { Button } from './Button';
import { SocialTaskService } from '@/services/socialTaskService';
import { useSocialTasks } from '@/hooks/useSocialTasks';
import { AnalyticsService } from '@/services/analyticsService';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle?: string;
  videoUrl?: string;
  shareUrl: string;
}

export function SocialShareModal({
  isOpen,
  onClose,
  videoTitle,
  videoUrl: _videoUrl,
  shareUrl,
}: SocialShareModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [postUrl, setPostUrl] = useState('');
  const [showTaskSubmission, setShowTaskSubmission] = useState(false);
  const { submitTask, submitting, error } = useSocialTasks();

  if (!isOpen) return null;

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      reward: 100,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'bg-black',
      reward: 100,
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: '🐦',
      color: 'bg-blue-500',
      reward: 50,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      color: 'bg-blue-600',
      reward: 50,
    },
  ];

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);
  const template = SocialTaskService.getSharingTemplate(selectedPlatform, videoTitle);

  const handleDirectShare = async (platform: string) => {
    // Track sharing analytics
    await AnalyticsService.trackVideoShare(shareUrl.split('/').pop() || 'unknown', platform, 'direct');

    const template = SocialTaskService.getSharingTemplate(platform, videoTitle);
    const text = encodeURIComponent(template.text);
    const url = encodeURIComponent(shareUrl);

    let shareUrl_platform = '';
    switch (platform) {
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we copy to clipboard
        try {
          await navigator.clipboard.writeText(`${template.text}\n\n${shareUrl}`);
          alert('Content copied to clipboard! Open Instagram and paste in your story or post.');
        } catch {
          alert('Please copy this content and share on Instagram:\n\n' + template.text + '\n\n' + shareUrl);
        }
        return;
      case 'twitter':
        shareUrl_platform = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl_platform = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'tiktok':
        // TikTok doesn't support direct URL sharing
        try {
          await navigator.clipboard.writeText(`${template.text}\n\n${shareUrl}`);
          alert('Content copied to clipboard! Open TikTok and create your video with this caption.');
        } catch {
          alert('Please copy this content and share on TikTok:\n\n' + template.text + '\n\n' + shareUrl);
        }
        return;
    }

    if (shareUrl_platform) {
      window.open(shareUrl_platform, '_blank', 'width=600,height=400');
    }
  };

  const handleTaskSubmission = async () => {
    try {
      const validation = SocialTaskService.validateSocialUrl(postUrl, selectedPlatform);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      // Track social task submission
      await AnalyticsService.trackSocialTaskSubmission(selectedPlatform, !!postUrl);

      await submitTask({
        type: `${selectedPlatform}_share` as 'instagram_share' | 'tiktok_share' | 'twitter_share' | 'facebook_share',
        platform: selectedPlatform,
        postUrl: postUrl || undefined,
        hashtags: template.hashtags,
      });

      alert('Task submitted successfully! We\'ll review it and award credits within 24 hours.');
      setPostUrl('');
      setShowTaskSubmission(false);
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">Share Your Creation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!showTaskSubmission ? (
            <>
              {/* Platform Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Choose Platform</h3>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPlatform === platform.id
                          ? 'border-pink-500 bg-pink-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${platform.color} rounded-full flex items-center justify-center text-white`}>
                          <span className="text-lg">{platform.icon}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-green-400">+{platform.reward} credits</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Suggested Content</h3>
                <div className="bg-zinc-800 rounded-lg p-4 mb-3">
                  <p className="text-gray-300 mb-3">{template.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.hashtags.map((hashtag, index) => (
                      <span key={index} className="text-blue-400 text-sm">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400">{template.suggestedText}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleDirectShare(selectedPlatform)}
                  variant="primary"
                  className="w-full"
                >
                  Share Now on {selectedPlatformData?.name}
                </Button>
                
                <div className="text-center">
                  <span className="text-gray-400 text-sm">or</span>
                </div>

                <Button
                  onClick={() => setShowTaskSubmission(true)}
                  variant="secondary"
                  className="w-full"
                >
                  I&apos;ll Share Later & Submit for Credits (+{selectedPlatformData?.reward} credits)
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Task Submission Form */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Submit Your {selectedPlatformData?.name} Post
                </h3>
                <p className="text-gray-400 mb-4">
                  Share your creation on {selectedPlatformData?.name} with the hashtag #draworld, 
                  then paste the link here to earn {selectedPlatformData?.reward} credits!
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Post URL (optional but recommended for faster review)
                </label>
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder={`https://${selectedPlatform}.com/...`}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Providing a link helps us verify your post faster, but it&apos;s not required.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowTaskSubmission(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleTaskSubmission}
                  disabled={submitting}
                  variant="primary"
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}