'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './Button';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height ratio, default is free crop
  className?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio,
  className = ''
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Initialize crop area when image loads
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width - 40; // padding
      const containerHeight = containerRect.height - 40;

      // Calculate display size maintaining aspect ratio
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      let displayWidth = containerWidth;
      let displayHeight = containerWidth / imgAspectRatio;

      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgAspectRatio;
      }

      setImageSize({ width: displayWidth, height: displayHeight });

      // Set initial crop area (center 60% of image)
      const cropSize = Math.min(displayWidth, displayHeight) * 0.6;
      const cropWidth = aspectRatio ? cropSize : cropSize;
      const cropHeight = aspectRatio ? cropSize / aspectRatio : cropSize;

      setCropArea({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      });

      setIsLoading(false);
    };

    img.src = imageUrl;
  }, [imageUrl, aspectRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startCropArea = { ...cropArea };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (action === 'drag') {
        const newX = Math.max(0, Math.min(imageSize.width - startCropArea.width, startCropArea.x + deltaX));
        const newY = Math.max(0, Math.min(imageSize.height - startCropArea.height, startCropArea.y + deltaY));
        
        setCropArea(prev => ({
          ...prev,
          x: newX,
          y: newY
        }));
      } else if (action === 'resize') {
        const newCropArea = { ...startCropArea };

        switch (handle) {
          case 'nw':
            newCropArea.x = startCropArea.x + deltaX;
            newCropArea.y = startCropArea.y + deltaY;
            newCropArea.width = startCropArea.width - deltaX;
            newCropArea.height = startCropArea.height - deltaY;
            break;
          case 'ne':
            newCropArea.y = startCropArea.y + deltaY;
            newCropArea.width = startCropArea.width + deltaX;
            newCropArea.height = startCropArea.height - deltaY;
            break;
          case 'sw':
            newCropArea.x = startCropArea.x + deltaX;
            newCropArea.width = startCropArea.width - deltaX;
            newCropArea.height = startCropArea.height + deltaY;
            break;
          case 'se':
            newCropArea.width = startCropArea.width + deltaX;
            newCropArea.height = startCropArea.height + deltaY;
            break;
        }

        // Maintain aspect ratio if specified
        if (aspectRatio) {
          if (handle === 'nw' || handle === 'se') {
            newCropArea.height = newCropArea.width / aspectRatio;
          } else {
            newCropArea.width = newCropArea.height * aspectRatio;
          }
        }

        // Ensure crop area stays within bounds
        newCropArea.x = Math.max(0, newCropArea.x);
        newCropArea.y = Math.max(0, newCropArea.y);
        newCropArea.width = Math.max(50, Math.min(imageSize.width - newCropArea.x, newCropArea.width));
        newCropArea.height = Math.max(50, Math.min(imageSize.height - newCropArea.y, newCropArea.height));

        setCropArea(newCropArea);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [cropArea, imageSize, aspectRatio]);

  const handleCrop = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scale factor between display size and natural size
    const scaleX = img.naturalWidth / imageSize.width;
    const scaleY = img.naturalHeight / imageSize.height;

    // Set canvas size to crop area
    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    // Draw cropped image
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(croppedUrl);
      }
    }, 'image/jpeg', 0.9);
  }, [cropArea, imageSize, onCropComplete]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl p-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Crop Your Artwork</h3>
        <p className="text-gray-600">Select the area you want to animate</p>
      </div>

      <div 
        ref={containerRef}
        className="relative bg-gray-100 rounded-xl overflow-hidden mx-auto"
        style={{ 
          width: '100%', 
          height: '400px',
          maxWidth: '600px'
        }}
      >
        {/* Original Image */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Original artwork"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: imageSize.width,
            height: imageSize.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          draggable={false}
        />

        {/* Crop Overlay */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 cursor-move"
          style={{
            left: `calc(50% - ${imageSize.width / 2}px + ${cropArea.x}px)`,
            top: `calc(50% - ${imageSize.height / 2}px + ${cropArea.y}px)`,
            width: cropArea.width,
            height: cropArea.height
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {/* Resize Handles */}
          {['nw', 'ne', 'sw', 'se'].map((handle) => (
            <div
              key={handle}
              className={`absolute w-3 h-3 bg-blue-500 border border-white cursor-${handle}-resize`}
              style={{
                top: handle.includes('n') ? -6 : 'auto',
                bottom: handle.includes('s') ? -6 : 'auto',
                left: handle.includes('w') ? -6 : 'auto',
                right: handle.includes('e') ? -6 : 'auto'
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'resize', handle);
              }}
            />
          ))}
        </div>

        {/* Dimmed overlay outside crop area */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-40 pointer-events-none"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              calc(50% - ${imageSize.width / 2}px + ${cropArea.x}px) 100%, 
              calc(50% - ${imageSize.width / 2}px + ${cropArea.x}px) calc(50% - ${imageSize.height / 2}px + ${cropArea.y}px), 
              calc(50% - ${imageSize.width / 2}px + ${cropArea.x + cropArea.width}px) calc(50% - ${imageSize.height / 2}px + ${cropArea.y}px), 
              calc(50% - ${imageSize.width / 2}px + ${cropArea.x + cropArea.width}px) calc(50% - ${imageSize.height / 2}px + ${cropArea.y + cropArea.height}px), 
              calc(50% - ${imageSize.width / 2}px + ${cropArea.x}px) calc(50% - ${imageSize.height / 2}px + ${cropArea.y + cropArea.height}px), 
              calc(50% - ${imageSize.width / 2}px + ${cropArea.x}px) 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mt-6">
        <Button
          onClick={onCancel}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="primary"
        >
          Crop & Continue
        </Button>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}