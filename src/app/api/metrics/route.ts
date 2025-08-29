import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { headers } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    // Simple API key authentication for metrics endpoint
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.METRICS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic metrics from Firestore
    const metrics = {
      timestamp: now.toISOString(),
      users: {
        total: 0,
        active_24h: 0,
        active_7d: 0,
        new_24h: 0,
      },
      videos: {
        total: 0,
        generated_24h: 0,
        generated_7d: 0,
        success_rate_24h: 0,
      },
      credits: {
        total_earned: 0,
        total_spent: 0,
        purchased_24h: 0,
      },
      system: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
      },
    };

    // Get user metrics
    const usersSnapshot = await db.collection('users').get();
    metrics.users.total = usersSnapshot.size;

    const newUsersSnapshot = await db
      .collection('users')
      .where('createdAt', '>=', oneDayAgo)
      .get();
    metrics.users.new_24h = newUsersSnapshot.size;

    // Get video metrics
    const videosSnapshot = await db.collection('videoCreations').get();
    metrics.videos.total = videosSnapshot.size;

    const recentVideosSnapshot = await db
      .collection('videoCreations')
      .where('createdAt', '>=', oneDayAgo)
      .get();
    metrics.videos.generated_24h = recentVideosSnapshot.size;

    const weekVideosSnapshot = await db
      .collection('videoCreations')
      .where('createdAt', '>=', oneWeekAgo)
      .get();
    metrics.videos.generated_7d = weekVideosSnapshot.size;

    // Calculate success rate
    const successfulVideos = recentVideosSnapshot.docs.filter(
      doc => doc.data().status === 'completed'
    ).length;
    metrics.videos.success_rate_24h = recentVideosSnapshot.size > 0 
      ? (successfulVideos / recentVideosSnapshot.size) * 100 
      : 0;

    // Get credit metrics
    const creditTransactionsSnapshot = await db
      .collection('creditTransactions')
      .get();

    let totalEarned = 0;
    let totalSpent = 0;
    let purchased24h = 0;

    creditTransactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amount || 0;
      
      if (data.type === 'earned' || data.type === 'purchased') {
        totalEarned += amount;
        
        if (data.source === 'purchase' && data.createdAt?.toDate() >= oneDayAgo) {
          purchased24h += amount;
        }
      } else if (data.type === 'spent') {
        totalSpent += Math.abs(amount);
      }
    });

    metrics.credits.total_earned = totalEarned;
    metrics.credits.total_spent = totalSpent;
    metrics.credits.purchased_24h = purchased24h;

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}