/**
 * 直接测试通义万相 API 的不同格式
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// 测试图片 URL（使用一个公开的测试图片）
const TEST_IMAGE_URL = 'https://storage.googleapis.com/draworld-6898f.appspot.com/users/anonymous/images/1754796515595_WechatIMG3794.jpg';

async function testAPI(testName, endpoint, requestBody) {
  console.log(`\n🧪 ${testName}`);
  console.log('端点:', endpoint);
  console.log('请求体:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('响应内容:', responseText);
    
    if (response.ok) {
      console.log('✅ 成功');
      try {
        const result = JSON.parse(responseText);
        if (result.output && result.output.task_id) {
          console.log('🎯 任务ID:', result.output.task_id);
          return result.output.task_id;
        }
      } catch (e) {
        console.log('⚠️ 响应不是有效的JSON');
      }
    } else {
      console.log('❌ 失败');
    }
    
  } catch (error) {
    console.log('❌ 请求异常:', error.message);
  }
  
  return null;
}

async function runTests() {
  console.log('🚀 开始测试通义万相 API 不同格式...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('测试图片:', TEST_IMAGE_URL);
  
  // 测试 1: 通义万相 2.2 格式 (wan2.2-i2v-plus)
  await testAPI(
    '测试 1: 通义万相 2.2 格式 (wan2.2-i2v-plus)',
    '/services/aigc/video-generation/video-synthesis',
    {
      model: 'wan2.2-i2v-plus',
      input: {
        prompt: '测试视频生成',
        img_url: TEST_IMAGE_URL
      },
      parameters: {
        resolution: '1080P',
        prompt_extend: true,
        watermark: false
      }
    }
  );
  
  // 测试 2: 通义万相 1.0 格式 (wanx-v1)
  await testAPI(
    '测试 2: 通义万相 1.0 格式 (wanx-v1)',
    '/services/aigc/video-generation/video-synthesis',
    {
      model: 'wanx-v1',
      input: {
        image_url: TEST_IMAGE_URL,
        text: '测试视频生成'
      },
      parameters: {
        style: 'natural',
        duration: '5s'
      }
    }
  );
  
  // 测试 3: 图生视频端点
  await testAPI(
    '测试 3: 图生视频端点',
    '/services/aigc/image2video/generation',
    {
      model: 'wan2.2-i2v-plus',
      input: {
        prompt: '测试视频生成',
        img_url: TEST_IMAGE_URL
      },
      parameters: {
        resolution: '1080P',
        prompt_extend: true,
        watermark: false
      }
    }
  );
  
  // 测试 4: 验证 API Key
  console.log('\n🔑 测试 API Key 有效性...');
  try {
    const response = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [{ role: 'user', content: 'test' }]
        }
      }),
      timeout: 10000
    });
    
    console.log('API Key 验证状态:', response.status);
    if (response.status === 401 || response.status === 403) {
      console.log('❌ API Key 无效或无权限');
    } else {
      console.log('✅ API Key 有效');
    }
    
  } catch (error) {
    console.log('❌ API Key 验证失败:', error.message);
  }
  
  console.log('\n📋 测试完成');
}

runAllTests().catch(console.error);

async function runAllTests() {
  await runTests();
}
