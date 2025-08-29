import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData?.role || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const timeRange = parseInt(searchParams.get('timeRange') || '30');

    const now = new Date();
    const startDate = new Date(now.getTime() - timeRange * 24 * 60 * 60 * 1000);

    switch (type) {
      case 'dashboard':
        return NextResponse.json(await getDashboardMetrics(startDate));
      case 'funnel':
        return NextResponse.json(await getFunnelMetrics(startDate));
      case 'retention':
        return NextResponse.json(await getRetentionMetrics(startDate));
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getDashboardMetrics(startDate: Date) {
  // Get user metrics
  const totalUsersSnapshot = await db.collection('users').get();
  const totalUsers = totalUsersSnapshot.size;

  const newUsersSnapshot = await db
    .collection('users')
    .where('createdAt', '>=', startDate)
    .get();
  const newUsers = newUsersSnapshot.size;

  // Get video metrics
  const totalVideosSnapshot = await db.collection('videoCreations').get();
  const totalVideos = totalVideosSnapshot.size;

  const completedVideosSnapshot = await db
    .collection('videoCreations')
    .where('status', '==', 'completed')
    .get();
  const completedVideos = completedVideosSnapshot.size;

  const newVideosSnapshot = await db
    .collection('videoCreations')
    .where('createdAt', '>=', startDate)
    .get();
  const newVideos = newVideosSnapshot.size;

  // Get revenue metrics
  const paymentsSnapshot = await db
    .collection('payments')
    .where('status', '==', 'succeeded')
    .where('createdAt', '>=', startDate)
    .get();

  let totalRevenue = 0;
  paymentsSnapshot.docs.forEach((doc) => {
    const payment = doc.data();
    totalRevenue += payment.amount || 0;
  });

  // Calculate conversion rates
  const conversionRate = totalUsers > 0 ? (completedVideos / totalUsers) * 100 : 0;
  const paidUsers = paymentsSnapshot.size;
  const paidConversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

  return {
    users: {
      total: totalUsers,
      new: newUsers,
      growthRate: 0, // Would need historical data
    },
    videos: {
      total: totalVideos,
      completed: completedVideos,
      new: newVideos,
      successRate: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0,
    },
    revenue: {
      total: totalRevenue,
      paidUsers,
      averageRevenuePerUser: paidUsers > 0 ? totalRevenue / paidUsers : 0,
    },
    conversion: {
      visitorToCreator: conversionRate,
      freeToPaid: paidConversionRate,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function getFunnelMetrics(startDate: Date) {
  // This would analyze user journey through the funnel
  // For now, return basic structure
  return {
    steps: {
      homepage_visits: 0,
      signups: 0,
      first_uploads: 0,
      first_generations: 0,
      first_completions: 0,
      first_purchases: 0,
    },
    conversions: {
      homepageToSignup: 0,
      signupToUpload: 0,
      uploadToGeneration: 0,
      generationToCompletion: 0,
      userToPaid: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function getRetentionMetrics(startDate: Date) {
  // This would analyze user retention over time
  // For now, return basic structure
  return {
    cohorts: [],
    overallRetention: {
      day1: 0,
      day7: 0,
      day30: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}