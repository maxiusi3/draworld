import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { headers } from 'next/headers';

export async function POST() {
  try {
    // Verify this is a Vercel cron request
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000);

    // Calculate daily metrics
    const dailyMetrics = {
      date: yesterdayStart.toISOString().split('T')[0],
      users: {
        new_signups: 0,
        active_users: 0,
        returning_users: 0,
      },
      videos: {
        total_generated: 0,
        successful: 0,
        failed: 0,
        success_rate: 0,
      },
      credits: {
        earned: 0,
        spent: 0,
        purchased: 0,
      },
      revenue: {
        total_cents: 0,
        transactions: 0,
      },
    };

    // Get new signups
    const newSignupsSnapshot = await db
      .collection('users')
      .where('createdAt', '>=', yesterdayStart)
      .where('createdAt', '<', yesterdayEnd)
      .get();
    
    dailyMetrics.users.new_signups = newSignupsSnapshot.size;

    // Get video generation metrics
    const videosSnapshot = await db
      .collection('videoCreations')
      .where('createdAt', '>=', yesterdayStart)
      .where('createdAt', '<', yesterdayEnd)
      .get();

    dailyMetrics.videos.total_generated = videosSnapshot.size;
    
    let successfulVideos = 0;
    let failedVideos = 0;

    videosSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      if (status === 'completed') {
        successfulVideos++;
      } else if (status === 'failed') {
        failedVideos++;
      }
    });

    dailyMetrics.videos.successful = successfulVideos;
    dailyMetrics.videos.failed = failedVideos;
    dailyMetrics.videos.success_rate = dailyMetrics.videos.total_generated > 0
      ? (successfulVideos / dailyMetrics.videos.total_generated) * 100
      : 0;

    // Get credit transactions
    const creditTransactionsSnapshot = await db
      .collection('creditTransactions')
      .where('createdAt', '>=', yesterdayStart)
      .where('createdAt', '<', yesterdayEnd)
      .get();

    creditTransactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = Math.abs(data.amount || 0);
      
      if (data.type === 'earned') {
        dailyMetrics.credits.earned += amount;
      } else if (data.type === 'spent') {
        dailyMetrics.credits.spent += amount;
      } else if (data.type === 'purchased') {
        dailyMetrics.credits.purchased += amount;
      }
    });

    // Get payment metrics
    const paymentsSnapshot = await db
      .collection('payments')
      .where('createdAt', '>=', yesterdayStart)
      .where('createdAt', '<', yesterdayEnd)
      .where('status', '==', 'succeeded')
      .get();

    paymentsSnapshot.docs.forEach(doc => {
      const amount = doc.data().amount || 0;
      dailyMetrics.revenue.total_cents += amount;
      dailyMetrics.revenue.transactions++;
    });

    // Store daily metrics
    await db
      .collection('dailyMetrics')
      .doc(dailyMetrics.date)
      .set({
        ...dailyMetrics,
        createdAt: now,
        updatedAt: now,
      });

    console.log('Daily analytics aggregation completed:', dailyMetrics);

    return NextResponse.json({
      success: true,
      message: 'Analytics aggregation completed',
      metrics: dailyMetrics,
    });
  } catch (error) {
    console.error('Analytics cron error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Analytics aggregation failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}