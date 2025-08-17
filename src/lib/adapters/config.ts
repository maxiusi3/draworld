import { OIDCDiscovery } from "./types";

// 获取当前环境的回调URL
const getCallbackUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/callback'; // SSR fallback - 更新为3000端口
  }

  const origin = window.location.origin;

  // 支持的域名列表（包含开发环境的不同端口）
  const supportedDomains = [
    'http://localhost:3000',  // Vite开发服务器默认端口
    'http://localhost:5173',  // Vite备用端口
    'http://localhost:4173',  // Vite预览端口
    'https://draworld-prlo8glgv-fangzero-3350s-projects.vercel.app',
    'https://draworld-ixsvc33r2-fangzero-3350s-projects.vercel.app',
    'https://draworld-rhs2s0r6c-fangzero-3350s-projects.vercel.app',
    'https://draworld-56fepi7v6-fangzero-3350s-projects.vercel.app',
    'https://draworld-69vsxk63u-fangzero-3350s-projects.vercel.app',
    'https://draworld-rbh5i9qwt-fangzero-3350s-projects.vercel.app',
    'https://draworld-hmx2jviwf-fangzero-3350s-projects.vercel.app',
    'https://draworld-84jenb64n-fangzero-3350s-projects.vercel.app',
    'https://draworld-hccavjn73-fangzero-3350s-projects.vercel.app',
    'https://draworld-40ab9jct3-fangzero-3350s-projects.vercel.app',
    'https://draworld-cfffzk0ke-fangzero-3350s-projects.vercel.app',
    'https://draworld-byfzm4dkj-fangzero-3350s-projects.vercel.app',
    'https://draworld.vercel.app', // 如果有自定义域名
  ];

  // 检查当前域名是否在支持列表中
  const isSupported = supportedDomains.some(domain => origin.startsWith(domain)) ||
                     origin.includes('draworld') && origin.includes('vercel.app') || // 支持所有draworld的Vercel部署
                     origin.startsWith('http://localhost:'); // 支持所有localhost端口

  console.log(`[OIDC CONFIG] 当前域名: ${origin}`);
  console.log(`[OIDC CONFIG] 是否支持: ${isSupported}`);

  if (!isSupported) {
    console.warn(`[OIDC CONFIG] 当前域名 ${origin} 可能未在Authing中配置，请检查回调URL设置`);
  } else {
    console.log(`[OIDC CONFIG] 当前域名 ${origin} 已在支持列表中`);
  }

  const callbackUrl = `${origin}/callback`;
  console.log(`[OIDC CONFIG] 生成的回调URL: ${callbackUrl}`);

  return callbackUrl;
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
