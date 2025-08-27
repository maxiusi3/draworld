import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

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
    const status = searchParams.get('status') || 'pending';
    const limitParam = parseInt(searchParams.get('limit') || '50');

    // Get video creations that need moderation
    let moderationQuery = query(
      collection(db, 'videoCreations'),
      where('status', '==', 'completed'), // Only completed videos
      orderBy('createdAt', 'desc'),
      limit(limitParam)
    );

    // Filter by moderation status if specified
    if (status !== 'all') {
      const moderationStatus = status === 'pending' ? null : status;
      moderationQuery = query(
        collection(db, 'videoCreations'),
        where('status', '==', 'completed'),
        where('moderationStatus', '==', moderationStatus),
        orderBy('createdAt', 'desc'),
        limit(limitParam)
      );
    }

    const snapshot = await getDocs(moderationQuery);
    const videos = await Promise.all(
      snapshot.docs.map(async (videoDoc) => {
        const videoData = videoDoc.data();
        
        // Get user data for each video
        const userDoc = await getDoc(doc(db, 'users', videoData.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;

        return {
          id: videoDoc.id,
          ...videoData,
          user: userData ? {
            id: videoData.userId,
            email: userData.email,
            displayName: userData.displayName,
          } : null,
        };
      })
    );

    return NextResponse.json({
      videos,
      total: videos.length,
    });

  } catch (error) {
    console.error('Get moderation queue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}