// 语言: TypeScript
// 说明: 适配层通用类型定义（保持文件 < 200 行）

export type OIDCDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
};

export type OIDCTokens = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: 'Bearer' | string;
  expires_in?: number;
};

export type AuthSession = {
  tokens: OIDCTokens | null;
  expiresAt?: number; // epoch ms
};

export type STSCredentials = {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  region: string;
  bucket: string;
  expiration: string; // ISO8601
  prefix?: string; // 限定可写路径前缀
};

export type VideoTask = {
  tenantId: string;
  videoId: string;
  userId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  inputImageUrl: string;
  resultVideoUrl?: string;
  params?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

export type CreateVideoRequest = {
  inputImageUrl: string;
  params?: Record<string, unknown>;
};

