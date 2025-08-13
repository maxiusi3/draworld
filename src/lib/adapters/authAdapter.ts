// 语言: TypeScript
// 说明: 认证适配层接口（Authing OIDC），仅定义接口与最小实现骨架

import { AuthSession, OIDCDiscovery, OIDCTokens } from './types';
import { oidcConfig } from './config';

export interface AuthAdapter {
  getDiscovery(): Promise<OIDCDiscovery>;
  buildAuthorizeUrl(params: { redirectUri: string; state?: string; scope?: string; codeChallenge?: string; }): Promise<string>;
  exchangeCode(params: { code: string; redirectUri: string; codeVerifier?: string; }): Promise<OIDCTokens>;
  getSession(): AuthSession | null;
  setSession(tokens: OIDCTokens): void;
  clearSession(): void;
  getIdToken(): string | null;
}

export class AuthingOIDCAdapter implements AuthAdapter {
  // 注意: 运行时参数从环境变量/配置注入
  constructor(private cfg: { clientId: string; clientSecret?: string; discovery: OIDCDiscovery; defaultScope?: string; storage?: Storage; }) {}

  private readStorage(): AuthSession | null {
    try {
      const raw = (this.cfg.storage ?? window.sessionStorage).getItem('auth_session');
      return raw ? JSON.parse(raw) as AuthSession : null;
    } catch { return null; }
  }
  private writeStorage(s: AuthSession | null) {
    const st = (this.cfg.storage ?? window.sessionStorage);
    if (!s) st.removeItem('auth_session'); else st.setItem('auth_session', JSON.stringify(s));
  }

  async getDiscovery(): Promise<OIDCDiscovery> { return this.cfg.discovery; }

  async buildAuthorizeUrl(params: { redirectUri: string; state?: string; scope?: string; codeChallenge?: string; }): Promise<string> {
    const { authorization_endpoint, issuer } = this.cfg.discovery;
    const url = new URL(authorization_endpoint);
    url.searchParams.set('client_id', this.cfg.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', params.scope ?? this.cfg.defaultScope ?? 'openid profile phone');
    if (params.state) url.searchParams.set('state', params.state);
    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    // Authing 支持手机号验证码登录，在授权页完成；这里仅负责跳转
    return url.toString();
  }

  async exchangeCode(params: { code: string; redirectUri: string; codeVerifier?: string; }): Promise<OIDCTokens> {
    // 为安全，推荐前端将 code 发送到后端换 token；此处提供最小直换实现（开发期可用，生产期建议后端代换）
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', params.code);
    body.set('redirect_uri', params.redirectUri);
    body.set('client_id', this.cfg.clientId);
    if (this.cfg.clientSecret) body.set('client_secret', this.cfg.clientSecret);
    if (params.codeVerifier) body.set('code_verifier', params.codeVerifier);

    const res = await fetch(this.cfg.discovery.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!res.ok) throw new Error('Auth token exchange failed');
    const tokens = await res.json() as OIDCTokens;
    this.setSession(tokens);
    return tokens;
  }

  getSession(): AuthSession | null { return this.readStorage(); }
  setSession(tokens: OIDCTokens): void {
    const now = Date.now();
    const expiresAt = tokens.expires_in ? now + tokens.expires_in * 1000 : undefined;
    this.writeStorage({ tokens, expiresAt });
  }
  clearSession(): void { this.writeStorage(null); }
  getIdToken(): string | null { return this.getSession()?.tokens?.id_token ?? null; }
}

export const authAdapter = new AuthingOIDCAdapter({
  clientId: oidcConfig.clientId,
  clientSecret: oidcConfig.clientSecret,
  discovery: oidcConfig.discovery,
  defaultScope: oidcConfig.defaultScope,
});

