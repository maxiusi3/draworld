import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { headers } from 'next/headers';

export async function POST(_request: NextRequest) {
  try {
    // Verify this is a Vercel cron request
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      cleaned: {
        failed_videos: 0,
        old_analytics: 0,
        expired_sessions: 0,
      },
    };

    // Clean up failed video generations older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const failedVideosQuery = await db
      .collection('videoCreations')
      .where('status', '==', 'failed')
      .where('createdAt', '<', sevenDaysAgo)
      .get();

    const batch = db.batch();
    
    failedVideosQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    results.cleaned.failed_videos = failedVideosQuery.size;

    // Clean up old analytics events (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const oldAnalyticsQuery = await db
      .collection('analyticsEvents')
      .where('createdAt', '<', ninetyDaysAgo)
      .limit(500) // Batch delete in chunks
      .get();

    oldAnalyticsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    results.cleaned.old_analytics = oldAnalyticsQuery.size;

    // Commit all deletions
    await batch.commit();

    console.log('Cleanup completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      results,
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cleanup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}