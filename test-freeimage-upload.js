/**
 * 测试 freeimage.host 上传功能
 */

import fetch from 'node-fetch';
import fs from 'fs';

async function testFreeImageUpload() {
  console.log('🧪 测试 freeimage.host 上传功能...');
  
  try {
    // 创建一个简单的测试图片 (1x1 像素的 PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    console.log('📤 上传测试图片到 freeimage.host...');
    
    const formData = new URLSearchParams();
    formData.append('source', testImageBase64);
    formData.append('type', 'base64');
    formData.append('action', 'upload');
    formData.append('format', 'json');
    
    const uploadResponse = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    console.log('响应状态:', uploadResponse.status);
    console.log('响应头:', Object.fromEntries(uploadResponse.headers.entries()));
    
    const responseText = await uploadResponse.text();
    console.log('响应内容:', responseText);
    
    if (uploadResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('解析后的响应:', JSON.stringify(result, null, 2));
        
        if (result.success && result.image && result.image.url) {
          console.log('✅ 上传成功！');
          console.log('图片URL:', result.image.url);
          
          // 测试访问上传的图片
          console.log('\n🔍 测试访问上传的图片...');
          const testResponse = await fetch(result.image.url, { method: 'HEAD' });
          console.log('图片访问状态:', testResponse.status);
          
          if (testResponse.ok) {
            console.log('✅ 图片可以正常访问');
          } else {
            console.log('❌ 图片无法访问');
          }
          
        } else {
          console.log('❌ 上传失败，响应格式异常');
        }
      } catch (parseError) {
        console.log('❌ 响应不是有效的JSON:', parseError.message);
      }
    } else {
      console.log('❌ 上传请求失败');
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

async function testAlternativeServices() {
  console.log('\n🔧 测试其他图片托管服务...');
  
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  
  // 测试 postimg.cc
  console.log('\n📤 测试 postimg.cc...');
  try {
    const formData = new URLSearchParams();
    formData.append('upload', testImageBase64);
    formData.append('format', 'json');
    
    const response = await fetch('https://postimg.cc/json', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });
    
    console.log('postimg.cc 状态:', response.status);
    const result = await response.text();
    console.log('postimg.cc 响应:', result.substring(0, 500));
    
  } catch (error) {
    console.log('postimg.cc 失败:', error.message);
  }
  
  // 测试 imgbb (需要API key)
  console.log('\n📤 测试 imgbb (无API key)...');
  try {
    const formData = new URLSearchParams();
    formData.append('image', testImageBase64);
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });
    
    console.log('imgbb 状态:', response.status);
    const result = await response.text();
    console.log('imgbb 响应:', result.substring(0, 200));
    
  } catch (error) {
    console.log('imgbb 失败:', error.message);
  }
}

async function main() {
  await testFreeImageUpload();
  await testAlternativeServices();
  
  console.log('\n📋 总结:');
  console.log('1. 如果 freeimage.host 可用，我们可以继续使用');
  console.log('2. 如果不可用，需要考虑其他方案：');
  console.log('   - 注册 imgbb API key');
  console.log('   - 使用 Google Cloud Storage 公开 bucket');
  console.log('   - 修改 Firebase Storage 规则');
}

main().catch(console.error);
