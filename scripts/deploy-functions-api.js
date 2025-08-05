#!/usr/bin/env node

/**
 * 使用Firebase REST API直接部署Functions
 * 避开Firebase CLI认证问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const PROJECT_ID = 'draworld-6898f';
const REGION = 'us-central1';

// 从环境变量获取认证信息
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!SERVICE_ACCOUNT) {
  console.error('❌ 缺少FIREBASE_SERVICE_ACCOUNT环境变量');
  process.exit(1);
}

// 解析Service Account
let serviceAccount;
try {
  serviceAccount = JSON.parse(SERVICE_ACCOUNT);
} catch (error) {
  console.error('❌ 无法解析FIREBASE_SERVICE_ACCOUNT JSON:', error.message);
  process.exit(1);
}

/**
 * 获取Google Cloud访问令牌
 */
async function getAccessToken() {
  console.log('🔐 获取Google Cloud访问令牌...');
  
  const jwt = await createJWT();
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!response.ok) {
    throw new Error(`获取访问令牌失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

/**
 * 创建JWT令牌
 */
async function createJWT() {
  const { createSign } = await import('crypto');
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

/**
 * 打包Functions代码
 */
async function packageFunctions() {
  console.log('📦 打包Functions代码...');
  
  const functionsDir = path.join(__dirname, '../functions');
  const zipPath = path.join(__dirname, '../functions.zip');
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`✅ Functions代码已打包: ${archive.pointer()} bytes`);
      resolve(zipPath);
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    
    // 添加lib目录（编译后的代码）
    archive.directory(path.join(functionsDir, 'lib'), 'lib');
    
    // 添加package.json
    archive.file(path.join(functionsDir, 'package.json'), { name: 'package.json' });
    
    archive.finalize();
  });
}

/**
 * 上传Functions代码
 */
async function uploadFunctions(accessToken, zipPath) {
  console.log('⬆️ 上传Functions代码...');
  
  const zipData = fs.readFileSync(zipPath);
  
  const response = await fetch(
    `https://cloudfunctions.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/functions:generateUploadUrl`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`获取上传URL失败: ${response.status} ${response.statusText}`);
  }
  
  const { uploadUrl } = await response.json();
  
  // 上传ZIP文件
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/zip',
      'x-goog-content-length-range': '0,104857600'
    },
    body: zipData
  });
  
  if (!uploadResponse.ok) {
    throw new Error(`上传Functions失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }
  
  console.log('✅ Functions代码上传成功');
  return uploadUrl;
}

/**
 * 部署Functions
 */
async function deployFunctions(accessToken, sourceArchiveUrl) {
  console.log('🚀 部署Functions...');
  
  const functions = [
    'createVideoTask',
    'getUserVideoTasks', 
    'createUserProfile',
    'deleteUserData'
  ];
  
  for (const functionName of functions) {
    console.log(`  部署 ${functionName}...`);
    
    const functionConfig = {
      name: `projects/${PROJECT_ID}/locations/${REGION}/functions/${functionName}`,
      sourceArchiveUrl: sourceArchiveUrl,
      entryPoint: functionName,
      runtime: 'nodejs20',
      httpsTrigger: {},
      environmentVariables: {
        NODE_ENV: 'production'
      }
    };
    
    const response = await fetch(
      `https://cloudfunctions.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/functions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(functionConfig)
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ 部署${functionName}失败:`, error);
      continue;
    }
    
    console.log(`✅ ${functionName} 部署成功`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始使用REST API部署Functions...\n');
    
    // 1. 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 2. 打包Functions代码
    const zipPath = await packageFunctions();
    
    // 3. 上传Functions代码
    const sourceArchiveUrl = await uploadFunctions(accessToken, zipPath);
    
    // 4. 部署Functions
    await deployFunctions(accessToken, sourceArchiveUrl);
    
    // 5. 清理临时文件
    fs.unlinkSync(zipPath);
    
    console.log('\n✅ Functions部署完成！');
    console.log('\n📋 测试端点:');
    console.log(`- https://${REGION}-${PROJECT_ID}.cloudfunctions.net/createVideoTask`);
    console.log(`- https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getUserVideoTasks`);
    console.log(`- https://${REGION}-${PROJECT_ID}.cloudfunctions.net/createUserProfile`);
    console.log(`- https://${REGION}-${PROJECT_ID}.cloudfunctions.net/deleteUserData`);
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 运行部署
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
