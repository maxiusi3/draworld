import { uploadBytes, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { contentModerationService, ModerationResult } from './contentModerationService';

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  moderationResult?: ModerationResult;
}

export class ImageService {
  /**
   * Upload image to Firebase Storage with content moderation
   */
  static async uploadImage(
    file: File, 
    userId: string, 
    folder: string = 'uploads',
    skipModeration: boolean = false
  ): Promise<ImageUploadResult> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = `${folder}/${userId}/${fileName}`;
      const storageRef = ref(storage, path);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const result: ImageUploadResult = {
        url,
        path,
        size: file.size,
        type: file.type
      };

      // Perform content moderation if enabled and not skipped
      if (!skipModeration && contentModerationService.constructor.isEnabled()) {
        try {
          const moderationResult = await contentModerationService.moderateImage(url);
          result.moderationResult = moderationResult;

          // If content is rejected, delete the uploaded image
          if (!moderationResult.isApproved) {
            await this.deleteImage(path);
            throw new Error(contentModerationService.constructor.getErrorMessage(moderationResult));
          }
        } catch (moderationError) {
          // If moderation fails, delete the uploaded image and throw error
          await this.deleteImage(path);
          throw moderationError;
        }
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload and moderate image using Firebase Functions
   */
  static async uploadImageWithServerModeration(
    file: File, 
    userId: string, 
    folder: string = 'uploads'
  ): Promise<ImageUploadResult> {
    try {
      // First upload the image
      const uploadResult = await this.uploadImage(file, userId, folder, true); // Skip client-side moderation

      // Call Firebase Function for server-side moderation
      const moderateImage = httpsCallable(functions, 'moderateUploadedImage');
      const moderationResponse = await moderateImage({
        imageUrl: uploadResult.url,
        imageId: uploadResult.path,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          userId
        }
      });

      const moderationData = moderationResponse.data as any;
      
      if (moderationData.success) {
        uploadResult.moderationResult = moderationData.result;
        
        // If content is rejected, the Firebase Function should have already deleted it
        if (!moderationData.result.isApproved) {
          throw new Error(contentModerationService.constructor.getErrorMessage(moderationData.result));
        }
      } else {
        throw new Error('Server-side moderation failed');
      }

      return uploadResult;
    } catch (error: any) {
      throw new Error(`Failed to upload and moderate image: ${error.message}`);
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  static async deleteImage(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Validate image file
   */
  static validateImage(
    file: File,
    maxSizeBytes: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = ['image/jpeg', 'image/png']
  ): string | null {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes.map(type => 
        type.split('/')[1].toUpperCase()
      ).join(', ');
      return `Please upload a ${allowedExtensions} file`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      return 'Please upload a valid image file';
    }

    return null;
  }

  /**
   * Create image preview URL
   */
  static createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to create image preview'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Resize image if needed (for thumbnails)
   */
  static async resizeImage(
    file: File, 
    maxWidth: number = 800, 
    maxHeight: number = 600, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}