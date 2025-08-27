import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (!userData?.role || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 7d, 30d, 90d, all

    // Calculate date range
    let startDate: Date | null = null;
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get new users in time range
    let newUsersQuery = query(collection(db, 'users'));
    if (startDate) {
      newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', startDate)
      );
    }
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUsers = newUsersSnapshot.size;

    // Get total video creations
    const videosSnapshot = await getDocs(collection(db, 'videoCreations'));
    const totalVideos = videosSnapshot.size;

    // Get new videos in time range
    let newVideosQuery = query(collection(db, 'videoCreations'));
    if (startDate) {
      newVideosQuery = query(
        collection(db, 'videoCreations'),
        where('createdAt', '>=', startDate)
      );
    }
    const newVideosSnapshot = await getDocs(newVideosQuery);
    const newVideos = newVideosSnapshot.size;

    // Get total payments
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    const payments = paymentsSnapshot.docs.map(doc => doc.data());
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Get new payments in time range
    let newPaymentsQuery = query(collection(db, 'payments'));
    if (startDate) {
      newPaymentsQuery = query(
        collection(db, 'payments'),
        where('createdAt', '>=', startDate)
      );
    }
    const newPaymentsSnapshot = await getDocs(newPaymentsQuery);
    const newPayments = newPaymentsSnapshot.docs.map(doc => doc.data());
    const newRevenue = newPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Get conversion metrics
    const completedVideos = videosSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    const paidUsers = [...new Set(payments.map(p => p.userId))].length;

    // Get top performing videos
    const topVideosQuery = query(
      collection(db, 'videoCreations'),
      where('isPublic', '==', true),
      orderBy('views', 'desc'),
      limit(10)
    );
    const topVideosSnapshot = await getDocs(topVideosQuery);
    const topVideos = topVideosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get recent activity
    const recentUsersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      password: undefined, // Remove sensitive data
    }));

    // Calculate key metrics
    const videoCompletionRate = totalUsers > 0 ? (completedVideos / totalUsers) * 100 : 0;
    const paidConversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsers,
        totalVideos,
        newVideos,
        totalRevenue: totalRevenue / 100, // Convert from cents to dollars
        newRevenue: newRevenue / 100,
        completedVideos,
        paidUsers,
      },
      metrics: {
        videoCompletionRate: Math.round(videoCompletionRate * 100) / 100,
        paidConversionRate: Math.round(paidConversionRate * 100) / 100,
        averageRevenuePerUser: Math.round((averageRevenuePerUser / 100) * 100) / 100,
      },
      topVideos: topVideos.slice(0, 5),
      recentUsers: recentUsers.slice(0, 5),
      timeRange,
    });

  } catch (error) {
    console.error('Get admin analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}