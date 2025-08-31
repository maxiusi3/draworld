import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { toSafeDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const startAfterParam = searchParams.get('startAfter');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'trending';

    // Build base query for public, completed videos
    let q = query(
      collection(db, 'videoCreations'),
      where('isPublic', '==', true),
      where('status', '==', 'completed')
    );

    // Add category filter if specified
    if (category && category !== 'all') {
      q = query(q, where('category', '==', category));
    }

    // Add sorting
    switch (sortBy) {
      case 'newest':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'popular':
        q = query(q, orderBy('views', 'desc'));
        break;
      case 'trending':
      default:
        // Trending: combination of recent and popular
        // For now, we'll use a simple approach: order by views but only recent videos
        q = query(q, orderBy('views', 'desc'));
        break;
    }

    // Add limit
    q = query(q, limit(limitParam));

    // Add pagination if startAfter is provided
    if (startAfterParam) {
      const startAfterDoc = await getDoc(doc(db, 'videoCreations', startAfterParam));
      if (startAfterDoc.exists()) {
        q = query(q, startAfter(startAfterDoc));
      }
    }

    const snapshot = await getDocs(q);
    const videos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        prompt: data.prompt,
        mood: data.mood,
        category: data.category,
        thumbnailUrl: data.thumbnailUrl,
        videoUrl: data.videoUrl,
        views: data.views || 0,
        shares: data.shares || 0,
        likes: data.likes || 0,
        createdAt: toSafeDate(data.createdAt).toISOString(),
        // Don't expose user information for privacy
        creatorAge: data.creatorAge || null,
      };
    });

    return NextResponse.json({
      videos,
      hasMore: snapshot.docs.length === limitParam,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    });

  } catch (error) {
    console.error('Get gallery videos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}