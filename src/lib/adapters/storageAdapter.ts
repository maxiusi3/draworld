// 语言: TypeScript
// 说明: 存储适配层：通过后端 FC 获取 STS，前端使用 ali-oss 直传

import type { STSCredentials } from './types';

export interface StorageAdapter {
  getSTSCredentials(): Promise<STSCredentials>;
  // 前端直传在组件中以 ali-oss 客户端完成，此处只定义凭证获取
}

export class OSSStorageAdapter implements StorageAdapter {
  constructor(private cfg: { stsEndpoint: string; getToken: () => Promise<string | null>; }) {}
  async getSTSCredentials(): Promise<STSCredentials> {
    const token = await this.cfg.getToken();
    const res = await fetch(this.cfg.stsEndpoint, {
      method: 'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    if (!res.ok) throw new Error('Failed to get STS credentials');
    return await res.json() as STSCredentials;
  }
}

