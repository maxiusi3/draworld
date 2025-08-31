import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { toSafeDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Authenticate user
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const startAfterParam = searchParams.get('startAfter');

    // Build query
    let q = query(
      collection(db, 'videoCreations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitParam)
    );

    // Add pagination if startAfter is provided
    if (startAfterParam) {
      const startAfterDoc = await getDoc(doc(db, 'videoCreations', startAfterParam));
      if (startAfterDoc.exists()) {
        q = query(
          collection(db, 'videoCreations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(startAfterDoc),
          limit(limitParam)
        );
      }
    }

    const snapshot = await getDocs(q);
    const videos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toSafeDate(data.createdAt).toISOString(),
        updatedAt: toSafeDate(data.updatedAt).toISOString(),
      }
    });

    return NextResponse.json({
      videos,
      hasMore: snapshot.docs.length === limitParam,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    });

  } catch (error) {
    console.error('Get user videos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}