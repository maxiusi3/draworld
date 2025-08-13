/**
 * 通义万相 API 连接测试脚本
 * 用于验证 API Key 和网络连接是否正常
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

async function testApiConnection() {
  console.log('🔍 开始测试通义万相 API 连接...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  try {
    // 测试 1: 验证 API Key
    console.log('\n📋 测试 1: 验证 API Key');
    const authResponse = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
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
    
    console.log('认证测试响应状态:', authResponse.status);
    
    if (authResponse.status === 401 || authResponse.status === 403) {
      console.log('❌ API Key 无效或权限不足');
      return false;
    } else if (authResponse.status === 200) {
      console.log('✅ API Key 验证成功');
    } else {
      console.log('⚠️ API Key 状态未知，继续测试...');
    }
    
    // 测试 2: 创建视频任务
    console.log('\n🎬 测试 2: 创建视频任务');
    const videoTaskBody = {
      model: 'wanx-v1',
      input: {
        image_url: 'https://storage.googleapis.com/draworld-6898f.appspot.com/test-image.jpg',
        text: '测试视频生成',
        aspect_ratio: '16:9'
      },
      parameters: {
        style: 'natural',
        duration: '5s'
      }
    };
    
    console.log('请求体:', JSON.stringify(videoTaskBody, null, 2));
    
    const videoResponse = await fetch(`${BASE_URL}/services/aigc/video-generation/video-synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(videoTaskBody),
      timeout: 30000
    });
    
    console.log('视频任务响应状态:', videoResponse.status);
    
    const responseText = await videoResponse.text();
    console.log('响应内容:', responseText);
    
    if (videoResponse.ok) {
      const result = JSON.parse(responseText);
      if (result.output && result.output.task_id) {
        console.log('✅ 视频任务创建成功, Task ID:', result.output.task_id);
        return true;
      } else {
        console.log('⚠️ 响应格式异常');
        return false;
      }
    } else {
      console.log('❌ 视频任务创建失败');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      console.log('💡 网络连接问题，请检查网络设置');
    } else if (error.name === 'FetchError') {
      console.log('💡 请求超时或连接被拒绝');
    }
    
    return false;
  }
}

// 运行测试
testApiConnection().then(success => {
  if (success) {
    console.log('\n🎉 所有测试通过！API 连接正常');
  } else {
    console.log('\n💥 测试失败，请检查配置');
  }
  process.exit(success ? 0 : 1);
});
