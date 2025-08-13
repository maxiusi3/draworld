import { OIDCDiscovery } from "./types";

// 说明：基于 Authing 配置的 OIDC 信息（单环境：本地回调 http://localhost:5173/callback）
export const oidcConfig = {
  clientId: '689adde75ecb97cd396860eb',
  // 注意：生产环境不应在前端使用 clientSecret；本项目当前阶段用于本地直换 token
  clientSecret: '200d21d51aa1b7dffadece15fa3c269b',
  discovery: {
    issuer: 'https://draworld.authing.cn/oidc',
    authorization_endpoint: 'https://draworld.authing.cn/oidc/auth',
    token_endpoint: 'https://draworld.authing.cn/oidc/token',
    jwks_uri: 'https://draworld.authing.cn/oidc/.well-known/jwks.json',
  } as OIDCDiscovery,
  defaultScope: 'openid profile phone',
};