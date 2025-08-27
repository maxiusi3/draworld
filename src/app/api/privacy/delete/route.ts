import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createRateLimiter, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rateLimiter';
import { DataDeletionRequest } from '@/lib/compliance';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reason, keepAnonymizedData } = await request.json();

    // Create deletion request record
    const deletionRequest: DataDeletionRequest = {
      userId: user.uid,
      requestedAt: new Date(),
      reason: reason || 'User requested account deletion',
      keepAnonymizedData: keepAnonymizedData || false,
    };

    // Store deletion request for audit trail
    await addDoc(collection(db, 'dataDeletionRequests'), {
      ...deletionRequest,
      status: 'pending',
    });

    // Delete user data (in production, this should be done by a background job)
    const collectionsToDelete = [
      'users',
      'videoCreations',
      'creditTransactions',
      'referrals',
    ];

    for (const collectionName of collectionsToDelete) {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnapshot.id));
      }
    }

    // Delete payments (keep for legal compliance if required)
    if (!keepAnonymizedData) {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      for (const paymentDoc of paymentsSnapshot.docs) {
        await deleteDoc(doc(db, 'payments', paymentDoc.id));
      }
    } else {
      // Anonymize payment data instead of deleting
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentRef = doc(db, 'payments', paymentDoc.id);
        await updateDoc(paymentRef, {
          userId: 'anonymized',
          userEmail: 'anonymized',
          anonymizedAt: new Date(),
        });
      }
    }

    // Delete Firebase Auth user
    try {
      await deleteUser(user);
    } catch (error) {
      console.error('Failed to delete Firebase Auth user:', error);
      // Continue with the process even if auth deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account deletion request processed successfully',
      deletedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}