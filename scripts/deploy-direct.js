#!/usr/bin/env node

/**
 * 直接使用Google Cloud Functions API部署
 * 完全绕过Firebase CLI
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 配置
const PROJECT_ID = 'draworld-6898f';
const REGION = 'us-central1';

console.log('🚀 开始直接部署Functions...\n');

// 1. 确保Functions已构建
console.log('📦 构建Functions...');
try {
  execSync('cd functions && npm install && npm run build', { stdio: 'inherit' });
  console.log('✅ Functions构建成功\n');
} catch (error) {
  console.error('❌ Functions构建失败:', error.message);
  process.exit(1);
}

// 2. 使用gcloud直接部署每个函数
const functions = [
  {
    name: 'createVideoTask',
    entry: 'createVideoTask',
    trigger: '--trigger-http --allow-unauthenticated'
  },
  {
    name: 'getUserVideoTasks', 
    entry: 'getUserVideoTasks',
    trigger: '--trigger-http --allow-unauthenticated'
  },
  {
    name: 'createUserProfile',
    entry: 'createUserProfile', 
    trigger: '--trigger-http --allow-unauthenticated'
  },
  {
    name: 'deleteUserData',
    entry: 'deleteUserData',
    trigger: '--trigger-http --allow-unauthenticated'
  }
];

console.log('🚀 部署Functions到Google Cloud...\n');

for (const func of functions) {
  console.log(`📤 部署 ${func.name}...`);
  
  try {
    const command = `gcloud functions deploy ${func.name} ` +
      `--source=functions ` +
      `--entry-point=${func.entry} ` +
      `--runtime=nodejs20 ` +
      `--region=${REGION} ` +
      `--project=${PROJECT_ID} ` +
      `${func.trigger} ` +
      `--quiet`;
    
    console.log(`执行命令: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${func.name} 部署成功\n`);
    
  } catch (error) {
    console.error(`❌ ${func.name} 部署失败:`, error.message);
    // 继续部署其他函数
  }
}

// 3. 测试部署的函数
console.log('🧪 测试部署的Functions...\n');

for (const func of functions) {
  const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${func.name}`;
  console.log(`🔗 ${func.name}: ${url}`);
  
  try {
    // 简单的HTTP测试
    execSync(`curl -X POST "${url}" -H "Content-Type: application/json" -d '{}' --max-time 5 --fail`, 
      { stdio: 'pipe' });
    console.log(`✅ ${func.name} 响应正常`);
  } catch (error) {
    console.log(`⚠️  ${func.name} 可能需要认证或有其他问题`);
  }
}

console.log('\n🎉 Functions部署完成！');
console.log('\n📋 可用端点:');
functions.forEach(func => {
  console.log(`- https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${func.name}`);
});

console.log('\n💡 提示:');
console.log('- 如果函数需要认证，请确保前端正确传递认证信息');
console.log('- 可以在Google Cloud Console中查看函数日志');
console.log('- 如果部署失败，请检查gcloud认证和权限设置');
