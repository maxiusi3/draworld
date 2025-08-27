'use client';

import { useState } from 'react';
import { SocialShareModal } from './SocialShareModal';

interface ShareButtonProps {
  videoTitle?: string;
  videoUrl?: string;
  shareUrl: string;
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({
  videoTitle,
  videoUrl,
  shareUrl,
  variant = 'primary',
  className = '',
  children,
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black';
  
  const variantClasses = {
    primary: 'px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white',
    secondary: 'px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
    icon: 'w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        {variant === 'icon' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            {children || 'Share'}
          </>
        )}
      </button>

      <SocialShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        videoTitle={videoTitle}
        videoUrl={videoUrl}
        shareUrl={shareUrl}
      />
    </>
  );
}