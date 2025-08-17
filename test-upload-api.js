#!/usr/bin/env node

/**
 * 本地测试图片上传 API
 */

// 创建一个简单的测试图片 (1x1 像素的 PNG)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

async function testUploadAPI() {
  console.log('🧪 测试图片上传 API...\n');
  
  const API_BASE = 'https://draworld-g4goa33ck-fangzero-3350s-projects.vercel.app';
  const uploadUrl = `${API_BASE}/api/upload/image`;
  
  try {
    console.log(`📍 测试 URL: ${uploadUrl}`);
    
    const requestBody = {
      imageData: testImageBase64,
      fileName: 'test-image.png',
      contentType: 'image/png'
    };
    
    console.log('📤 发送上传请求...');
    console.log('请求体大小:', JSON.stringify(requestBody).length, 'bytes');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-testing'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 响应内容:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('🎉 上传成功!');
        console.log('图片 URL:', result.url);
        console.log('消息:', result.message);
      } catch (e) {
        console.log('⚠️  响应不是有效的 JSON');
      }
    } else {
      console.log('❌ 上传失败');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 测试 STS API
async function testSTSAPI() {
  console.log('\n🧪 测试 STS API...\n');
  
  const API_BASE = 'https://draworld-g4goa33ck-fangzero-3350s-projects.vercel.app';
  const stsUrl = `${API_BASE}/api/oss/sts`;
  
  try {
    console.log(`📍 测试 URL: ${stsUrl}`);
    
    const response = await fetch(stsUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-for-testing'
      }
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 响应内容:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('🎉 STS 请求成功!');
        console.log('凭证信息:', result);
      } catch (e) {
        console.log('⚠️  响应不是有效的 JSON');
      }
    } else {
      console.log('❌ STS 请求失败');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  await testUploadAPI();
  await testSTSAPI();
  console.log('\n🏁 测试完成!');
}

runAllTests();
