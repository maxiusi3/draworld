export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  timeOffset?: number; // seconds into video
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export class ThumbnailService {
  /**
   * Generate thumbnail from video file
   */
  static async generateFromVideo(
    videoFile: File,
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
      width = 640,
      height = 360,
      quality = 0.8,
      timeOffset = 1,
      format = 'jpeg',
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        // Calculate aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let canvasWidth = width;
        let canvasHeight = height;

        if (aspectRatio > canvasWidth / canvasHeight) {
          canvasHeight = canvasWidth / aspectRatio;
        } else {
          canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      });

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const mimeType = `image/${format}`;
          canvas.toBlob((blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL(mimeType, quality);
              resolve({
                blob,
                dataUrl,
                width: canvas.width,
                height: canvas.height,
              });
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          }, mimeType, quality);
        } catch (error) {
          reject(new Error('Failed to draw video frame to canvas'));
        }
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      });

      video.src = URL.createObjectURL(videoFile);
      video.currentTime = Math.min(timeOffset, video.duration || timeOffset);
    });
  }

  /**
   * Generate thumbnail from video URL
   */
  static async generateFromVideoUrl(
    videoUrl: string,
    options: ThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
      width = 640,
      height = 360,
      quality = 0.8,
      timeOffset = 1,
      format = 'jpeg',
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.crossOrigin = 'anonymous';
      video.addEventListener('loadedmetadata', () => {
        const aspectRatio = video.videoWidth / video.videoHeight;
        let canvasWidth = width;
        let canvasHeight = height;

        if (aspectRatio > canvasWidth / canvasHeight) {
          canvasHeight = canvasWidth / aspectRatio;
        } else {
          canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      });

      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const mimeType = `image/${format}`;
          canvas.toBlob((blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL(mimeType, quality);
              resolve({
                blob,
                dataUrl,
                width: canvas.width,
                height: canvas.height,
              });
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          }, mimeType, quality);
        } catch (error) {
          reject(new Error('Failed to draw video frame to canvas'));
        }
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video from URL'));
      });

      video.src = videoUrl;
      video.currentTime = timeOffset;
    });
  }

  /**
   * Resize image to thumbnail size
   */
  static async resizeImage(
    imageFile: File,
    options: Pick<ThumbnailOptions, 'width' | 'height' | 'quality' | 'format'> = {}
  ): Promise<ThumbnailResult> {
    const {
      width = 640,
      height = 360,
      quality = 0.8,
      format = 'jpeg',
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.addEventListener('load', () => {
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        let canvasWidth = width;
        let canvasHeight = height;

        if (aspectRatio > canvasWidth / canvasHeight) {
          canvasHeight = canvasWidth / aspectRatio;
        } else {
          canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        const mimeType = `image/${format}`;
        canvas.toBlob((blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            resolve({
              blob,
              dataUrl,
              width: canvasWidth,
              height: canvasHeight,
            });
          } else {
            reject(new Error('Failed to generate thumbnail blob'));
          }
        }, mimeType, quality);
      });

      img.addEventListener('error', () => {
        reject(new Error('Failed to load image'));
      });

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Convert blob to base64 data URL
   */
  static async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert data URL to blob
   */
  static dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }
}