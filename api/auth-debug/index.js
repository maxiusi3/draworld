// Auth Debug API - 用于调试JWT token验证问题
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Authing OIDC 配置
const OIDC_JWKS_URI = 'https://draworld.authing.cn/oidc/.well-known/jwks.json';
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';

// 创建 JWKS 客户端
const jwks = createRemoteJWKSet(new URL(OIDC_JWKS_URI));

export default async function handler(req, res) {
  try {
    console.log('[AUTH DEBUG] 请求接收');
    console.log('[AUTH DEBUG] Method:', req.method);
    console.log('[AUTH DEBUG] Headers:', JSON.stringify(req.headers, null, 2));

    // 检查Authorization header
    const authHeader = req.headers.authorization;
    console.log('[AUTH DEBUG] Authorization header:', authHeader ? 'present' : 'missing');

    if (!authHeader) {
      return res.status(400).json({
        error: 'Missing authorization header',
        debug: {
          headers: req.headers,
          expectedFormat: 'Bearer <token>'
        }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        error: 'Invalid authorization header format',
        debug: {
          received: authHeader.substring(0, 20) + '...',
          expectedFormat: 'Bearer <token>'
        }
      });
    }

    const token = authHeader.substring(7);
    console.log('[AUTH DEBUG] Token extracted, length:', token.length);
    console.log('[AUTH DEBUG] Token preview:', token.substring(0, 50) + '...');

    // 解析token结构（不验证签名）
    let tokenStructure = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        tokenStructure = {
          header,
          payload: {
            iss: payload.iss,
            aud: payload.aud,
            sub: payload.sub,
            exp: payload.exp,
            iat: payload.iat,
            phone_number: payload.phone_number,
            email: payload.email,
            name: payload.name
          },
          isExpired: Date.now() > payload.exp * 1000,
          expiresAt: new Date(payload.exp * 1000).toISOString()
        };
      }
    } catch (parseError) {
      console.error('[AUTH DEBUG] Token parsing error:', parseError);
      tokenStructure = { error: parseError.message };
    }

    // 验证配置
    const config = {
      OIDC_JWKS_URI,
      OIDC_ISSUER,
      OIDC_AUDIENCE,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        AUTHING_OIDC_ISSUER: process.env.AUTHING_OIDC_ISSUER,
        AUTHING_OIDC_AUDIENCE: process.env.AUTHING_OIDC_AUDIENCE
      }
    };

    console.log('[AUTH DEBUG] Configuration:', config);

    // 尝试验证JWT
    let verificationResult = null;
    try {
      console.log('[AUTH DEBUG] 开始验证JWT token');
      console.log('[AUTH DEBUG] 使用issuer:', OIDC_ISSUER);
      console.log('[AUTH DEBUG] 使用audience:', OIDC_AUDIENCE);

      const { payload } = await jwtVerify(token, jwks, {
        issuer: OIDC_ISSUER,
        audience: OIDC_AUDIENCE,
      });

      console.log('[AUTH DEBUG] JWT验证成功');
      console.log('[AUTH DEBUG] Payload:', JSON.stringify(payload, null, 2));

      verificationResult = {
        success: true,
        payload: {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat,
          phone_number: payload.phone_number,
          email: payload.email,
          name: payload.name
        }
      };

    } catch (verifyError) {
      console.error('[AUTH DEBUG] JWT验证失败:', verifyError);
      verificationResult = {
        success: false,
        error: verifyError.message,
        code: verifyError.code,
        claim: verifyError.claim
      };
    }

    // 测试JWKS端点可访问性
    let jwksTest = null;
    try {
      const jwksResponse = await fetch(OIDC_JWKS_URI);
      jwksTest = {
        accessible: jwksResponse.ok,
        status: jwksResponse.status,
        statusText: jwksResponse.statusText
      };
      
      if (jwksResponse.ok) {
        const jwksData = await jwksResponse.json();
        jwksTest.keysCount = jwksData.keys ? jwksData.keys.length : 0;
      }
    } catch (jwksError) {
      jwksTest = {
        accessible: false,
        error: jwksError.message
      };
    }

    return res.status(200).json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        config,
        tokenStructure,
        verificationResult,
        jwksTest,
        summary: {
          tokenPresent: !!token,
          tokenValid: verificationResult?.success || false,
          jwksAccessible: jwksTest?.accessible || false,
          configurationOk: !!(OIDC_ISSUER && OIDC_AUDIENCE && OIDC_JWKS_URI)
        }
      }
    });

  } catch (error) {
    console.error('[AUTH DEBUG] 处理请求失败:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
