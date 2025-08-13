/**
 * 测试图片 URL 的可访问性
 */

import fetch from 'node-fetch';

const FAILED_IMAGE_URL = 'https://storage.googleapis.com/draworld-6898f.appspot.com/users/ewtqQvbLz9Vh7LMz320t2x2GgyN2/images/1754832287240_WechatIMG3794.jpg';

async function testImageAccess() {
  console.log('🧪 测试图片 URL 可访问性...');
  console.log('URL:', FAILED_IMAGE_URL);
  
  try {
    const response = await fetch(FAILED_IMAGE_URL, {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ 图片可以访问');
    } else {
      console.log('❌ 图片不可访问');
      
      if (response.status === 403) {
        console.log('💡 403 错误：权限不足，图片可能不是公开的');
      } else if (response.status === 404) {
        console.log('💡 404 错误：图片不存在');
      }
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS 解析失败');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 连接被拒绝');
    } else if (error.code === 'ECONNRESET') {
      console.log('💡 连接被重置 - 这与通义万相遇到的错误相同');
    }
  }
}

async function testWithCurl() {
  console.log('\n🔧 使用 curl 测试...');
  
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-I', FAILED_IMAGE_URL]);
    
    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      console.log('curl 退出码:', code);
      console.log('curl 输出:', output);
      resolve();
    });
    
    setTimeout(() => {
      curl.kill();
      console.log('curl 超时');
      resolve();
    }, 10000);
  });
}

async function runTests() {
  await testImageAccess();
  await testWithCurl();
  
  console.log('\n📋 解决方案:');
  console.log('1. 确保图片文件设置为公开访问');
  console.log('2. 或者使用 Firebase Storage 的公开 URL');
  console.log('3. 或者将图片上传到其他公开的图片托管服务');
}

runTests().catch(console.error);
