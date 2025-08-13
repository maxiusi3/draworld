/**
 * 测试临时公开图片的访问性
 */

import fetch from 'node-fetch';

const TEMP_PUBLIC_IMAGE_URL = 'https://storage.googleapis.com/draworld-6898f.firebasestorage.app/temp-public/1754888979951_89h61f.jpg';

async function testImageAccess() {
  console.log('🧪 测试临时公开图片访问性...');
  console.log('URL:', TEMP_PUBLIC_IMAGE_URL);
  
  try {
    // 测试 HEAD 请求
    console.log('\n📋 测试 HEAD 请求...');
    const headResponse = await fetch(TEMP_PUBLIC_IMAGE_URL, {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log('HEAD 响应状态:', headResponse.status);
    console.log('HEAD 响应头:', Object.fromEntries(headResponse.headers.entries()));
    
    if (headResponse.ok) {
      console.log('✅ HEAD 请求成功');
    } else {
      console.log('❌ HEAD 请求失败');
    }
    
    // 测试 GET 请求
    console.log('\n📋 测试 GET 请求...');
    const getResponse = await fetch(TEMP_PUBLIC_IMAGE_URL, {
      method: 'GET',
      timeout: 10000
    });
    
    console.log('GET 响应状态:', getResponse.status);
    console.log('GET 响应头:', Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.ok) {
      const buffer = await getResponse.buffer();
      console.log('✅ GET 请求成功，图片大小:', buffer.length, 'bytes');
      
      // 验证是否为有效图片
      if (buffer.length > 0) {
        const header = buffer.slice(0, 4);
        if (header[0] === 0xFF && header[1] === 0xD8) {
          console.log('✅ 确认为 JPEG 图片');
        } else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
          console.log('✅ 确认为 PNG 图片');
        } else {
          console.log('⚠️ 图片格式未知');
        }
      }
    } else {
      console.log('❌ GET 请求失败');
      const errorText = await getResponse.text();
      console.log('错误内容:', errorText);
    }
    
  } catch (error) {
    console.log('❌ 请求异常:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS 解析失败');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 连接被拒绝');
    } else if (error.code === 'ECONNRESET') {
      console.log('💡 连接被重置 - 这与通义万相遇到的错误相同');
    } else if (error.type === 'request-timeout') {
      console.log('💡 请求超时');
    }
  }
}

async function testWithCurl() {
  console.log('\n🔧 使用 curl 测试...');
  
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-I', '-v', TEMP_PUBLIC_IMAGE_URL]);
    
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
    }, 15000);
  });
}

async function testAlternativeUrls() {
  console.log('\n🔧 测试其他可能的 URL 格式...');
  
  // 测试不同的 URL 格式
  const alternativeUrls = [
    // 直接的 Google Cloud Storage URL
    'https://storage.googleapis.com/draworld-6898f.firebasestorage.app/temp-public/1754888979951_89h61f.jpg',
    // 使用 .appspot.com 域名
    'https://storage.googleapis.com/draworld-6898f.appspot.com/temp-public/1754888979951_89h61f.jpg',
    // 使用 Firebase Storage 的公开 URL 格式
    'https://firebasestorage.googleapis.com/v0/b/draworld-6898f.firebasestorage.app/o/temp-public%2F1754888979951_89h61f.jpg?alt=media'
  ];
  
  for (const url of alternativeUrls) {
    console.log(`\n📋 测试 URL: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000
      });
      
      console.log('状态:', response.status);
      if (response.ok) {
        console.log('✅ 可访问');
      } else {
        console.log('❌ 不可访问');
      }
    } catch (error) {
      console.log('❌ 错误:', error.message);
    }
  }
}

async function main() {
  await testImageAccess();
  await testWithCurl();
  await testAlternativeUrls();
  
  console.log('\n📋 总结:');
  console.log('1. 如果我们本地都无法访问，说明图片没有正确设置为公开');
  console.log('2. 如果我们能访问但通义万相不能，说明是网络限制问题');
  console.log('3. 可能需要使用不同的图片托管策略');
}

main().catch(console.error);
