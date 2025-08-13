// 语言: TypeScript
// 说明: 后端 API 适配层（FC + API 网关）

import type { CreateVideoRequest, VideoTask } from './types';

export interface FunctionsAdapter {
  createVideo(req: CreateVideoRequest): Promise<{ taskId: string }>;
  getVideoStatus(taskId: string): Promise<VideoTask>;
}

export class HttpFunctionsAdapter implements FunctionsAdapter {
  constructor(private cfg: { baseUrl: string; getToken: () => Promise<string | null>; }) {}

  private async request(path: string, init?: RequestInit) {
    const token = await this.cfg.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.cfg.baseUrl}${path}`, { ...init, headers: { ...headers, ...(init?.headers as any) } });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    return res.json();
  }

  async createVideo(req: CreateVideoRequest): Promise<{ taskId: string }> {
    return this.request('/api/video/start', { method: 'POST', body: JSON.stringify(req) });
  }
  async getVideoStatus(taskId: string): Promise<VideoTask> {
    return this.request(`/api/video/status?taskId=${encodeURIComponent(taskId)}`);
  }
}

