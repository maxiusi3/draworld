import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

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

    const { action, notes, creditsAwarded } = await request.json();
    const taskId = params.id;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      );
    }

    // Get the task
    const taskRef = doc(db, 'socialTasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();
    
    // Check if task is already reviewed
    if (taskData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Task has already been reviewed' },
        { status: 400 }
      );
    }

    // Update task status
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: userData.email || user.email,
      reviewedAt: serverTimestamp(),
      reviewNotes: notes || null,
      creditsAwarded: action === 'approve' ? (creditsAwarded || 0) : 0,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(taskRef, updateData);

    // If approved, award credits to the user
    if (action === 'approve' && creditsAwarded > 0) {
      try {
        // Update user credits
        const userRef = doc(db, 'users', taskData.userId);
        const userSnapshot = await getDoc(userRef);
        
        if (userSnapshot.exists()) {
          await updateDoc(userRef, {
            credits: (userSnapshot.data().credits || 0) + creditsAwarded,
            updatedAt: serverTimestamp(),
          });

          // Create credit transaction
          await addDoc(collection(db, 'creditTransactions'), {
            userId: taskData.userId,
            type: 'earned',
            amount: creditsAwarded,
            description: `Social media task reward: ${taskData.type}`,
            source: 'social_task',
            relatedId: taskId,
            createdAt: serverTimestamp(),
          });
        }
      } catch (creditError) {
        console.error('Failed to award credits:', creditError);
        // Don't fail the entire operation if credit award fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Task ${action}d successfully`,
      creditsAwarded: action === 'approve' ? creditsAwarded : 0,
    });

  } catch (error) {
    console.error('Update social task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}