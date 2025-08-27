import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, postUrl, platform, hashtags } = await request.json();

    // Validate required fields
    if (!type || !platform) {
      return NextResponse.json(
        { error: 'Type and platform are required' },
        { status: 400 }
      );
    }

    // Validate task type
    const validTypes = ['instagram_share', 'tiktok_share', 'twitter_share', 'facebook_share'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      );
    }

    // Check if user has already submitted this type of task recently (prevent spam)
    const recentTasksQuery = query(
      collection(db, 'socialTasks'),
      where('userId', '==', user.uid),
      where('type', '==', type),
      where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24 hours
      orderBy('createdAt', 'desc')
    );

    const recentTasks = await getDocs(recentTasksQuery);
    if (!recentTasks.empty) {
      return NextResponse.json(
        { error: 'You can only submit one task of this type per day' },
        { status: 429 }
      );
    }

    // Create social task record
    const taskData = {
      userId: user.uid,
      userEmail: user.email,
      type,
      platform,
      postUrl: postUrl || null,
      hashtags: hashtags || [],
      status: 'pending', // pending, approved, rejected
      creditsAwarded: 0,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'socialTasks'), taskData);

    return NextResponse.json({
      success: true,
      taskId: docRef.id,
      message: 'Social media task submitted successfully. We\'ll review it within 24 hours.',
    });

  } catch (error) {
    console.error('Create social task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');

    // Get user's social tasks
    const tasksQuery = query(
      collection(db, 'socialTasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(tasksQuery);
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      tasks: tasks.slice(0, limitParam),
      total: tasks.length,
    });

  } catch (error) {
    console.error('Get social tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}