/**
 * 测试 uploadImage Cloud Function
 */

import fetch from 'node-fetch';

const PROJECT_ID = 'draworld-6898f';
const REGION = 'us-central1';
const FUNCTION_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/uploadImage`;

// 创建一个简单的测试图片的 base64 数据
const createTestImageBase64 = () => {
  // 这是一个 1x1 像素的透明 PNG 图片的 base64 数据
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
};

async function testUploadFunction() {
  console.log('🧪 测试 uploadImage Cloud Function...');
  console.log('Function URL:', FUNCTION_URL);
  
  const testImageData = createTestImageBase64();
  
  const requestBody = {
    data: {
      imageData: testImageData,
      fileName: 'test-image.png',
      contentType: 'image/png'
    }
  };
  
  console.log('请求体:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这个测试没有认证，所以会失败，但我们可以看到具体的错误信息
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('响应内容:', responseText);
    
    if (response.ok) {
      console.log('✅ 函数调用成功');
    } else {
      console.log('❌ 函数调用失败');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('错误详情:', errorData);
        
        if (errorData.error && errorData.error.message) {
          console.log('错误消息:', errorData.error.message);
          
          if (errorData.error.message.includes('unauthenticated')) {
            console.log('💡 这是预期的认证错误，说明函数本身是可访问的');
          }
        }
      } catch (parseError) {
        console.log('无法解析错误响应为 JSON');
      }
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS 解析失败，可能是网络问题');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 连接被拒绝，函数可能不存在或不可访问');
    } else if (error.name === 'FetchError') {
      console.log('💡 网络请求错误');
    }
  }
}

// 测试函数是否存在
async function testFunctionExists() {
  console.log('\n🔍 测试函数是否存在...');
  
  try {
    // 发送一个简单的 GET 请求来测试函数是否存在
    const response = await fetch(FUNCTION_URL, {
      method: 'GET',
      timeout: 10000
    });
    
    console.log('GET 请求状态:', response.status);
    
    if (response.status === 405) {
      console.log('✅ 函数存在（返回 405 Method Not Allowed 是正常的）');
    } else if (response.status === 404) {
      console.log('❌ 函数不存在或 URL 错误');
    } else {
      console.log('⚠️ 意外的响应状态');
    }
    
  } catch (error) {
    console.log('❌ 测试函数存在性失败:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  await testFunctionExists();
  await testUploadFunction();
  
  console.log('\n📋 总结:');
  console.log('1. 如果看到 "函数存在" 和 "unauthenticated" 错误，说明函数正常');
  console.log('2. 如果看到网络错误，可能是连接问题');
  console.log('3. 如果看到 404 错误，函数可能未正确部署');
}

runAllTests().catch(console.error);
