#!/usr/bin/env node

/**
 * 部署状态检查脚本
 * 检查Firebase Functions和Firestore是否正常工作
 */

import https from 'https';

// 配置
const PROJECT_ID = 'draworld-6898f';
const FUNCTIONS_BASE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;

// 检查Functions是否部署
async function checkFunctions() {
  console.log('🔍 检查Firebase Functions状态...');
  
  const functions = [
    'createVideoTask',
    'getUserVideoTasks',
    'createUserProfile',
    'deleteUserData'
  ];
  
  for (const funcName of functions) {
    try {
      const url = `${FUNCTIONS_BASE_URL}/${funcName}`;
      console.log(`  检查 ${funcName}...`);
      
      // 简单的HTTP请求检查函数是否存在
      const response = await makeRequest(url, 'POST', {});
      
      if (response.includes('unauthenticated') || response.includes('UNAUTHENTICATED')) {
        console.log(`  ✅ ${funcName} - 已部署 (需要认证)`);
      } else if (response.includes('internal') || response.includes('INTERNAL')) {
        console.log(`  ⚠️  ${funcName} - 已部署但可能有内部错误`);
      } else {
        console.log(`  ❓ ${funcName} - 状态未知: ${response.substring(0, 100)}...`);
      }
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`  ❌ ${funcName} - 未部署`);
      } else {
        console.log(`  ⚠️  ${funcName} - 检查失败: ${error.message}`);
      }
    }
  }
}

// 检查Firestore规则
async function checkFirestore() {
  console.log('\n🔍 检查Firestore状态...');
  console.log('  ℹ️  Firestore规则检查需要在浏览器中进行');
  console.log('  ℹ️  请访问应用并尝试登录来测试Firestore连接');
}

// 发起HTTP请求
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeploymentChecker/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🚀 开始检查部署状态...\n');
  
  try {
    await checkFunctions();
    await checkFirestore();
    
    console.log('\n✅ 部署状态检查完成！');
    console.log('\n📋 下一步测试建议:');
    console.log('1. 访问 https://draworld-6898f.web.app');
    console.log('2. 尝试用户注册/登录');
    console.log('3. 上传图片并创建视频任务');
    console.log('4. 检查"我的作品"页面');
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行检查
main();
