'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ImageService } from '@/services/imageService';
import { contentModerationService, ContentModerationService } from '@/services/contentModerationService';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string, file: File) => void;
  onError?: (error: string) => void;
  className?: string;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  enableModeration?: boolean;
}

export function ImageUploader({
  onImageUploaded,
  onError,
  className = '',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/png'],
  enableModeration = true
}: ImageUploaderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModerating, setIsModerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);



  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      onError?.('Please sign in to upload images');
      return;
    }

    const validationError = ImageService.validateImage(file, maxSizeBytes, acceptedFormats);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 70));
      }, 100);

      const result = await ImageService.uploadImage(file, user.uid, 'artwork');
      
      clearInterval(progressInterval);
      setUploadProgress(80);

      // Content moderation check
      if (enableModeration && ContentModerationService.isEnabled()) {
        setIsModerating(true);
        setUploadProgress(90);

        try {
          const moderationResult = await contentModerationService.moderateImage(result.url);
          
          if (!moderationResult.isApproved) {
            // Delete the uploaded image since it was rejected
            await ImageService.deleteImage(result.path);
            
            const errorMessage = ContentModerationService.getErrorMessage(moderationResult);
            onError?.(errorMessage);
            setIsUploading(false);
            setIsModerating(false);
            setUploadProgress(0);
            return;
          }
        } catch (moderationError: any) {
          console.error('Content moderation failed:', moderationError);
          // Continue with upload if moderation fails (you might want different behavior)
        }
        
        setIsModerating(false);
      }
      
      setUploadProgress(100);
      
      setTimeout(() => {
        onImageUploaded(result.url, file);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error: any) {
      setIsUploading(false);
      setIsModerating(false);
      setUploadProgress(0);
      onError?.(error.message);
    }
  }, [onImageUploaded, onError, user, maxSizeBytes, acceptedFormats]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => acceptedFormats.includes(file.type));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      onError?.('Please drop a valid image file');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  if (isUploading) {
    return (
      <div className={`bg-white rounded-2xl p-8 border-2 border-gray-200 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isModerating ? 'Checking Content Safety...' : 'Uploading Image...'}
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {isModerating 
              ? 'Ensuring your image is family-friendly...' 
              : `${uploadProgress}% complete`
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`bg-white rounded-2xl p-8 border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isDragging ? 'Drop your image here' : 'Upload your child\'s artwork'}
          </h3>
          <p className="text-gray-600 mb-6">
            Drag and drop an image, or click to browse from your device
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              📁 Browse Files
            </button>

            {/* Mobile camera access */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCameraDialog();
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors sm:hidden"
            >
              📷 Take Photo
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Supported formats: JPEG, PNG • Max size: {Math.round(maxSizeBytes / (1024 * 1024))}MB
          </p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}