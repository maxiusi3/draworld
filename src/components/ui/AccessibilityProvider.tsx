'use client';

import React from 'react';
import { SkipLink, LiveRegion } from '@/lib/accessibility';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [announcements, setAnnouncements] = React.useState<string[]>([]);

  // Global announcement function
  React.useEffect(() => {
    const handleAnnouncement = (event: CustomEvent<string>) => {
      setAnnouncements(prev => [...prev, event.detail]);
      
      // Clear announcement after it's been read
      setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 1000);
    };

    window.addEventListener('announce' as any, handleAnnouncement);
    return () => window.removeEventListener('announce' as any, handleAnnouncement);
  }, []);

  return (
    <>
      {/* Skip Links */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      {/* Live Region for Announcements */}
      <LiveRegion priority="assertive">
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </LiveRegion>

      {/* Main Content */}
      {children}
    </>
  );
}

// Global announcement function
export function announceGlobally(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('announce', { detail: message }));
  }
}