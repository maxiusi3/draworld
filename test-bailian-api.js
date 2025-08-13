/**
 * 测试百炼平台的视频生成 API
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

async function testBailianVideoGeneration() {
  console.log('🔍 测试百炼平台视频生成 API...');
  
  const testConfigs = [
    {
      name: '万相视频生成 - 标准格式',
      endpoint: '/services/aigc/video-generation/generation',
      body: {
        model: 'wanx-v1',
        input: {
          image_url: 'https://picsum.photos/512/512',
          text: '测试视频生成'
        }
      }
    },
    {
      name: '万相视频生成 - 带参数',
      endpoint: '/services/aigc/video-generation/generation',
      body: {
        model: 'wanx-v1',
        input: {
          image_url: 'https://picsum.photos/512/512',
          text: '测试视频生成'
        },
        parameters: {
          style: 'natural'
        }
      }
    },
    {
      name: '万相视频生成 - 简化参数',
      endpoint: '/services/aigc/video-generation/generation',
      body: {
        model: 'wanx-v1',
        input: {
          image_url: 'https://picsum.photos/512/512'
        }
      }
    },
    {
      name: '万相视频生成 - 使用 prompt',
      endpoint: '/services/aigc/video-generation/generation',
      body: {
        model: 'wanx-v1',
        input: {
          prompt: '一个美丽的风景视频',
          image_url: 'https://picsum.photos/512/512'
        }
      }
    },
    {
      name: '万相视频生成 - 不同模型',
      endpoint: '/services/aigc/video-generation/generation',
      body: {
        model: 'wanx-video-v1',
        input: {
          image_url: 'https://picsum.photos/512/512',
          text: '测试视频生成'
        }
      }
    },
    {
      name: '万相视频生成 - 使用 base64',
      endpoint: '/services/aigc/video-generation/generation',
      body: {
        model: 'wanx-v1',
        input: {
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          text: '测试视频生成'
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
    
    // 添加延迟避免频率限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return { success: false };
}

// 测试不同的图片 URL 格式
async function testDifferentImageUrls() {
  console.log('\n🖼️ 测试不同的图片 URL 格式...');
  
  const imageUrls = [
    'https://picsum.photos/512/512',
    'https://via.placeholder.com/512x512.jpg',
    'https://httpbin.org/image/jpeg',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512&h=512&fit=crop'
  ];
  
  for (const imageUrl of imageUrls) {
    console.log(`\n🔗 测试图片 URL: ${imageUrl}`);
    
    try {
      const response = await fetch(`${BASE_URL}/services/aigc/video-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: {
            image_url: imageUrl,
            text: '测试视频生成'
          }
        }),
        timeout: 30000
      });

      console.log(`响应状态: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`响应内容: ${responseText.substring(0, 200)}...`);
      
      if (response.ok) {
        console.log('✅ 成功！');
        return { success: true, imageUrl };
      }
      
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    
    // 添加延迟
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return { success: false };
}

// 运行所有测试
async function runAllTests() {
  const result1 = await testBailianVideoGeneration();
  
  if (!result1.success) {
    const result2 = await testDifferentImageUrls();
    
    if (result2.success) {
      console.log('\n🎉 找到可用的图片 URL 格式！');
      console.log('可用的图片 URL:', result2.imageUrl);
    } else {
      console.log('\n💥 所有测试都失败了');
      console.log('\n💡 可能的原因：');
      console.log('1. 模型名称不正确');
      console.log('2. API 端点路径错误');
      console.log('3. 参数格式不匹配');
      console.log('4. 需要特殊的请求头');
    }
  } else {
    console.log('\n🎉 找到可用的配置！');
    console.log('配置名称:', result1.config.name);
    console.log('任务ID:', result1.taskId);
  }
}

runAllTests().catch(console.error);
