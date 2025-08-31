import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { WelcomeNotification } from '@/components/auth/WelcomeNotification';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { PWAManager } from '@/components/PWAManager';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { AccessibilityProvider } from '@/components/ui/AccessibilityProvider';

export const metadata: Metadata = {
    title: 'Draworld - Bring Every Child\'s Drawing to Life',
    description: 'Transform static children\'s art into lively, permanently archivable AI animated stories that spark infinite creativity.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Draworld',
    },
    formatDetection: {
        telephone: false,
    },
    other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': 'Draworld',
        'application-name': 'Draworld',
        'msapplication-TileColor': '#ec4899',
        'msapplication-config': '/browserconfig.xml',
    },
};

export const viewport: Viewport = {
    themeColor: '#ec4899',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <ErrorBoundary>
                    <AccessibilityProvider>
                        <ToastProvider>
                            <AuthProvider>
                                <UserProvider>
                                    <AnalyticsProvider>
                                        <main id="main-content">
                                            {children}
                                        </main>
                                        <WelcomeNotification />
                                        <CookieConsent />
                                        <PWAManager />
                                    </AnalyticsProvider>
                                </UserProvider>
                            </AuthProvider>
                        </ToastProvider>
                    </AccessibilityProvider>
                </ErrorBoundary>
                <Script
                    type="module"
                    strategy="afterInteractive"
                    src="https://cdn.jsdelivr.net/gh/onlook-dev/onlook@main/apps/web/client/public/onlook-preload-script.js"
                    crossOrigin="anonymous"
                />
                <Script
                    id="performance-monitoring"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Initialize performance monitoring safely
                            if (typeof window !== 'undefined') {
                                try {
                                    import('@/lib/performance')
                                        .then(module => {
                                            if (module.startPerformanceMonitoring) {
                                                module.startPerformanceMonitoring();
                                            }
                                            if (module.preloadCriticalResources) {
                                                module.preloadCriticalResources();
                                            }
                                            if (module.setupLazyLoading) {
                                                module.setupLazyLoading();
                                            }
                                            if (module.optimizeThirdPartyScripts) {
                                                module.optimizeThirdPartyScripts();
                                            }
                                        })
                                        .catch(error => {
                                            console.warn('Performance monitoring failed to load:', error);
                                        });
                                } catch (error) {
                                    console.warn('Performance monitoring initialization failed:', error);
                                }
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}