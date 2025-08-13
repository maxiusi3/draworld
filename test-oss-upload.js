/**
 * 测试上传图片到阿里云 OSS 然后调用视频生成 API
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// 测试不需要图片的视频生成
async function testTextToVideo() {
  console.log('🎬 测试纯文本视频生成...');
  
  const testConfigs = [
    {
      name: '纯文本视频生成',
      body: {
        model: 'wanx-v1',
        input: {
          text: '一个美丽的日落场景，海浪轻拍海岸'
        }
      }
    },
    {
      name: '纯文本视频生成 - 带参数',
      body: {
        model: 'wanx-v1',
        input: {
          text: '一个美丽的日落场景，海浪轻拍海岸'
        },
        parameters: {
          style: 'natural',
          duration: '5s'
        }
      }
    },
    {
      name: '使用 prompt 字段',
      body: {
        model: 'wanx-v1',
        input: {
          prompt: '一个美丽的日落场景，海浪轻拍海岸'
        }
      }
    }
  ];

  for (const config of testConfigs) {
    console.log(`\n📋 测试: ${config.name}`);
    console.log(`请求体:`, JSON.stringify(config.body, null, 2));
    
    try {
      const response = await fetch(`${BASE_URL}/services/aigc/video-generation/generation`, {
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return { success: false };
}

// 测试图片上传到 DashScope
async function testImageUpload() {
  console.log('\n📤 测试图片上传到 DashScope...');
  
  try {
    // 先下载一个测试图片
    const imageResponse = await fetch('https://picsum.photos/512/512');
    const imageBuffer = await imageResponse.buffer();
    
    console.log('图片下载成功，大小:', imageBuffer.length, 'bytes');
    
    // 尝试上传到 DashScope
    const uploadResponse = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer,
      timeout: 30000
    });
    
    console.log('上传响应状态:', uploadResponse.status);
    const uploadResult = await uploadResponse.text();
    console.log('上传响应内容:', uploadResult);
    
    if (uploadResponse.ok) {
      const result = JSON.parse(uploadResult);
      if (result.url) {
        console.log('✅ 图片上传成功！');
        console.log('图片 URL:', result.url);
        
        // 使用上传的图片 URL 测试视频生成
        return await testVideoWithUploadedImage(result.url);
      }
    }
    
  } catch (error) {
    console.log('❌ 上传失败:', error.message);
  }
  
  return { success: false };
}

async function testVideoWithUploadedImage(imageUrl) {
  console.log('\n🎬 使用上传的图片测试视频生成...');
  
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
    console.log(`响应内容: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ 成功！');
      const result = JSON.parse(responseText);
      if (result.output && result.output.task_id) {
        console.log(`🎯 任务ID: ${result.output.task_id}`);
        return { success: true, taskId: result.output.task_id };
      }
    }
    
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
  }
  
  return { success: false };
}

// 运行所有测试
async function runAllTests() {
  // 先测试纯文本视频生成
  const textResult = await testTextToVideo();
  
  if (textResult.success) {
    console.log('\n🎉 纯文本视频生成成功！');
    console.log('任务ID:', textResult.taskId);
    return;
  }
  
  // 如果纯文本失败，尝试图片上传
  const uploadResult = await testImageUpload();
  
  if (uploadResult.success) {
    console.log('\n🎉 图片上传 + 视频生成成功！');
    console.log('任务ID:', uploadResult.taskId);
  } else {
    console.log('\n💥 所有方法都失败了');
    console.log('\n💡 建议：');
    console.log('1. 检查 API 文档是否有更新');
    console.log('2. 确认模型名称是否正确');
    console.log('3. 联系阿里云技术支持');
  }
}

runAllTests().catch(console.error);
