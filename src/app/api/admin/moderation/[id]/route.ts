import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

    const { action, reason, category, tags } = await request.json();
    const videoId = params.id;

    // Validate action
    if (!['approve', 'reject', 'promote_to_gallery', 'remove_from_gallery'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the video
    const videoRef = doc(db, 'videoCreations', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoData = videoDoc.data();

    switch (action) {
      case 'approve':
        await updateDoc(videoRef, {
          moderationStatus: 'approved',
          moderatedBy: user.uid,
          moderatedAt: serverTimestamp(),
          moderationReason: reason || null,
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'Video approved successfully',
        });

      case 'reject':
        await updateDoc(videoRef, {
          moderationStatus: 'rejected',
          moderatedBy: user.uid,
          moderatedAt: serverTimestamp(),
          moderationReason: reason || 'Content does not meet community guidelines',
          isPublic: false, // Remove from public view
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'Video rejected successfully',
        });

      case 'promote_to_gallery':
        // Check if video is approved first
        if (videoData.moderationStatus !== 'approved') {
          return NextResponse.json(
            { error: 'Video must be approved before promoting to gallery' },
            { status: 400 }
          );
        }

        await updateDoc(videoRef, {
          isPublic: true,
          promotedToGallery: true,
          promotedBy: user.uid,
          promotedAt: serverTimestamp(),
          category: category || videoData.category || 'general',
          tags: tags || videoData.tags || [],
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'Video promoted to public gallery successfully',
        });

      case 'remove_from_gallery':
        await updateDoc(videoRef, {
          isPublic: false,
          promotedToGallery: false,
          removedFromGalleryBy: user.uid,
          removedFromGalleryAt: serverTimestamp(),
          removalReason: reason || 'Removed by admin',
          updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: 'Video removed from public gallery successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Update moderation status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}