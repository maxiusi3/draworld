import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createRateLimiter, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rateLimiter';
import { runwareAPI } from '@/lib/runware';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CREDITS } from '@/lib/constants';

const rateLimiter = createRateLimiter(RATE_LIMITS.VIDEO_GENERATION);

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

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.uid);
    const rateLimit = await rateLimiter.isAllowed(identifier);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'You can only generate 5 videos per hour. Please try again later.',
          resetTime: rateLimit.resetTime 
        },
        { status: 429 }
      );
    }

    const { imageUrl, prompt, mood, title } = await request.json();

    // Validate input
    if (!imageUrl || !prompt || !mood) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, prompt, mood' },
        { status: 400 }
      );
    }

    if (prompt.length > 300) {
      return NextResponse.json(
        { error: 'Prompt must be 300 characters or less' },
        { status: 400 }
      );
    }

    const validMoods = ['joyful', 'calm', 'epic', 'mysterious'];
    if (!validMoods.includes(mood)) {
      return NextResponse.json(
        { error: 'Invalid mood. Must be one of: joyful, calm, epic, mysterious' },
        { status: 400 }
      );
    }

    // Check user credits
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentCredits = userData.credits || 0;

    if (currentCredits < CREDITS.VIDEO_CREATION_COST) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          message: `You need ${CREDITS.VIDEO_CREATION_COST} credits to generate a video. You have ${currentCredits} credits.`,
          required: CREDITS.VIDEO_CREATION_COST,
          available: currentCredits
        },
        { status: 402 }
      );
    }

    // Create video creation record
    const videoCreationData = {
      userId: user.uid,
      title: title || 'Untitled Creation',
      prompt,
      mood,
      originalImageUrl: imageUrl,
      status: 'pending',
      isPublic: false,
      views: 0,
      shares: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const videoCreationRef = await addDoc(collection(db, 'videoCreations'), videoCreationData);

    try {
      // Start video generation with Runware API
      const generationResult = await runwareAPI.generateVideo({
        imageUrl,
        prompt,
        mood,
      });

      // Update video creation with generation ID and status
      await updateDoc(videoCreationRef, {
        runwareGenerationId: generationResult.id,
        status: generationResult.status,
        updatedAt: serverTimestamp(),
      });

      // Deduct credits from user
      await updateDoc(doc(db, 'users', user.uid), {
        credits: currentCredits - CREDITS.VIDEO_CREATION_COST,
        updatedAt: serverTimestamp(),
      });

      // Create credit transaction
      await addDoc(collection(db, 'creditTransactions'), {
        userId: user.uid,
        type: 'spent',
        amount: -CREDITS.VIDEO_CREATION_COST,
        description: 'Video generation',
        source: 'video_generation',
        relatedId: videoCreationRef.id,
        createdAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        videoCreationId: videoCreationRef.id,
        generationId: generationResult.id,
        status: generationResult.status,
        creditsRemaining: currentCredits - CREDITS.VIDEO_CREATION_COST,
      });

    } catch (apiError: any) {
      // If API call fails, update status and don't charge credits
      await updateDoc(videoCreationRef, {
        status: 'failed',
        error: apiError.message || 'Video generation failed',
        updatedAt: serverTimestamp(),
      });

      console.error('Runware API error:', apiError);
      return NextResponse.json(
        { 
          error: 'Video generation failed',
          message: 'There was an error starting the video generation. Please try again.',
          videoCreationId: videoCreationRef.id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}