import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug API endpoint to check environment variables in production
 * This helps diagnose Firebase environment variable issues
 */
export async function GET(request: NextRequest) {
  try {
    const requiredFirebaseVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    const envStatus = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      firebaseVars: {},
      allNextPublicVars: {} as Record<string, string>,
      summary: {
        total: requiredFirebaseVars.length,
        present: 0,
        missing: [] as string[]
      }
    };

    // Check Firebase variables
    requiredFirebaseVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        envStatus.firebaseVars[varName] = `${value.substring(0, 10)}...` + `[${value.length} chars]`;
        envStatus.summary.present++;
      } else {
        envStatus.firebaseVars[varName] = 'NOT SET';
        envStatus.summary.missing.push(varName);
      }
    });

    // List all NEXT_PUBLIC_ variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        const value = process.env[key];
        if (value) {
          envStatus.allNextPublicVars[key] = `${value.substring(0, 10)}...` + `[${value.length} chars]`;
        }
      }
    });

    return NextResponse.json(envStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}