/**
 * 测试 imgbb 图片上传功能
 */

import fetch from 'node-fetch';

// 测试用的 Firebase Storage URL
const TEST_IMAGE_URL = 'https://firebasestorage.googleapis.com/v0/b/draworld-6898f.firebasestorage.app/o/users%2FewtqQvbLz9Vh7LMz320t2x2GgyN2%2Fimages%2F1754832955597_WechatIMG3794.jpg?alt=media&token=a7bba217-cce0-434c-8266-b4acbaab3f94';

async function testImgbbUpload() {
  console.log('🧪 测试 imgbb 图片上传...');
  console.log('原始图片 URL:', TEST_IMAGE_URL);
  
  try {
    // 1. 下载原始图片
    console.log('\n📥 下载原始图片...');
    const response = await fetch(TEST_IMAGE_URL);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    const base64Image = imageBuffer.toString('base64');
    
    console.log('✅ 图片下载成功');
    console.log('图片大小:', imageBuffer.length, 'bytes');
    console.log('Base64 长度:', base64Image.length);
    
    // 2. 测试多个免费图片托管服务
    await testMultipleServices(base64Image);
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

async function testMultipleServices(base64Image) {
  // 测试 1: imgbb (需要 API key)
  console.log('\n🔧 测试 imgbb...');
  try {
    // 这是一个示例 API key，实际使用需要注册获取
    const imgbbApiKey = 'YOUR_IMGBB_API_KEY';
    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', base64Image);
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('imgbb 响应状态:', response.status);
    const result = await response.text();
    console.log('imgbb 响应:', result.substring(0, 200) + '...');
    
  } catch (error) {
    console.log('imgbb 测试失败:', error.message);
  }
  
  // 测试 2: 使用 postimg.cc (无需 API key)
  console.log('\n🔧 测试 postimg.cc...');
  try {
    const formData = new URLSearchParams();
    formData.append('upload', base64Image);
    formData.append('format', 'json');
    
    const response = await fetch('https://postimg.cc/json', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('postimg.cc 响应状态:', response.status);
    const result = await response.text();
    console.log('postimg.cc 响应:', result);
    
  } catch (error) {
    console.log('postimg.cc 测试失败:', error.message);
  }
  
  // 测试 3: 使用 freeimage.host
  console.log('\n🔧 测试 freeimage.host...');
  try {
    const formData = new URLSearchParams();
    formData.append('source', base64Image);
    formData.append('type', 'base64');
    formData.append('action', 'upload');
    formData.append('format', 'json');
    
    const response = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('freeimage.host 响应状态:', response.status);
    const result = await response.text();
    console.log('freeimage.host 响应:', result.substring(0, 500) + '...');
    
  } catch (error) {
    console.log('freeimage.host 测试失败:', error.message);
  }
}

async function testDirectAccess() {
  console.log('\n🔍 测试直接访问原始 URL...');
  
  try {
    const response = await fetch(TEST_IMAGE_URL, {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log('直接访问状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ 原始 URL 可以直接访问');
    } else {
      console.log('❌ 原始 URL 无法访问');
    }
    
  } catch (error) {
    console.log('❌ 直接访问失败:', error.message);
  }
}

async function main() {
  await testDirectAccess();
  await testImgbbUpload();
  
  console.log('\n📋 总结:');
  console.log('1. 如果原始 URL 可以直接访问，可能是通义万相的网络问题');
  console.log('2. 如果需要重新托管，推荐使用 freeimage.host 或注册 imgbb API key');
  console.log('3. 也可以考虑使用 Google Cloud Storage 的公开 bucket');
}

main().catch(console.error);
