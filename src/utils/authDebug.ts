// 语言: TypeScript
// 说明: 认证调试工具

export class AuthDebugger {
  private static isDebugEnabled(): boolean {
    return (import.meta as any).env?.VITE_DEBUG_AUTH === 'true' || 
           localStorage.getItem('debug_auth') === 'true';
  }

  static log(message: string, data?: any) {
    if (this.isDebugEnabled()) {
      console.log(`[AUTH DEBUG] ${message}`, data || '');
    }
  }

  static error(message: string, error?: any) {
    if (this.isDebugEnabled()) {
      console.error(`[AUTH ERROR] ${message}`, error || '');
    }
  }

  static checkEnvironment() {
    const info = {
      currentUrl: window.location.href,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      localStorage: {
        authSession: localStorage.getItem('auth_session'),
        debugAuth: localStorage.getItem('debug_auth'),
      },
      sessionStorage: {
        authSession: sessionStorage.getItem('auth_session'),
      },
      environment: {
        isDevelopment: (import.meta as any).env?.DEV,
        isProduction: (import.meta as any).env?.PROD,
        apiBaseUrl: (import.meta as any).env?.VITE_API_BASE_URL,
        callbackUrl: (import.meta as any).env?.VITE_CALLBACK_URL,
      }
    };

    this.log('环境检查', info);
    return info;
  }

  static validateCallbackUrl(expectedUrl: string, actualUrl: string) {
    const isValid = expectedUrl === actualUrl;
    this.log(`回调URL验证: ${isValid ? '✅ 匹配' : '❌ 不匹配'}`, {
      expected: expectedUrl,
      actual: actualUrl,
      isValid
    });
    return isValid;
  }

  static logAuthFlow(step: string, data?: any) {
    this.log(`认证流程 - ${step}`, data);
  }

  static enableDebug() {
    localStorage.setItem('debug_auth', 'true');
    console.log('🔍 认证调试模式已启用');
  }

  static disableDebug() {
    localStorage.removeItem('debug_auth');
    console.log('🔍 认证调试模式已禁用');
  }

  static getAuthingConfig() {
    const config = {
      clientId: '689adde75ecb97cd396860eb',
      domain: 'https://draworld.authing.cn/oidc',
      endpoints: {
        authorization: 'https://draworld.authing.cn/oidc/auth',
        token: 'https://draworld.authing.cn/oidc/token',
        userinfo: 'https://draworld.authing.cn/oidc/me',
        jwks: 'https://draworld.authing.cn/oidc/.well-known/jwks.json',
      }
    };

    this.log('Authing配置', config);
    return config;
  }

  static async testAuthingEndpoints() {
    const config = this.getAuthingConfig();
    const results: Record<string, any> = {};

    for (const [name, url] of Object.entries(config.endpoints)) {
      try {
        const response = await fetch(url, { method: 'GET' });
        results[name] = {
          url,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        results[name] = {
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    this.log('Authing端点测试结果', results);
    return results;
  }
}

// 全局调试函数
if (typeof window !== 'undefined') {
  (window as any).authDebug = AuthDebugger;
  console.log('🔍 认证调试工具已加载，使用 authDebug.enableDebug() 启用调试模式');
}
