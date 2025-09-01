import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    devIndicators: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    
    // Performance optimizations
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        domains: [
            'firebasestorage.googleapis.com',
            'storage.googleapis.com',
            'lh3.googleusercontent.com', // Google profile images
            'res.cloudinary.com', // If using Cloudinary
        ],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    
    // Experimental features for performance
    experimental: {
        optimizeCss: true,
        optimizePackageImports: [
            '@stripe/stripe-js',
            '@stripe/react-stripe-js',
            'firebase',
            'react-cropper',
        ],
    },
    
    // Compression and caching
    compress: true,
    
    // Bundle analyzer (only in development)
    ...(process.env.ANALYZE === 'true' && {
        webpack: (config: any) => {
            if (process.env.NODE_ENV === 'development') {
                const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
                config.plugins.push(
                    new BundleAnalyzerPlugin({
                        analyzerMode: 'server',
                        openAnalyzer: true,
                    })
                );
            }
            return config;
        },
    }),
    
    // Headers for security and performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.googletagmanager.com/gtag/js https://tag.getdrip.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://api.runware.ai https://*.googleapis.com https://*.firebaseapp.com https://us-central1-draworld-6898f.cloudfunctions.net https://tag.getdrip.com https://www.google-analytics.com https://*.cloudfunctions.net https://cdn.shopimgs.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
                    },
                ],
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0',
                    },
                ],
            },
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/images/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400',
                    },
                ],
            },
        ];
    },
    
    // Redirects for SEO
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
            {
                source: '/dashboard',
                destination: '/account/profile',
                permanent: false,
            },
        ];
    },
};


export default nextConfig;
