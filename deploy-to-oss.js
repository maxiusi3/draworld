#!/usr/bin/env node

/**
 * 部署静态网站到阿里云OSS
 */

import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OSS配置 - 使用环境变量保护敏感信息
const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || (() => {
    console.error('❌ 请设置环境变量 OSS_ACCESS_KEY_ID');
    process.exit(1);
  })(),
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || (() => {
    console.error('❌ 请设置环境变量 OSS_ACCESS_KEY_SECRET');
    process.exit(1);
  })(),
  bucket: 'draworld2' // 静态网站bucket
});

// 获取文件的MIME类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 递归上传目录
async function uploadDirectory(localDir, ossPrefix = '') {
  const files = fs.readdirSync(localDir);
  const uploadPromises = [];

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      // 递归处理子目录
      const subPromises = await uploadDirectory(localPath, path.join(ossPrefix, file));
      uploadPromises.push(...subPromises);
    } else {
      // 上传文件
      const ossKey = path.join(ossPrefix, file).replace(/\\/g, '/');
      const mimeType = getMimeType(localPath);
      
      const uploadPromise = client.put(ossKey, localPath, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000'
        }
      }).then(() => {
        console.log(`✅ 上传成功: ${ossKey}`);
      }).catch(error => {
        console.error(`❌ 上传失败 ${ossKey}:`, error.message);
        throw error;
      });

      uploadPromises.push(uploadPromise);
    }
  }

  return uploadPromises;
}

// 主部署函数
async function deploy() {
  console.log('🚀 开始部署到阿里云OSS...\n');

  const distPath = path.join(__dirname, 'dist');
  
  // 检查dist目录是否存在
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  try {
    // 上传所有文件
    console.log('📤 上传文件到OSS...');
    const uploadPromises = await uploadDirectory(distPath);
    await Promise.all(uploadPromises);

    console.log('\n✅ 所有文件上传完成！');
    console.log('\n🌐 静态网站URL:');
    console.log(`https://draworld2-135c17a2.oss-website-cn-hangzhou.aliyuncs.com/`);
    
    console.log('\n💡 提示:');
    console.log('- 如果网站显示空白，请检查浏览器控制台是否有错误');
    console.log('- 可能需要等待几分钟让CDN缓存更新');
    console.log('- 确保OSS bucket已配置静态网站托管');

  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 运行部署
deploy().catch(console.error);
