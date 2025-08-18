// 语言: TypeScript
// 说明: JWT token 解析工具

export interface JWTPayload {
  sub: string; // 用户ID
  email?: string; // 邮箱
  phone_number?: string; // 手机号
  name?: string; // 姓名
  nickname?: string; // 昵称
  picture?: string; // 头像
  iss: string; // 签发者
  aud: string; // 受众
  exp: number; // 过期时间
  iat: number; // 签发时间
  [key: string]: any; // 其他字段
}

/**
 * 解析JWT token的payload部分（不验证签名）
 * 注意：这个函数只用于提取用户信息显示，不用于安全验证
 * 安全验证应该在服务端进行
 */
export function parseJWTPayload(token: string): JWTPayload | null {
  try {
    // JWT token 格式: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[JWT] Invalid token format');
      return null;
    }

    // 解码 payload 部分（Base64URL）
    const payload = parts[1];
    // 处理 Base64URL 编码（替换字符并添加填充）
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as JWTPayload;

    console.log('[JWT] Token payload parsed:', {
      sub: parsed.sub,
      email: parsed.email,
      phone_number: parsed.phone_number,
      name: parsed.name,
      nickname: parsed.nickname,
      exp: parsed.exp,
      iat: parsed.iat
    });

    return parsed;
  } catch (error) {
    console.error('[JWT] Failed to parse token payload:', error);
    return null;
  }
}

/**
 * 检查JWT token是否过期
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) {
    return false; // 如果没有过期时间，认为未过期
  }
  
  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
}

/**
 * 从JWT payload中提取用户显示信息
 */
export function extractUserInfo(payload: JWTPayload) {
  // 优先使用手机号作为显示名称，其次是昵称、姓名、邮箱
  let displayName = '用户';
  let email = payload.email || '';

  if (payload.phone_number) {
    displayName = payload.phone_number;
    // 如果没有邮箱但有手机号，可以生成一个临时邮箱格式用于显示
    if (!email) {
      email = `${payload.phone_number}@phone.user`;
    }
  } else if (payload.nickname) {
    displayName = payload.nickname;
  } else if (payload.name) {
    displayName = payload.name;
  } else if (payload.email) {
    displayName = payload.email.split('@')[0]; // 使用邮箱用户名部分
  }

  return {
    uid: payload.sub,
    email: email,
    displayName: displayName,
    photoURL: payload.picture || '',
    phone: payload.phone_number || '',
    metadata: {
      creationTime: new Date(payload.iat * 1000).toISOString(),
      lastSignInTime: new Date().toISOString()
    }
  };
}
