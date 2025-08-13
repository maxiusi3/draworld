/**
 * 直接测试通义万相 API 的各种端点和参数组合
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

async function testApiEndpoints() {
  console.log('🔍 开始测试通义万相 API 各种配置...');
  
  const testConfigs = [
    {
      name: '图片转视频 - wanx-v1',
      endpoint: '/services/aigc/image2video/generation',
      body: {
        model: 'wanx-v1',
        input: {
          image_url: 'https://picsum.photos/512/512',
          text: '测试视频生成'
        },
        parameters: {
          style: '<auto>',
          size: '1280*720'
        }
      }
    },
    {
      name: '视频合成 - wanx-v1',
      endpoint: '/services/aigc/video-generation/video-synthesis',
      body: {
        model: 'wanx-v1',
        input: {
          image_url: 'https://picsum.photos/512/512',
          text: '测试视频生成'
        },
        parameters: {
          style: '<auto>',
          size: '1280*720'
        }
      }
    },
    {
      name: '视频合成 - 旧格式',
      endpoint: '/services/aigc/video-generation/video-synthesis',
      body: {
        model: 'wanx-v1',
        input: {
          prompt: '测试视频生成',
          img_url: 'https://picsum.photos/512/512'
        },
        parameters: {
          resolution: '480P',
          duration: 5,
          prompt_extend: true,
          watermark: false
        }
      }
    },
    {
      name: '万相生成 - wanx-v1',
      endpoint: '/services/aigc/wanx/generation',
      body: {
        model: 'wanx-v1',
        input: {
          image_url: 'https://picsum.photos/512/512',
          text: '测试视频生成'
        },
        parameters: {
          style: '<auto>',
          size: '1280*720'
        }
      }
    }
  ];

  for (const config of testConfigs) {
    console.log(`\n📋 测试: ${config.name}`);
    console.log(`端点: ${config.endpoint}`);
    console.log(`请求体:`, JSON.stringify(config.body, null, 2));
    
    try {
      const response = await fetch(`${BASE_URL}${config.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(config.body),
        timeout: 30000
      });

      console.log(`响应状态: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`响应内容: ${responseText}`);
      
      if (response.ok) {
        console.log('✅ 成功！');
        const result = JSON.parse(responseText);
        if (result.output && result.output.task_id) {
          console.log(`🎯 任务ID: ${result.output.task_id}`);
          return { success: true, config, taskId: result.output.task_id };
        }
      } else {
        console.log('❌ 失败');
      }
      
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    
    console.log('---');
  }
  
  return { success: false };
}

// 测试 API Key 基本权限
async function testApiKeyPermissions() {
  console.log('\n🔑 测试 API Key 基本权限...');
  
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
          messages: [{ role: 'user', content: 'Hello' }]
        }
      }),
      timeout: 10000
    });
    
    console.log(`文本生成权限测试 - 状态: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ API Key 有效，具有文本生成权限');
    } else if (response.status === 401 || response.status === 403) {
      console.log('❌ API Key 无效或权限不足');
    } else {
      console.log('⚠️ API Key 状态未知');
    }
    
    const responseText = await response.text();
    console.log(`响应: ${responseText.substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`❌ 权限测试失败: ${error.message}`);
  }
}

// 运行所有测试
async function runAllTests() {
  await testApiKeyPermissions();
  const result = await testApiEndpoints();
  
  if (result.success) {
    console.log('\n🎉 找到可用的配置！');
    console.log('配置名称:', result.config.name);
    console.log('任务ID:', result.taskId);
  } else {
    console.log('\n💥 所有配置都失败了');
    console.log('\n💡 建议检查：');
    console.log('1. API Key 是否有视频生成权限');
    console.log('2. 账户是否已开通相关服务');
    console.log('3. 是否需要实名认证或升级账户');
  }
}

runAllTests().catch(console.error);
