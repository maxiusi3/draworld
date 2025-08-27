import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoCreationId = params.id;

    // Get video creation record
    const videoCreationDoc = await getDoc(doc(db, 'videoCreations', videoCreationId));
    
    if (!videoCreationDoc.exists()) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoCreationData = videoCreationDoc.data();

    // Only allow sharing of completed, public videos
    if (videoCreationData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Video is not ready for sharing' },
        { status: 400 }
      );
    }

    if (!videoCreationData.isPublic) {
      return NextResponse.json(
        { error: 'Video is not public' },
        { status: 400 }
      );
    }

    // Increment share count
    await updateDoc(doc(db, 'videoCreations', videoCreationId), {
      shares: (videoCreationData.shares || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      shares: (videoCreationData.shares || 0) + 1,
    });

  } catch (error) {
    console.error('Share video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}