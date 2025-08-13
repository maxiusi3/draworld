/**
 * 测试使用一个确定可以访问的公开图片 URL
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

async function testWithWorkingImage() {
  console.log('🧪 测试使用确定可访问的公开图片...');
  
  // 使用一个确定可以访问的公开图片
  const workingImageUrls = [
    'https://cdn.translate.alibaba.com/r/wanx-demo-1.png', // 官方示例图片
    'https://picsum.photos/512/512', // Lorem Picsum
    'https://via.placeholder.com/512x512.jpg', // Placeholder
    'https://httpbin.org/image/jpeg' // HTTPBin 测试图片
  ];
  
  for (const imageUrl of workingImageUrls) {
    console.log(`\n🖼️ 测试图片: ${imageUrl}`);
    
    // 先测试图片是否可访问
    try {
      const imageResponse = await fetch(imageUrl, { method: 'HEAD', timeout: 10000 });
      console.log(`图片访问状态: ${imageResponse.status}`);
      
      if (!imageResponse.ok) {
        console.log('❌ 图片不可访问，跳过');
        continue;
      }
    } catch (error) {
      console.log('❌ 图片访问失败:', error.message);
      continue;
    }
    
    // 测试 API 调用
    try {
      const response = await fetch(`${BASE_URL}/services/aigc/video-generation/video-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: 'wan2.2-i2v-plus',
          input: {
            prompt: '测试视频生成',
            img_url: imageUrl
          },
          parameters: {
            resolution: '1080P',
            prompt_extend: true,
            watermark: false
          }
        }),
        timeout: 30000
      });

      console.log(`API 响应状态: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`API 响应: ${responseText.substring(0, 200)}...`);
      
      if (response.ok) {
        console.log('🎉 成功！找到可用的图片 URL 格式！');
        const result = JSON.parse(responseText);
        if (result.output && result.output.task_id) {
          console.log(`✅ 任务ID: ${result.output.task_id}`);
          return { success: true, imageUrl, taskId: result.output.task_id };
        }
      } else {
        const errorData = JSON.parse(responseText);
        if (errorData.message !== 'url error, please check url！') {
          console.log('⚠️ 不是 URL 错误，可能是其他问题:', errorData.message);
        }
      }
      
    } catch (error) {
      console.log(`❌ API 调用错误: ${error.message}`);
    }
    
    // 添加延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return { success: false };
}

// 测试 Firebase Storage URL 的直接访问
async function testFirebaseStorageAccess() {
  console.log('\n🔥 测试 Firebase Storage URL 直接访问...');
  
  const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/draworld-6898f.firebasestorage.app/o/users%2FewtqQvbLz9Vh7LMz320t2x2GgyN2%2Fimages%2F1754825641092_WechatIMG3794.jpg?alt=media&token=708f530f-e94f-4187-ad48-44caea34b2c9';
  
  try {
    console.log('尝试访问 Firebase Storage URL...');
    const response = await fetch(firebaseUrl, { 
      method: 'HEAD', 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Test/1.0)'
      }
    });
    
    console.log(`Firebase URL 访问状态: ${response.status}`);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok) {
      console.log('✅ Firebase Storage URL 可以访问');
      
      // 如果可以访问，测试用这个 URL 调用 API
      console.log('\n🧪 使用 Firebase URL 测试 API...');
      
      const apiResponse = await fetch(`${BASE_URL}/services/aigc/video-generation/video-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: 'wan2.2-i2v-plus',
          input: {
            prompt: '测试视频生成',
            img_url: firebaseUrl
          },
          parameters: {
            resolution: '1080P',
            prompt_extend: true,
            watermark: false
          }
        }),
        timeout: 30000
      });

      console.log(`API 响应状态: ${apiResponse.status}`);
      const apiResponseText = await apiResponse.text();
      console.log(`API 响应: ${apiResponseText}`);
      
    } else {
      console.log('❌ Firebase Storage URL 不可访问');
    }
    
  } catch (error) {
    console.log('❌ Firebase URL 访问错误:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  const result = await testWithWorkingImage();
  
  if (result.success) {
    console.log('\n🎉 找到可用的图片格式！');
    console.log('可用图片 URL:', result.imageUrl);
    console.log('任务ID:', result.taskId);
  } else {
    console.log('\n💥 所有公开图片都失败了');
  }
  
  await testFirebaseStorageAccess();
}

runAllTests().catch(console.error);
