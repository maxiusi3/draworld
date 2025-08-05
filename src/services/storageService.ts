import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import toast from 'react-hot-toast';

class StorageService {
  /**
   * 上传用户图片
   */
  async uploadUserImage(file: File, userId: string): Promise<string> {
    try {
      // 生成唯一文件名
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imagePath = `users/${userId}/images/${fileName}`;
      
      // 上传文件
      const imageRef = ref(storage, imagePath);
      const snapshot = await uploadBytes(imageRef, file);
      
      // 获取下载URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('上传图片失败:', error);
      toast.error('上传图片失败');
      throw error;
    }
  }

  /**
   * 删除用户图片
   */
  async deleteUserImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
      console.error('删除图片失败:', error);
      // 删除失败不显示错误，因为文件可能已经不存在
    }
  }

  /**
   * 压缩图片
   */
  async compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('压缩图片失败'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('加载图片失败'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 验证图片文件
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '仅支持 JPG、PNG、HEIC 格式的图片'
      };
    }
    
    // 检查文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '图片大小不能超过 10MB'
      };
    }
    
    return { valid: true };
  }
}

export const storageService = new StorageService();