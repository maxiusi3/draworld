import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  reasons?: string[];
  categories?: string[];
  moderatedAt: admin.firestore.Timestamp;
  moderatedBy: string;
}

/**
 * Content moderation using Google Cloud Vision API
 */
async function moderateImageWithVision(imageUrl: string): Promise<ModerationResult> {
  try {
    // Import Vision API client
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();

    // Perform safe search detection
    const [result] = await client.safeSearchDetection(imageUrl);
    const safeSearch = result.safeSearchAnnotation;

    if (!safeSearch) {
      throw new Error('No safe search results returned');
    }

    // Check for inappropriate content
    const isAdult = safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY';
    const isViolent = safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY';
    const isRacy = safeSearch.racy === 'LIKELY' || safeSearch.racy === 'VERY_LIKELY';
    const isSpoof = safeSearch.spoof === 'LIKELY' || safeSearch.spoof === 'VERY_LIKELY';
    const isMedical = safeSearch.medical === 'LIKELY' || safeSearch.medical === 'VERY_LIKELY';

    const reasons = [];
    const categories = [];

    if (isAdult) {
      reasons.push('Adult content detected');
      categories.push('adult_content');
    }
    if (isViolent) {
      reasons.push('Violent content detected');
      categories.push('violence');
    }
    if (isRacy) {
      reasons.push('Racy content detected');
      categories.push('racy');
    }
    if (isSpoof) {
      reasons.push('Spoof content detected');
      categories.push('spoof');
    }
    if (isMedical) {
      reasons.push('Medical content detected');
      categories.push('medical');
    }

    return {
      isApproved: !isAdult && !isViolent && !isRacy,
      confidence: 0.9,
      reasons,
      categories,
      moderatedAt: admin.firestore.Timestamp.now(),
      moderatedBy: 'google_vision_api'
    };
  } catch (error) {
    console.error('Google Vision moderation error:', error);
    
    // In case of API error, we'll be conservative and reject
    return {
      isApproved: false,
      confidence: 0.5,
      reasons: ['Moderation API error - content rejected for safety'],
      categories: ['api_error'],
      moderatedAt: admin.firestore.Timestamp.now(),
      moderatedBy: 'google_vision_api'
    };
  }
}

/**
 * Simple keyword-based content filtering as fallback
 */
function moderateImageWithKeywords(imageUrl: string, metadata?: any): ModerationResult {
  const inappropriateKeywords = [
    'inappropriate', 'nsfw', 'adult', 'explicit', 'violence', 'weapon',
    'drug', 'alcohol', 'hate', 'offensive', 'disturbing'
  ];

  const filename = imageUrl.toLowerCase();
  const metadataText = metadata ? JSON.stringify(metadata).toLowerCase() : '';
  const combinedText = filename + ' ' + metadataText;

  const foundKeywords = inappropriateKeywords.filter(keyword => 
    combinedText.includes(keyword)
  );

  return {
    isApproved: foundKeywords.length === 0,
    confidence: foundKeywords.length === 0 ? 0.7 : 0.9,
    reasons: foundKeywords.length > 0 ? [`Inappropriate keywords detected: ${foundKeywords.join(', ')}`] : [],
    categories: foundKeywords.length > 0 ? ['keyword_filter'] : [],
    moderatedAt: admin.firestore.Timestamp.now(),
    moderatedBy: 'keyword_filter'
  };
}

/**
 * Cloud Function to moderate uploaded images
 */
export const moderateUploadedImage = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { imageUrl, imageId, metadata } = data;

  if (!imageUrl || !imageId) {
    throw new functions.https.HttpsError('invalid-argument', 'imageUrl and imageId are required');
  }

  try {
    let moderationResult: ModerationResult;

    // Try Google Vision API first if available
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      try {
        moderationResult = await moderateImageWithVision(imageUrl);
      } catch (error) {
        console.warn('Vision API failed, falling back to keyword filter:', error);
        moderationResult = moderateImageWithKeywords(imageUrl, metadata);
      }
    } else {
      // Use keyword filter as fallback
      moderationResult = moderateImageWithKeywords(imageUrl, metadata);
    }

    // Store moderation result in Firestore
    await db.collection('moderationResults').doc(imageId).set({
      imageUrl,
      imageId,
      userId: context.auth.uid,
      result: moderationResult,
      createdAt: admin.firestore.Timestamp.now()
    });

    // If content is rejected, we might want to delete the image
    if (!moderationResult.isApproved) {
      console.log(`Image ${imageId} rejected:`, moderationResult.reasons);
      
      // Optionally delete the image from storage
      try {
        const bucket = admin.storage().bucket();
        await bucket.file(`images/${imageId}`).delete();
        console.log(`Deleted rejected image: ${imageId}`);
      } catch (deleteError) {
        console.warn(`Failed to delete rejected image ${imageId}:`, deleteError);
      }
    }

    return {
      success: true,
      result: moderationResult
    };

  } catch (error) {
    console.error('Content moderation error:', error);
    throw new functions.https.HttpsError('internal', 'Content moderation failed');
  }
});

/**
 * Cloud Function to get moderation result
 */
export const getModerationResult = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { imageId } = data;

  if (!imageId) {
    throw new functions.https.HttpsError('invalid-argument', 'imageId is required');
  }

  try {
    const doc = await db.collection('moderationResults').doc(imageId).get();
    
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Moderation result not found');
    }

    const data = doc.data();
    
    // Check if user owns this moderation result
    if (data?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    return {
      success: true,
      result: data.result
    };

  } catch (error) {
    console.error('Get moderation result error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get moderation result');
  }
});

/**
 * Cloud Function to batch moderate images (admin only)
 */
export const batchModerateImages = functions.https.onCall(async (data, context) => {
  // Check authentication and admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user is admin (you'll need to implement admin role checking)
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { imageIds } = data;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'imageIds array is required');
  }

  try {
    const results = [];
    
    for (const imageId of imageIds) {
      try {
        // Get image URL from storage or database
        const imageDoc = await db.collection('images').doc(imageId).get();
        
        if (!imageDoc.exists) {
          results.push({
            imageId,
            success: false,
            error: 'Image not found'
          });
          continue;
        }

        const imageData = imageDoc.data();
        const imageUrl = imageData?.url;

        if (!imageUrl) {
          results.push({
            imageId,
            success: false,
            error: 'Image URL not found'
          });
          continue;
        }

        // Moderate the image
        const moderationResult = await moderateImageWithVision(imageUrl);

        // Store result
        await db.collection('moderationResults').doc(imageId).set({
          imageUrl,
          imageId,
          userId: imageData.userId,
          result: moderationResult,
          createdAt: admin.firestore.Timestamp.now(),
          batchProcessed: true
        });

        results.push({
          imageId,
          success: true,
          result: moderationResult
        });

      } catch (error) {
        console.error(`Error moderating image ${imageId}:`, error);
        results.push({
          imageId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      results,
      processedCount: results.filter(r => r.success).length,
      totalCount: imageIds.length
    };

  } catch (error) {
    console.error('Batch moderation error:', error);
    throw new functions.https.HttpsError('internal', 'Batch moderation failed');
  }
});