import { OIDCDiscovery } from "./types";

// 获取当前环境的回调URL
const getCallbackUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5173/callback'; // SSR fallback
  }

  const origin = window.location.origin;

  // 支持的域名列表
  const supportedDomains = [
    'http://localhost:5173',
    'https://draworld-prlo8glgv-fangzero-3350s-projects.vercel.app',
    'https://draworld.vercel.app', // 如果有自定义域名
  ];

  // 检查当前域名是否在支持列表中
  const isSupported = supportedDomains.some(domain => origin.startsWith(domain));

  if (!isSupported) {
    console.warn(`当前域名 ${origin} 可能未在Authing中配置，请检查回调URL设置`);
  }

  return `${origin}/callback`;
};

// 说明：基于 Authing 配置的 OIDC 信息，支持多环境动态回调URL
export const oidcConfig = {
  clientId: '689adde75ecb97cd396860eb',
  // 注意：生产环境不应在前端使用 clientSecret；本项目当前阶段用于本地直换 token
  clientSecret: '200d21d51aa1b7dffadece15fa3c269b',
  discovery: {
    issuer: 'https://draworld.authing.cn/oidc',
    authorization_endpoint: 'https://draworld.authing.cn/oidc/auth',
    token_endpoint: 'https://draworld.authing.cn/oidc/token',
    userinfo_endpoint: 'https://draworld.authing.cn/oidc/me',
    jwks_uri: 'https://draworld.authing.cn/oidc/.well-known/jwks.json',
  } as OIDCDiscovery,
  defaultScope: 'openid profile phone',
  getCallbackUrl,
};
