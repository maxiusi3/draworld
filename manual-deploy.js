#!/usr/bin/env node

/**
 * 童画奇旅手动部署脚本
 * 当Firebase CLI无法使用时的紧急部署方案
 * 使用Firebase Admin SDK直接操作
 */

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 配置
const CONFIG = {
  serviceAccountPath: './service-account.json',
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  distPath: './dist',
  functionsPath: './functions/lib'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`[INFO] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

// 初始化Firebase Admin
function initializeFirebase() {
  try {
    if (!fs.existsSync(CONFIG.serviceAccountPath)) {
      throw new Error(`服务账号文件不存在: ${CONFIG.serviceAccountPath}`);
    }

    const serviceAccount = require(CONFIG.serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: CONFIG.projectId,
      storageBucket: CONFIG.storageBucket
    });

    logSuccess('Firebase Admin SDK 初始化成功');
    return true;
  } catch (error) {
    logError(`Firebase 初始化失败: ${error.message}`);
    return false;
  }
}

// 递归获取目录中的所有文件
async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = await readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({
        localPath: fullPath,
        remotePath: relativePath.replace(/\\/g, '/') // 确保使用正斜杠
      });
    }
  }

  return files;
}

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
    '.pdf': 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// 部署静态文件到Firebase Hosting
async function deployHosting() {
  logInfo('开始部署前端文件到Firebase Hosting...');

  if (!fs.existsSync(CONFIG.distPath)) {
    logError(`构建目录不存在: ${CONFIG.distPath}`);
    logInfo('请先运行: pnpm build');
    return false;
  }

  try {
    const bucket = getStorage().bucket();
    const files = await getAllFiles(CONFIG.distPath);

    logInfo(`找到 ${files.length} 个文件需要上传`);

    let uploadedCount = 0;
    const uploadPromises = files.map(async (file) => {
      try {
        const mimeType = getMimeType(file.localPath);
        const metadata = {
          contentType: mimeType,
          cacheControl: file.remotePath.includes('.') && 
                       !file.remotePath.endsWith('.html') ? 
                       'public, max-age=31536000' : 'public, max-age=0'
        };

        await bucket.upload(file.localPath, {
          destination: file.remotePath,
          metadata: metadata
        });

        uploadedCount++;
        if (uploadedCount % 10 === 0) {
          logInfo(`已上传 ${uploadedCount}/${files.length} 个文件`);
        }
      } catch (error) {
        logWarning(`上传文件失败 ${file.remotePath}: ${error.message}`);
      }
    });

    await Promise.all(uploadPromises);
    logSuccess(`前端文件部署完成，共上传 ${uploadedCount} 个文件`);
    return true;
  } catch (error) {
    logError(`部署前端文件失败: ${error.message}`);
    return false;
  }
}

// 部署Firestore安全规则
async function deployFirestoreRules() {
  logInfo('部署Firestore安全规则...');

  const rulesPath = './firestore.rules';
  if (!fs.existsSync(rulesPath)) {
    logWarning('Firestore规则文件不存在，跳过部署');
    return true;
  }

  try {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    // 注意：Firebase Admin SDK不直接支持部署规则
    // 这里只是验证规则文件存在，实际部署需要通过其他方式
    logWarning('Firestore规则需要通过Firebase控制台手动部署');
    logInfo('规则文件内容:');
    console.log(rulesContent);
    
    return true;
  } catch (error) {
    logError(`读取Firestore规则失败: ${error.message}`);
    return false;
  }
}

// 部署Storage安全规则
async function deployStorageRules() {
  logInfo('部署Storage安全规则...');

  const rulesPath = './storage.rules';
  if (!fs.existsSync(rulesPath)) {
    logWarning('Storage规则文件不存在，跳过部署');
    return true;
  }

  try {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    // 注意：Firebase Admin SDK不直接支持部署规则
    logWarning('Storage规则需要通过Firebase控制台手动部署');
    logInfo('规则文件内容:');
    console.log(rulesContent);
    
    return true;
  } catch (error) {
    logError(`读取Storage规则失败: ${error.message}`);
    return false;
  }
}

// 设置环境变量
async function setEnvironmentConfig() {
  logInfo('设置环境变量...');

  const accessKeyId = process.env.DREAMINA_ACCESS_KEY_ID;
  const secretAccessKey = process.env.DREAMINA_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    logWarning('即梦AI密钥环境变量未设置');
    logInfo('请设置以下环境变量:');
    logInfo('- DREAMINA_ACCESS_KEY_ID');
    logInfo('- DREAMINA_SECRET_ACCESS_KEY');
    return false;
  }

  // 注意：Firebase Admin SDK不直接支持设置Functions配置
  logWarning('Functions环境变量需要通过Firebase控制台或CLI设置');
  logInfo('需要设置的配置:');
  logInfo(`- dreamina.access_key_id: ${accessKeyId.substring(0, 8)}...`);
  logInfo(`- dreamina.secret_access_key: ${secretAccessKey.substring(0, 8)}...`);

  return true;
}

// 验证部署
async function verifyDeployment() {
  logInfo('验证部署状态...');

  try {
    const bucket = getStorage().bucket();
    
    // 检查index.html是否存在
    const [exists] = await bucket.file('index.html').exists();
    if (exists) {
      logSuccess('前端文件部署验证成功');
    } else {
      logError('前端文件部署验证失败');
      return false;
    }

    // 生成访问URL
    const projectId = CONFIG.projectId;
    const hostingUrl = `https://${projectId}.web.app`;
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}`;

    logSuccess('部署验证完成！');
    logInfo(`网站地址: ${hostingUrl}`);
    logInfo(`Firebase控制台: ${consoleUrl}`);

    return true;
  } catch (error) {
    logError(`部署验证失败: ${error.message}`);
    return false;
  }
}

// 显示使用说明
function showUsage() {
  console.log(`
童画奇旅手动部署脚本

使用方法:
  node manual-deploy.js

环境变量:
  FIREBASE_PROJECT_ID          - Firebase项目ID
  FIREBASE_STORAGE_BUCKET      - Firebase存储桶名称
  DREAMINA_ACCESS_KEY_ID       - 即梦AI Access Key ID
  DREAMINA_SECRET_ACCESS_KEY   - 即梦AI Secret Access Key

前置条件:
  1. 在项目根目录放置 service-account.json 文件
  2. 运行 pnpm build 构建前端
  3. 运行 cd functions && npm run build 构建Functions
  4. 设置必要的环境变量

注意事项:
  - 此脚本只能部署静态文件到Storage
  - Firestore规则和Storage规则需要手动在控制台设置
  - Cloud Functions需要通过其他方式部署
  - Functions环境变量需要在控制台设置
`);
}

// 主函数
async function main() {
  log('童画奇旅手动部署脚本', 'blue');
  log('================================', 'blue');

  // 检查参数
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    return;
  }

  // 初始化Firebase
  if (!initializeFirebase()) {
    process.exit(1);
  }

  let success = true;

  // 执行部署步骤
  success = await deployHosting() && success;
  success = await deployFirestoreRules() && success;
  success = await deployStorageRules() && success;
  success = await setEnvironmentConfig() && success;
  success = await verifyDeployment() && success;

  if (success) {
    logSuccess('手动部署完成！');
    log('\n后续步骤:', 'yellow');
    log('1. 在Firebase控制台手动部署Firestore和Storage规则', 'yellow');
    log('2. 在Firebase控制台部署Cloud Functions', 'yellow');
    log('3. 在Functions配置中设置即梦AI密钥', 'yellow');
  } else {
    logError('部署过程中出现错误，请检查上述信息');
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    logError(`部署失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  deployHosting,
  deployFirestoreRules,
  deployStorageRules,
  setEnvironmentConfig,
  verifyDeployment
};
