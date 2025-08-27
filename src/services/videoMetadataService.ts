import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { VideoMetadata, VideoProcessingJob } from '@/types';

export class VideoMetadataService {
  private static readonly METADATA_COLLECTION = 'videoMetadata';
  private static readonly PROCESSING_JOBS_COLLECTION = 'videoProcessingJobs';

  /**
   * Create video metadata record
   */
  static async createMetadata(metadata: Omit<VideoMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.METADATA_COLLECTION), {
        ...metadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Failed to create video metadata:', error);
      throw new Error('Failed to create video metadata');
    }
  }

  /**
   * Update video metadata
   */
  static async updateMetadata(
    metadataId: string,
    updates: Partial<Omit<VideoMetadata, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.METADATA_COLLECTION, metadataId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update video metadata:', error);
      throw new Error('Failed to update video metadata');
    }
  }

  /**
   * Get video metadata by ID
   */
  static async getMetadata(metadataId: string): Promise<VideoMetadata | null> {
    try {
      const docSnap = await getDoc(doc(db, this.METADATA_COLLECTION, metadataId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as VideoMetadata;
      }
      return null;
    } catch (error) {
      console.error('Failed to get video metadata:', error);
      throw new Error('Failed to get video metadata');
    }
  }

  /**
   * Get video metadata by video creation ID
   */
  static async getMetadataByVideoCreationId(videoCreationId: string): Promise<VideoMetadata | null> {
    try {
      const q = query(
        collection(db, this.METADATA_COLLECTION),
        where('videoCreationId', '==', videoCreationId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as VideoMetadata;
      }
      return null;
    } catch (error) {
      console.error('Failed to get video metadata by creation ID:', error);
      throw new Error('Failed to get video metadata');
    }
  }

  /**
   * Delete video metadata
   */
  static async deleteMetadata(metadataId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.METADATA_COLLECTION, metadataId));
    } catch (error) {
      console.error('Failed to delete video metadata:', error);
      throw new Error('Failed to delete video metadata');
    }
  }

  /**
   * Create processing job
   */
  static async createProcessingJob(
    job: Omit<VideoProcessingJob, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.PROCESSING_JOBS_COLLECTION), {
        ...job,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Failed to create processing job:', error);
      throw new Error('Failed to create processing job');
    }
  }

  /**
   * Update processing job
   */
  static async updateProcessingJob(
    jobId: string,
    updates: Partial<Omit<VideoProcessingJob, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Add timestamps for status changes
      if (updates.status === 'processing' && !updates.startedAt) {
        updateData.startedAt = serverTimestamp();
      }
      if ((updates.status === 'completed' || updates.status === 'failed') && !updates.completedAt) {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, this.PROCESSING_JOBS_COLLECTION, jobId), updateData);
    } catch (error) {
      console.error('Failed to update processing job:', error);
      throw new Error('Failed to update processing job');
    }
  }

  /**
   * Get processing job by ID
   */
  static async getProcessingJob(jobId: string): Promise<VideoProcessingJob | null> {
    try {
      const docSnap = await getDoc(doc(db, this.PROCESSING_JOBS_COLLECTION, jobId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as VideoProcessingJob;
      }
      return null;
    } catch (error) {
      console.error('Failed to get processing job:', error);
      throw new Error('Failed to get processing job');
    }
  }

  /**
   * Get processing jobs for video creation
   */
  static async getProcessingJobsForVideo(videoCreationId: string): Promise<VideoProcessingJob[]> {
    try {
      const q = query(
        collection(db, this.PROCESSING_JOBS_COLLECTION),
        where('videoCreationId', '==', videoCreationId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoProcessingJob[];
    } catch (error) {
      console.error('Failed to get processing jobs:', error);
      throw new Error('Failed to get processing jobs');
    }
  }

  /**
   * Get pending processing jobs
   */
  static async getPendingJobs(jobType?: string, limitCount: number = 10): Promise<VideoProcessingJob[]> {
    try {
      let q = query(
        collection(db, this.PROCESSING_JOBS_COLLECTION),
        where('status', '==', 'queued'),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      if (jobType) {
        q = query(
          collection(db, this.PROCESSING_JOBS_COLLECTION),
          where('status', '==', 'queued'),
          where('type', '==', jobType),
          orderBy('priority', 'desc'),
          orderBy('createdAt', 'asc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoProcessingJob[];
    } catch (error) {
      console.error('Failed to get pending jobs:', error);
      throw new Error('Failed to get pending jobs');
    }
  }

  /**
   * Delete processing job
   */
  static async deleteProcessingJob(jobId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.PROCESSING_JOBS_COLLECTION, jobId));
    } catch (error) {
      console.error('Failed to delete processing job:', error);
      throw new Error('Failed to delete processing job');
    }
  }

  /**
   * Extract video metadata from file
   */
  static async extractVideoMetadata(videoFile: File): Promise<{
    duration: number;
    resolution: string;
    fileSize: number;
    mimeType: string;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.addEventListener('loadedmetadata', () => {
        resolve({
          duration: video.duration,
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          fileSize: videoFile.size,
          mimeType: videoFile.type,
        });
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video metadata'));
      });

      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Calculate storage usage for user
   */
  static async calculateUserStorageUsage(userId: string): Promise<{
    totalSize: number;
    videoCount: number;
    averageFileSize: number;
  }> {
    try {
      // This would typically be done with a more efficient query or aggregation
      // For now, we'll return mock data
      return {
        totalSize: 0,
        videoCount: 0,
        averageFileSize: 0,
      };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      throw new Error('Failed to calculate storage usage');
    }
  }

  /**
   * Clean up old metadata records
   */
  static async cleanupOldMetadata(daysOld: number = 30): Promise<number> {
    try {
      // This would typically be implemented as a Cloud Function
      // For now, we'll just return 0
      console.log(`Cleanup requested for metadata older than ${daysOld} days`);
      return 0;
    } catch (error) {
      console.error('Failed to cleanup old metadata:', error);
      throw new Error('Failed to cleanup old metadata');
    }
  }

  /**
   * Get video statistics
   */
  static async getVideoStatistics(): Promise<{
    totalVideos: number;
    totalSize: number;
    averageDuration: number;
    popularResolutions: Array<{ resolution: string; count: number }>;
  }> {
    try {
      // This would typically be done with aggregation queries
      // For now, return mock data
      return {
        totalVideos: 0,
        totalSize: 0,
        averageDuration: 0,
        popularResolutions: [],
      };
    } catch (error) {
      console.error('Failed to get video statistics:', error);
      throw new Error('Failed to get video statistics');
    }
  }
}