// 语言: TypeScript
// 说明: 认证适配层接口（Authing OIDC），仅定义接口与最小实现骨架

import { AuthSession, OIDCDiscovery, OIDCTokens } from './types';
import { oidcConfig } from './config';

export interface AuthAdapter {
  getDiscovery(): Promise<OIDCDiscovery>;
  buildAuthorizeUrl(params: { redirectUri: string; state?: string; scope?: string; codeChallenge?: string; }): Promise<string>;
  buildAuthUrl(params: { redirectUri: string; state?: string; scope?: string; codeChallenge?: string; }): Promise<string>; // 别名方法
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
      const raw = (this.cfg.storage ?? window.localStorage).getItem('auth_session');
      return raw ? JSON.parse(raw) as AuthSession : null;
    } catch { return null; }
  }
  private writeStorage(s: AuthSession | null) {
    const st = (this.cfg.storage ?? window.localStorage);
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

    // 强制手机号验证码登录的参数
    url.searchParams.set('prompt', 'login'); // 强制重新登录
    url.searchParams.set('login_hint', 'phone'); // 提示使用手机号登录

    // 生成随机state防止CSRF攻击
    if (!params.state) {
      params.state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    url.searchParams.set('state', params.state);

    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }

    console.log('[AUTH ADAPTER] 构建授权URL，强制手机号验证码登录');
    console.log('[AUTH ADAPTER] 授权URL参数:', {
      client_id: this.cfg.clientId,
      redirect_uri: params.redirectUri,
      response_type: 'code',
      scope: params.scope ?? this.cfg.defaultScope ?? 'openid profile phone',
      prompt: 'login',
      login_hint: 'phone',
      state: params.state
    });

    return url.toString();
  }

  // 别名方法，用于向后兼容
  async buildAuthUrl(params: { redirectUri: string; state?: string; scope?: string; codeChallenge?: string; }): Promise<string> {
    return this.buildAuthorizeUrl(params);
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

    console.log('[AUTH DEBUG] Token exchange request:', {
      endpoint: this.cfg.discovery.token_endpoint,
      redirectUri: params.redirectUri,
      clientId: this.cfg.clientId,
      hasClientSecret: !!this.cfg.clientSecret,
      hasCodeVerifier: !!params.codeVerifier,
      code: params.code.substring(0, 10) + '...' // 只显示前10个字符用于调试
    });

    // 打印完整的请求体用于调试（生产环境应移除）
    console.log('[AUTH DEBUG] Request body parameters:', {
      grant_type: 'authorization_code',
      code: params.code.substring(0, 10) + '...',
      redirect_uri: params.redirectUri,
      client_id: this.cfg.clientId,
      has_client_secret: !!this.cfg.clientSecret,
      has_code_verifier: !!params.codeVerifier
    });

    const res = await fetch(this.cfg.discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[AUTH DEBUG] Token exchange failed:', {
        status: res.status,
        statusText: res.statusText,
        error: errorText,
        requestDetails: {
          endpoint: this.cfg.discovery.token_endpoint,
          redirectUri: params.redirectUri,
          clientId: this.cfg.clientId
        }
      });
      throw new Error(`Auth token exchange failed: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const tokens = await res.json() as OIDCTokens;
    console.log('[AUTH DEBUG] Token exchange successful');
    this.setSession(tokens);
    return tokens;
  }

  getSession(): AuthSession | null {
    const session = this.readStorage();
    console.log('[AUTH ADAPTER] getSession() 返回:', session);
    return session;
  }
  setSession(tokens: OIDCTokens): void {
    console.log('[AUTH ADAPTER] setSession() 调用，tokens:', tokens);
    const now = Date.now();
    const expiresAt = tokens.expires_in ? now + tokens.expires_in * 1000 : undefined;
    const session = { tokens, expiresAt };
    console.log('[AUTH ADAPTER] 准备写入会话:', session);
    this.writeStorage(session);
    console.log('[AUTH ADAPTER] 会话写入完成');

    // 验证写入是否成功
    const verifySession = this.readStorage();
    console.log('[AUTH ADAPTER] 验证写入结果:', verifySession);
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

