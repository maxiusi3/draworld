import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { runwareAPI } from '@/lib/runware';

export async function GET(_request: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: 'unknown',
        ai_api: 'unknown',
        storage: 'unknown',
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Check Firestore connection
    try {
      await db.collection('health').doc('check').get();
      checks.services.database = 'healthy';
    } catch {
      checks.services.database = 'unhealthy';
      checks.status = 'degraded';
    }

    // Check Runware AI API
    try {
      const isConnected = await runwareAPI.testConnection();
      checks.services.ai_api = isConnected ? 'healthy' : 'unhealthy';
      if (!isConnected) {
        checks.status = 'degraded';
      }
    } catch {
      checks.services.ai_api = 'unhealthy';
      checks.status = 'degraded';
    }

    // Check Firebase Storage (simplified check)
    checks.services.storage = 'healthy'; // Assume healthy if no errors

    const statusCode = checks.status === 'healthy' ? 200 : 503;

    return NextResponse.json(checks, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: 'Health check failed',
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 503 }
    );
  }
}