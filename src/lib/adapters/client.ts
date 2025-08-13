// 语言: TypeScript
// 说明: 适配器单例客户端：提供获取 Token、函数 API 客户端与存储 STS 客户端

import { HttpFunctionsAdapter } from './functionsAdapter';
import { OSSStorageAdapter } from './storageAdapter';
import { authAdapter } from './authAdapter';

const API_BASE_URL = (typeof window !== 'undefined')
  ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
  : '';

export const functionsClient = new HttpFunctionsAdapter({
  baseUrl: API_BASE_URL,
  getToken: async () => authAdapter.getIdToken(),
});

export const storageClient = new OSSStorageAdapter({
  stsEndpoint: `${API_BASE_URL}/api/oss/sts`,
  getToken: async () => authAdapter.getIdToken(),
});

