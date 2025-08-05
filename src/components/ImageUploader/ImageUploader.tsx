import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { storageService } from '../../services/storageService';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  loading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, loading = false }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // 验证文件
    const validation = storageService.validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }
    
    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    
    // 压缩图片（如果需要）
    try {
      let processedFile = file;
      
      // 如果文件过大或尺寸过大，进行压缩
      if (file.size > 2 * 1024 * 1024) { // 2MB
        processedFile = await storageService.compressImage(file, 1920, 1080, 0.8);
        toast.success('图片已自动压缩优化');
      }
      
      onImageSelected(processedFile, previewUrl);
    } catch (error) {
      console.error('图片处理失败:', error);
      toast.error('图片处理失败');
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif']
    },
    multiple: false,
    disabled: loading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : ''}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {isDragReject ? (
            <>
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <div>
                <p className="text-red-600 font-medium">
                  不支持的文件类型
                </p>
                <p className="text-red-500 text-sm">
                  请选择 JPG、PNG 或 HEIC 格式的图片
                </p>
              </div>
            </>
          ) : (
            <>
              {isDragActive ? (
                <>
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
                  <div>
                    <p className="text-blue-600 font-medium">
                      放开以上传图片
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-fit mx-auto">
                    <PhotoIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-800">
                      上传孩子的绘画作品
                    </p>
                    <p className="text-gray-600 mt-1">
                      拖拽图片到这里，或者{' '}
                      <span className="text-blue-600 font-medium">点击选择文件</span>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
          
          {!isDragActive && !isDragReject && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>支持 JPG、PNG、HEIC</span>
                <span>•</span>
                <span>最大 10MB</span>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-auto max-w-md">
                <p className="text-yellow-800 text-xs">
                  <strong>小贴士：</strong>
                  选择清晰、光线良好的作品照片，会让AI生成的动画效果更佳哦！
                </p>
              </div>
            </div>
          )}
        </div>
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-2xl">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">处理中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;