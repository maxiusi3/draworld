/**
 * 测试所有可能的视频生成模型名称
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

async function testAllModels() {
  console.log('🔍 测试所有可能的视频生成模型...');
  
  const models = [
    'wanx-v1',
    'wanx-video-v1',
    'wanx-i2v-v1',
    'wanx-image2video-v1',
    'cogvideo-v1',
    'cogvideo-v1.1',
    'video-generation-v1',
    'image2video-v1',
    'i2v-v1',
    'video-v1',
    'wanx',
    'wanx-video',
    'video-wanx-v1',
    'wanx-v1-video',
    'wanx-generation-v1'
  ];
  
  const endpoints = [
    '/services/aigc/video-generation/generation',
    '/services/aigc/image2video/generation',
    '/services/aigc/wanx/generation',
    '/services/aigc/video/generation',
    '/services/aigc/multimodal-generation/generation'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🎯 测试端点: ${endpoint}`);
    
    for (const model of models) {
      console.log(`\n📋 测试模型: ${model}`);
      
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'X-DashScope-Async': 'enable'
          },
          body: JSON.stringify({
            model: model,
            input: {
              text: '一个美丽的风景'
            }
          }),
          timeout: 15000
        });

        console.log(`响应状态: ${response.status}`);
        
        const responseText = await response.text();
        console.log(`响应: ${responseText.substring(0, 150)}...`);
        
        if (response.ok) {
          console.log('✅ 成功！找到可用模型！');
          const result = JSON.parse(responseText);
          if (result.output && result.output.task_id) {
            console.log(`🎯 任务ID: ${result.output.task_id}`);
            return { 
              success: true, 
              model, 
              endpoint, 
              taskId: result.output.task_id 
            };
          }
        } else if (response.status === 400) {
          const errorData = JSON.parse(responseText);
          if (errorData.code === 'InvalidParameter' && errorData.message !== 'url error, please check url！') {
            console.log('⚠️ 模型存在但参数错误，继续测试...');
          } else if (errorData.message === 'Model not exist.') {
            console.log('❌ 模型不存在');
          } else {
            console.log('❌ 其他错误:', errorData.message);
          }
        }
        
      } catch (error) {
        console.log(`❌ 请求错误: ${error.message}`);
      }
      
      // 添加延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { success: false };
}

// 测试获取可用模型列表
async function testGetModels() {
  console.log('\n📋 尝试获取可用模型列表...');
  
  const endpoints = [
    '/models',
    '/services/aigc/models',
    '/services/models',
    '/api/models'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 10000
      });

      console.log(`端点 ${endpoint} - 状态: ${response.status}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`响应: ${responseText.substring(0, 500)}...`);
        
        try {
          const result = JSON.parse(responseText);
          if (result.data && Array.isArray(result.data)) {
            console.log('✅ 找到模型列表！');
            const videoModels = result.data.filter(model => 
              model.id.includes('video') || 
              model.id.includes('wanx') ||
              model.id.includes('i2v')
            );
            console.log('视频相关模型:', videoModels.map(m => m.id));
            return videoModels;
          }
        } catch (e) {
          console.log('响应不是 JSON 格式');
        }
      }
      
    } catch (error) {
      console.log(`端点 ${endpoint} 错误: ${error.message}`);
    }
  }
  
  return [];
}

// 运行所有测试
async function runAllTests() {
  // 先尝试获取模型列表
  const models = await testGetModels();
  
  if (models.length > 0) {
    console.log('\n🎉 找到视频模型，使用发现的模型进行测试...');
    // 这里可以使用发现的模型进行测试
  }
  
  // 测试所有可能的模型组合
  const result = await testAllModels();
  
  if (result.success) {
    console.log('\n🎉 找到可用的配置！');
    console.log('模型:', result.model);
    console.log('端点:', result.endpoint);
    console.log('任务ID:', result.taskId);
  } else {
    console.log('\n💥 没有找到可用的模型配置');
    console.log('\n💡 这可能意味着：');
    console.log('1. 账户没有开通视频生成服务');
    console.log('2. API Key 权限不足');
    console.log('3. 需要使用不同的 API 版本或格式');
    console.log('4. 服务可能在维护中');
  }
}

runAllTests().catch(console.error);
