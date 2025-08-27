'use client';

import { useState } from 'react';
import { Button } from './Button';
import { SocialTaskService, SocialTaskSubmission } from '@/services/socialTaskService';
import { CREDITS } from '@/lib/constants';
import { formatCredits } from '@/lib/utils';

interface SocialTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SocialTaskModal({ isOpen, onClose, onSuccess }: SocialTaskModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [postUrl, setPostUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'facebook', name: 'Facebook', icon: '👥' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlatform) {
      setError('Please select a platform');
      return;
    }

    if (!postUrl.trim()) {
      setError('Please provide the post URL');
      return;
    }

    // Validate URL format
    if (!SocialTaskService.validatePostUrl(postUrl, selectedPlatform)) {
      setError(`Please provide a valid ${selectedPlatform} URL`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submission: SocialTaskSubmission = {
        type: `${selectedPlatform}_share` as any,
        platform: selectedPlatform,
        postUrl: postUrl.trim(),
        hashtags: ['#draworldapp'],
      };

      await SocialTaskService.submitTask(submission);
      setSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlatform('');
    setPostUrl('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const instructions = selectedPlatform 
    ? SocialTaskService.getSharingInstructions(selectedPlatform)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Earn {formatCredits(CREDITS.SOCIAL_SHARE)} Credits
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Task Submitted!</h3>
              <p className="text-gray-600 mb-6">
                We'll review your post within 24 hours and award your credits once approved.
              </p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Platform
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        selectedPlatform === platform.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{platform.icon}</div>
                      <div className="font-medium text-gray-900">{platform.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              {instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">{instructions.title}</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    {instructions.instructions.map((instruction, index) => (
                      <li key={index} className="flex">
                        <span className="mr-2">{index + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-blue-900">Suggested hashtags: </span>
                    <span className="text-sm text-blue-800">
                      {instructions.hashtags.join(' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Post URL Input */}
              <div>
                <label htmlFor="postUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Post URL
                </label>
                <input
                  id="postUrl"
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder={selectedPlatform ? `Paste your ${selectedPlatform} post URL here` : 'Select a platform first'}
                  disabled={!selectedPlatform}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedPlatform || !postUrl.trim()}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}