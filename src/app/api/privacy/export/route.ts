import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createRateLimiter, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rateLimiter';
import { UserDataExport } from '@/lib/compliance';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const rateLimiter = createRateLimiter(RATE_LIMITS.GENERAL);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = await rateLimiter.isAllowed(identifier);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Authenticate user
    const user = await auth.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Collect user data for export
    const userDataExport: UserDataExport = {
      profile: {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: user.metadata.creationTime || '',
        credits: 0, // Will be fetched from Firestore
        referralCode: '',
      },
      creations: [],
      transactions: [],
      payments: [],
    };

    // Fetch user profile data
    const userDoc = await getDocs(
      query(collection(db, 'users'), where('uid', '==', user.uid))
    );
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      userDataExport.profile.credits = userData.credits || 0;
      userDataExport.profile.referralCode = userData.referralCode || '';
    }

    // Fetch user creations
    const creationsQuery = query(
      collection(db, 'videoCreations'),
      where('userId', '==', user.uid)
    );
    const creationsSnapshot = await getDocs(creationsQuery);
    
    userDataExport.creations = creationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        prompt: data.prompt || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
        isPublic: data.isPublic || false,
      };
    });

    // Fetch credit transactions
    const transactionsQuery = query(
      collection(db, 'creditTransactions'),
      where('userId', '==', user.uid)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    userDataExport.transactions = transactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || '',
        amount: data.amount || 0,
        description: data.description || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });

    // Fetch payment records
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    userDataExport.payments = paymentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount || 0,
        status: data.status || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
      };
    });

    // Return data export
    return NextResponse.json({
      success: true,
      data: userDataExport,
      exportedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}