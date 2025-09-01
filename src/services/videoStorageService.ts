import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface VideoUploadResult {
  url: string;
  path: string;
  metadata: {
    size: number;
    contentType: string;
    timeCreated: string;
  };
}

export class VideoStorageService {
  private static readonly VIDEOS_PATH = 'videos';
  private static readonly THUMBNAILS_PATH = 'thumbnails';
  private static readonly IMAGES_PATH = 'images';

  /**
   * Upload video file to Firebase Storage
   */
  static async uploadVideo(
    file: File | Blob,
    videoCreationId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<VideoUploadResult> {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const fileName = `${videoCreationId}.mp4`;
      const filePath = `${this.VIDEOS_PATH}/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      const uploadTask = uploadBytes(storageRef, file);
      
      // Monitor progress if callback provided
      if (onProgress) {
        // Note: Firebase v9+ doesn't have built-in progress monitoring for uploadBytes
        // For progress monitoring, we'd need to use uploadBytesResumable
        // For now, we'll simulate progress
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            onProgress({
              bytesTransferred: (progress / 100) * file.size,
              totalBytes: file.size,
              progress,
            });
            if (progress >= 100) {
              clearInterval(interval);
            }
          }, 200);
        };
        simulateProgress();
      }

      const snapshot = await uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);

      return {
        url: downloadURL,
        path: filePath,
        metadata: {
          size: metadata.size,
          contentType: metadata.contentType || 'video/mp4',
          timeCreated: metadata.timeCreated,
        },
      };
    } catch (error) {
      console.error('Video upload failed:', error);
      throw new Error('Failed to upload video');
    }
  }

  /**
   * Upload thumbnail image to Firebase Storage
   */
  static async uploadThumbnail(
    file: File | Blob,
    videoCreationId: string,
    userId: string
  ): Promise<VideoUploadResult> {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const fileName = `${videoCreationId}_thumb.jpg`;
      const filePath = `${this.THUMBNAILS_PATH}/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);

      return {
        url: downloadURL,
        path: filePath,
        metadata: {
          size: metadata.size,
          contentType: metadata.contentType || 'image/jpeg',
          timeCreated: metadata.timeCreated,
        },
      };
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      throw new Error('Failed to upload thumbnail');
    }
  }

  /**
   * Upload original image to Firebase Storage
   */
  static async uploadImage(
    file: File,
    videoCreationId: string,
    userId: string,
    type: 'original' | 'cropped' = 'original'
  ): Promise<VideoUploadResult> {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${videoCreationId}_${type}.${extension}`;
      const filePath = `${this.IMAGES_PATH}/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);

      return {
        url: downloadURL,
        path: filePath,
        metadata: {
          size: metadata.size,
          contentType: metadata.contentType || 'image/jpeg',
          timeCreated: metadata.timeCreated,
        },
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete video file from Firebase Storage
   */
  static async deleteVideo(filePath: string): Promise<void> {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Video deletion failed:', error);
      throw new Error('Failed to delete video');
    }
  }

  /**
   * Delete thumbnail from Firebase Storage
   */
  static async deleteThumbnail(filePath: string): Promise<void> {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Thumbnail deletion failed:', error);
      throw new Error('Failed to delete thumbnail');
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  static async deleteImage(filePath: string): Promise<void> {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Get file metadata from Firebase Storage
   */
  static async getFileMetadata(filePath: string) {
    if (!storage) {
      throw new Error("Firebase Storage is not initialized.");
    }
    try {
      const storageRef = ref(storage, filePath);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Generate thumbnail from video file
   */
  static async generateThumbnail(
    videoFile: File,
    timeOffset: number = 1
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      });

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      });

      video.src = URL.createObjectURL(videoFile);
      video.currentTime = timeOffset;
    });
  }

  /**
   * Get video duration from file
   */
  static async getVideoDuration(videoFile: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video metadata'));
      });

      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Validate video file
   */
  static validateVideoFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload MP4, WebM, or QuickTime video.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 100MB.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP image.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 10MB.',
      };
    }

    return { valid: true };
  }

  /**
   * Clean up old files (for maintenance)
   */
  static async cleanupOldFiles(userId: string, daysOld: number = 30): Promise<void> {
    // This would typically be implemented as a Cloud Function
    // For now, we'll just log the intent
    console.log(`Cleanup requested for user ${userId}, files older than ${daysOld} days`);
    
    // In a real implementation, this would:
    // 1. Query Firestore for old video creations
    // 2. Delete associated files from Storage
    // 3. Update database records
  }

  /**
   * Get storage usage for user
   */
  static async getUserStorageUsage(userId: string): Promise<{
    totalSize: number;
    videoCount: number;
    imageCount: number;
  }> {
    // This would typically query Firebase Storage or maintain usage stats in Firestore
    // For now, return mock data
    console.log(`Getting storage usage for user: ${userId}`);
    return {
      totalSize: 0,
      videoCount: 0,
      imageCount: 0,
    };
  }
}