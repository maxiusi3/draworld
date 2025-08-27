import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
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

    // Check if video is public or user owns it
    const user = getCurrentUser();
    const isOwner = user && videoCreationData.userId === user.uid;
    const isPublic = videoCreationData.isPublic;

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Increment view count if not the owner
    if (!isOwner && videoCreationData.status === 'completed') {
      await updateDoc(doc(db, 'videoCreations', videoCreationId), {
        views: (videoCreationData.views || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      id: videoCreationId,
      ...videoCreationData,
      views: isOwner ? videoCreationData.views : (videoCreationData.views || 0) + 1,
    });

  } catch (error) {
    console.error('Get video error:', error);
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

    const videoCreationId = params.id;
    const { isPublic, title } = await request.json();

    // Get video creation record
    const videoCreationDoc = await getDoc(doc(db, 'videoCreations', videoCreationId));
    
    if (!videoCreationDoc.exists()) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoCreationData = videoCreationDoc.data();

    // Check if user owns this video
    if (videoCreationData.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (typeof isPublic === 'boolean') {
      updateData.isPublic = isPublic;
    }

    if (title && typeof title === 'string') {
      updateData.title = title.trim();
    }

    // Update video creation
    await updateDoc(doc(db, 'videoCreations', videoCreationId), updateData);

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully',
    });

  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoCreationData = videoCreationDoc.data();

    // Check if user owns this video
    if (videoCreationData.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete video creation record
    await deleteDoc(doc(db, 'videoCreations', videoCreationId));

    // TODO: Delete associated files from storage (video, thumbnail, original image)
    // This should be implemented when Firebase Storage integration is added

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });

  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}