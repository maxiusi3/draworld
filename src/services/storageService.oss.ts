// 语言: TypeScript
// 说明: 基于 OSS STS 的上传服务（用于替换原 Firebase storageService）

import { storageClient } from '../lib/adapters/client';
import toast from 'react-hot-toast';

export class OSSStorageService {
  async uploadUserImage(file: File, userId: string): Promise<string> {
    try {
      const sts = await storageClient.getSTSCredentials();
      // 动态加载 ali-oss 以减少打包体积
      const OSS = (await import('ali-oss')).default;
      const client = new OSS({
        region: sts.region,
        accessKeyId: sts.accessKeyId,
        accessKeySecret: sts.accessKeySecret,
        stsToken: sts.securityToken,
        bucket: sts.bucket,
        secure: true,
      });
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const objectKey = `${sts.prefix || ''}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const res = await client.put(objectKey, file);
      if (res.res.status !== 200) throw new Error('Upload failed');
      return res.url.replace('http://', 'https://');
    } catch (e) {
      console.error('上传图片失败:', e);
      toast.error('上传图片失败');
      throw e;
    }
  }
}

export const storageServiceOSS = new OSSStorageService();

