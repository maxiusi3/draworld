import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runwareAPI } from '@/lib/runware';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

    const videoCreationId = params.id;

    // Get video creation record
    const videoCreationDoc = await getDoc(doc(db, 'videoCreations', videoCreationId));
    
    if (!videoCreationDoc.exists()) {
      return NextResponse.json(
        { error: 'Video creation not found' },
        { status: 404 }
      );
    }

    const videoCreationData = videoCreationDoc.data();

    // Check if user owns this video creation
    if (videoCreationData.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // If already completed or failed, return current status
    if (videoCreationData.status === 'completed' || videoCreationData.status === 'failed') {
      return NextResponse.json({
        id: videoCreationId,
        status: videoCreationData.status,
        videoUrl: videoCreationData.videoUrl,
        thumbnailUrl: videoCreationData.thumbnailUrl,
        error: videoCreationData.error,
        title: videoCreationData.title,
        prompt: videoCreationData.prompt,
        mood: videoCreationData.mood,
        createdAt: videoCreationData.createdAt,
      });
    }

    // Check status with Runware API if still processing
    if (videoCreationData.runwareGenerationId) {
      try {
        const statusResult = await runwareAPI.getGenerationStatus(videoCreationData.runwareGenerationId);

        // Update local record if status changed
        if (statusResult.status !== videoCreationData.status) {
          const updateData: any = {
            status: statusResult.status,
            updatedAt: serverTimestamp(),
          };

          if (statusResult.videoUrl) {
            updateData.videoUrl = statusResult.videoUrl;
          }

          if (statusResult.thumbnailUrl) {
            updateData.thumbnailUrl = statusResult.thumbnailUrl;
          }

          if (statusResult.error) {
            updateData.error = statusResult.error;
          }

          await updateDoc(doc(db, 'videoCreations', videoCreationId), updateData);

          // Update first video flag if this is user's first completed video
          if (statusResult.status === 'completed' && !videoCreationData.isFirstVideoGenerated) {
            await updateDoc(doc(db, 'users', user.uid), {
              isFirstVideoGenerated: true,
              updatedAt: serverTimestamp(),
            });
          }
        }

        return NextResponse.json({
          id: videoCreationId,
          status: statusResult.status,
          videoUrl: statusResult.videoUrl,
          thumbnailUrl: statusResult.thumbnailUrl,
          error: statusResult.error,
          title: videoCreationData.title,
          prompt: videoCreationData.prompt,
          mood: videoCreationData.mood,
          createdAt: videoCreationData.createdAt,
        });

      } catch (apiError: any) {
        console.error('Error checking generation status:', apiError);
        
        // Update status to failed if API call fails
        await updateDoc(doc(db, 'videoCreations', videoCreationId), {
          status: 'failed',
          error: 'Failed to check generation status',
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          id: videoCreationId,
          status: 'failed',
          error: 'Failed to check generation status',
          title: videoCreationData.title,
          prompt: videoCreationData.prompt,
          mood: videoCreationData.mood,
          createdAt: videoCreationData.createdAt,
        });
      }
    }

    // Return current status if no generation ID
    return NextResponse.json({
      id: videoCreationId,
      status: videoCreationData.status,
      error: videoCreationData.error,
      title: videoCreationData.title,
      prompt: videoCreationData.prompt,
      mood: videoCreationData.mood,
      createdAt: videoCreationData.createdAt,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}