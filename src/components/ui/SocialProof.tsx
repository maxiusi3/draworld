'use client';

import { useState, useEffect } from 'react';

interface SocialProofProps {
  className?: string;
}

export function SocialProof({ className = '' }: SocialProofProps) {
  const [userCount, setUserCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);

  useEffect(() => {
    // Simulate loading user and video counts
    // In a real implementation, this would fetch from analytics API
    const loadCounts = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in production, this would come from analytics
      setUserCount(Math.floor(Math.random() * 10000) + 45000); // 45k-55k users
      setVideoCount(Math.floor(Math.random() * 50000) + 150000); // 150k-200k videos
    };

    loadCounts();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-8 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">
            {userCount > 0 ? formatNumber(userCount) : '50K+'}
          </span>
          <span className="text-gray-400">creators</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">
            {videoCount > 0 ? formatNumber(videoCount) : '200K+'}
          </span>
          <span className="text-gray-400">videos created</span>
        </div>
      </div>

      <p className="text-gray-400">
        Trusted by parents and educators worldwide
      </p>

      {/* Social Media Mentions */}
      <div className="mt-6 flex items-center justify-center gap-6 opacity-60">
        <div className="flex items-center gap-2">
          <span className="text-pink-400">#draworld</span>
          <span className="text-gray-500">on Instagram</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400">#AIart</span>
          <span className="text-gray-500">trending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">#kidscreate</span>
          <span className="text-gray-500">community</span>
        </div>
      </div>
    </div>
  );
}