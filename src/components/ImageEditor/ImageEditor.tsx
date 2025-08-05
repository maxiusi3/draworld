import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [rotation, setRotation] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    
    // 设置默认裁切区域（全图）
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
  }, []);

  const handleRotate = (degrees: number) => {
    setRotation(prev => {
      const newRotation = (prev + degrees) % 360;
      return newRotation < 0 ? newRotation + 360 : newRotation;
    });
  };

  const handleSave = async () => {
    if (!imgRef.current || !canvasRef.current) {
      toast.error('图片加载错误');
      return;
    }

    setProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('无法获取Canvas上下文');
      }

      const { naturalWidth, naturalHeight } = image;
      
      // 计算裁切区域的像素坐标
      const cropX = (crop.x / 100) * naturalWidth;
      const cropY = (crop.y / 100) * naturalHeight;
      const cropWidth = (crop.width / 100) * naturalWidth;
      const cropHeight = (crop.height / 100) * naturalHeight;

      // 设置画布尺寸
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 应用旋转
      if (rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // 绘制裁切后的图片
      ctx.drawImage(
        image,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height
      );

      if (rotation !== 0) {
        ctx.restore();
      }

      // 转换为 Data URL
      const editedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSave(editedImageUrl);
      
      toast.success('图片编辑完成');
    } catch (error) {
      console.error('图片编辑失败:', error);
      toast.error('图片编辑失败');
    } finally {
      setProcessing(false);
    }
  };

  const resetCrop = () => {
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
    setRotation(0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          编辑图片
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetCrop}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="重置"
          >
            <ArrowsPointingInIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="取消"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 图片编辑区域 */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center min-h-[400px]">
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            aspect={undefined}
            circularCrop={false}
            className="max-w-full max-h-[400px]"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={onImageLoad}
              alt="编辑图片"
              className="max-w-full max-h-[400px] object-contain"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />
          </ReactCrop>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="space-y-4">
        {/* 旋转控制 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            旋转图片
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRotate(-90)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <ArrowPathIcon className="w-4 h-4 transform scale-x-[-1]" />
              <span className="text-sm font-medium">左转90°</span>
            </button>
            <button
              onClick={() => handleRotate(90)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="text-sm font-medium">右转90°</span>
            </button>
            <span className="text-sm text-gray-500 ml-4">
              当前角度: {rotation}°
            </span>
          </div>
        </div>

        {/* 裁切说明 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>操作说明：</strong>
            拖动图片上的选择框来调整裁切区域，可以拖拽角落来改变大小。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-4 pt-4">
          <button
            onClick={handleSave}
            disabled={processing}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            <CheckIcon className="w-5 h-5" />
            <span>{processing ? '处理中...' : '完成编辑'}</span>
          </button>
          
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
        </div>
      </div>

      {/* 隐藏的Canvas用于图片处理 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageEditor;