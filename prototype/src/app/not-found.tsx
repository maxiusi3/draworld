'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { usePageTracking } from '@/hooks/useAnalytics';

export default function NotFound() {
  usePageTracking('404_page');

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="relative">
              <div className="text-9xl font-bold text-pink-200 select-none">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              The page you're looking for seems to have wandered off into the creative void.
            </p>
            <p className="text-gray-500">
              Don't worry, even the best artists sometimes lose their way!
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Go Home
                </Button>
              </Link>
              
              <Link href="/create">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Create Video
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Looking for something specific?
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Link href="/gallery" className="text-pink-600 hover:text-pink-800 transition-colors">
                Gallery
              </Link>
              
              <Link href="/pricing" className="text-pink-600 hover:text-pink-800 transition-colors">
                Pricing
              </Link>
              
              <Link href="/account/profile" className="text-pink-600 hover:text-pink-800 transition-colors">
                Account
              </Link>
              
              <Link href="/terms-of-service" className="text-pink-600 hover:text-pink-800 transition-colors">
                Terms
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              🎨 Every great artist has a few sketches that don't make it to the gallery
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}