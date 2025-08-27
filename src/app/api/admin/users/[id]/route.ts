import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;

    // Get user data
    const targetUserDoc = await getDoc(doc(db, 'users', userId));
    if (!targetUserDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const targetUserData = {
      id: userId,
      ...targetUserDoc.data(),
      password: undefined, // Remove sensitive data
    };

    // Get user's video creations
    const videosQuery = query(
      collection(db, 'videoCreations'),
      where('userId', '==', userId)
    );
    const videosSnapshot = await getDocs(videosQuery);
    const videos = videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get user's credit transactions
    const transactionsQuery = query(
      collection(db, 'creditTransactions'),
      where('userId', '==', userId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get user's payments
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', userId)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      user: targetUserData,
      stats: {
        totalVideos: videos.length,
        totalTransactions: transactions.length,
        totalPayments: payments.length,
        totalSpent: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      },
      videos: videos.slice(0, 10), // Latest 10 videos
      transactions: transactions.slice(0, 20), // Latest 20 transactions
      payments: payments.slice(0, 10), // Latest 10 payments
    });

  } catch (error) {
    console.error('Get admin user details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const { action, credits, reason } = await request.json();

    // Validate action
    if (!['award_credits', 'deduct_credits', 'ban_user', 'unban_user'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const targetUserRef = doc(db, 'users', userId);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (!targetUserDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const targetUserData = targetUserDoc.data();

    switch (action) {
      case 'award_credits':
        if (!credits || credits <= 0) {
          return NextResponse.json(
            { error: 'Credits amount must be positive' },
            { status: 400 }
          );
        }

        // Update user credits
        await updateDoc(targetUserRef, {
          credits: (targetUserData.credits || 0) + credits,
          updatedAt: serverTimestamp(),
        });

        // Create credit transaction
        await addDoc(collection(db, 'creditTransactions'), {
          userId,
          type: 'earned',
          amount: credits,
          description: reason || 'Admin credit award',
          source: 'admin_award',
          createdAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: `Awarded ${credits} credits to user`,
          newBalance: (targetUserData.credits || 0) + credits,
        });

      case 'deduct_credits':
        if (!credits || credits <= 0) {
          return NextResponse.json(
            { error: 'Credits amount must be positive' },
            { status: 400 }
          );
        }

        const newBalance = Math.max(0, (targetUserData.credits || 0) - credits);
        const actualDeduction = (targetUserData.credits || 0) - newBalance;

        // Update user credits
        await updateDoc(targetUserRef, {
          credits: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Create credit transaction
        await addDoc(collection(db, 'creditTransactions'), {
          userId,
          type: 'spent',
          amount: -actualDeduction,
          description: reason || 'Admin credit deduction',
          source: 'admin_award',
          createdAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: `Deducted ${actualDeduction} credits from user`,
          newBalance,
        });

      case 'ban_user':
        await updateDoc(targetUserRef, {
          banned: true,
          bannedAt: serverTimestamp(),
          bannedBy: user.uid,
          banReason: reason || 'No reason provided',
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'User has been banned',
        });

      case 'unban_user':
        await updateDoc(targetUserRef, {
          banned: false,
          bannedAt: null,
          bannedBy: null,
          banReason: null,
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'User has been unbanned',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Update admin user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}