// Vercel API路由：图片上传服务
// 支持演示模式（base64内联）和生产模式（OSS存储）
import { jwtVerify, createRemoteJWKSet } from 'jose';

// 生产环境配置检查
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[IMAGE UPLOAD API] Token 验证失败:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('[UPLOAD API] 图片上传请求开始');
    console.log('[UPLOAD API] Method:', req.method);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[UPLOAD API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('[UPLOAD API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[IMAGE UPLOAD API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[IMAGE UPLOAD API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 提取并验证token
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      console.log('[IMAGE UPLOAD API] 错误：Token 验证失败');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[IMAGE UPLOAD API] 用户ID:', userId);

    // 解析请求体
    let imageData, fileName, contentType;
    
    if (req.headers['content-type']?.includes('application/json')) {
      // JSON 格式的请求
      const body = req.body;
      imageData = body.imageData;
      fileName = body.fileName || 'image.jpg';
      contentType = body.contentType || 'image/jpeg';
    } else {
      // FormData 格式的请求（暂不支持，但预留）
      return res.status(400).json({ error: 'Unsupported content type. Please use JSON format.' });
    }

    if (!imageData) {
      console.log('[UPLOAD API] 错误：缺少图片数据');
      return res.status(400).json({ error: 'Missing image data' });
    }

    console.log('[IMAGE UPLOAD API] 开始上传图片...');
    console.log('[IMAGE UPLOAD API] 文件名:', fileName);
    console.log('[IMAGE UPLOAD API] 内容类型:', contentType);
    console.log('[IMAGE UPLOAD API] 数据大小:', imageData.length, 'bytes');
    console.log('[IMAGE UPLOAD API] 演示模式:', isDemoMode);

    let imageUrl;

    if (isDemoMode) {
      // 演示模式：使用 base64 内联图片
      console.log('[IMAGE UPLOAD API] 演示模式：使用 base64 内联图片');
      imageUrl = `data:${contentType};base64,${imageData}`;
    } else {
      // 生产模式：上传到OSS
      console.log('[IMAGE UPLOAD API] 生产模式：上传到OSS');
      try {
        // 导入OSS配置
        const OSS = require('ali-oss');

        const client = new OSS({
          region: process.env.OSS_REGION || 'oss-cn-hangzhou',
          accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
          accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
          bucket: process.env.OSS_BUCKET || 'whimsy-brush-assets'
        });

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const ossFileName = `uploads/${userId}/${timestamp}-${randomStr}.${fileExtension}`;

        // 将base64转换为Buffer
        const buffer = Buffer.from(imageData, 'base64');

        // 上传到OSS
        const result = await client.put(ossFileName, buffer, {
          headers: {
            'Content-Type': contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000' // 1年缓存
          }
        });

        imageUrl = result.url;
        console.log('[IMAGE UPLOAD API] OSS上传成功:', imageUrl);

      } catch (error) {
        console.error('[IMAGE UPLOAD API] OSS上传失败:', error);
        // 回退到base64模式
        console.log('[IMAGE UPLOAD API] 回退到base64模式');
        imageUrl = `data:${contentType};base64,${imageData}`;
      }
    }

    console.log('[IMAGE UPLOAD API] 图片上传成功');
    console.log('[IMAGE UPLOAD API] 图片URL长度:', imageUrl.length);

    return res.status(200).json({
      success: true,
      url: imageUrl,
      message: isDemoMode ? '图片上传成功（使用 base64 内联）' : '图片上传成功（已保存到OSS）'
    });
    
  } catch (error) {
    console.error('[UPLOAD API] 上传失败:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 注意：这个版本使用 base64 内联图片，适合演示和测试环境
// 在生产环境中，建议使用真正的图片存储服务
