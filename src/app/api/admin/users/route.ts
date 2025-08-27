import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where, startAfter } from 'firebase/firestore';

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
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const startAfterParam = searchParams.get('startAfter');

    // Build query
    let usersQuery = query(
      collection(db, 'users'),
      orderBy(sortBy, sortOrder as 'asc' | 'desc'),
      limit(limitParam)
    );

    // Add search filter if provided
    if (searchQuery) {
      // For email search, we'll use a simple contains approach
      // Note: Firestore doesn't support full-text search natively
      usersQuery = query(
        collection(db, 'users'),
        where('email', '>=', searchQuery),
        where('email', '<=', searchQuery + '\uf8ff'),
        orderBy('email'),
        limit(limitParam)
      );
    }

    // Add pagination if startAfter is provided
    if (startAfterParam && !searchQuery) {
      const startAfterDoc = await getDoc(doc(db, 'users', startAfterParam));
      if (startAfterDoc.exists()) {
        usersQuery = query(
          collection(db, 'users'),
          orderBy(sortBy, sortOrder as 'asc' | 'desc'),
          startAfter(startAfterDoc),
          limit(limitParam)
        );
      }
    }

    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Remove sensitive data
      password: undefined,
    }));

    // Get total count (approximate)
    const totalSnapshot = await getDocs(query(collection(db, 'users')));
    const totalUsers = totalSnapshot.size;

    return NextResponse.json({
      users,
      total: totalUsers,
      hasMore: snapshot.docs.length === limitParam,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}