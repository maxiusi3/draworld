#!/usr/bin/env node

/**
 * 通义万相真实视频生成功能测试脚本
 * 用于测试API配置和视频生成功能
 */

require('dotenv').config();
const fetch = require('node-fetch');

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

const API_KEY = process.env.DASHSCOPE_API_KEY;
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// 测试图片URL（使用一个公开的测试图片）
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';

async function main() {
  console.log(colors.bold(colors.cyan('\n🧪 通义万相真实视频生成功能测试\n')));
  
  // 检查API密钥
  if (!API_KEY) {
    console.log(colors.red('❌ 未找到API密钥'));
    console.log('请先运行 node setup-real-video.js 配置API密钥');
    return;
  }
  
  console.log(colors.green('✅ 找到API密钥: ' + API_KEY.substring(0, 10) + '...'));
  
  // 测试1: 验证API密钥
  console.log(colors.blue('\n📋 测试1: 验证API密钥'));
  const authTest = await testApiAuth();
  if (!authTest.success) {
    console.log(colors.red('❌ API密钥验证失败: ' + authTest.error));
    return;
  }
  console.log(colors.green('✅ API密钥验证成功'));
  
  // 测试2: 创建视频任务
  console.log(colors.blue('\n🎬 测试2: 创建视频任务'));
  const createTest = await testCreateVideoTask();
  if (!createTest.success) {
    console.log(colors.red('❌ 创建视频任务失败: ' + createTest.error));
    return;
  }
  console.log(colors.green('✅ 视频任务创建成功'));
  console.log(colors.cyan('任务ID: ' + createTest.taskId));
  
  // 测试3: 查询任务状态
  console.log(colors.blue('\n📊 测试3: 查询任务状态'));
  const statusTest = await testTaskStatus(createTest.taskId);
  if (!statusTest.success) {
    console.log(colors.red('❌ 查询任务状态失败: ' + statusTest.error));
    return;
  }
  console.log(colors.green('✅ 任务状态查询成功'));
  console.log(colors.cyan('当前状态: ' + statusTest.status));
  
  // 测试4: 测试本地API端点
  console.log(colors.blue('\n🔗 测试4: 测试本地API端点'));
  const localTest = await testLocalApi();
  if (!localTest.success) {
    console.log(colors.yellow('⚠️  本地API测试失败: ' + localTest.error));
    console.log('这可能是因为开发服务器未运行');
  } else {
    console.log(colors.green('✅ 本地API测试成功'));
  }
  
  console.log(colors.bold(colors.green('\n🎉 所有测试完成！')));
  console.log(colors.cyan('您的真实视频生成功能已准备就绪。'));
  
  if (statusTest.status === 'PENDING' || statusTest.status === 'RUNNING') {
    console.log(colors.yellow('\n⏳ 视频正在生成中，请等待几分钟后查看结果'));
  }
}

// 测试API认证
async function testApiAuth() {
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
    
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'API密钥无效或权限不足' };
    } else if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试创建视频任务
async function testCreateVideoTask() {
  try {
    const requestBody = {
      model: 'wan2.2-i2v-flash',
      input: {
        prompt: '测试视频生成',
        img_url: TEST_IMAGE_URL
      },
      parameters: {
        resolution: '480P',
        duration: 5,
        prompt_extend: true,
        watermark: false
      }
    };
    
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${BASE_URL}/services/aigc/video-generation/video-synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });
    
    const responseText = await response.text();
    console.log('响应状态:', response.status);
    console.log('响应内容:', responseText);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }
    
    const result = JSON.parse(responseText);
    
    if (result.output && result.output.task_id) {
      return { success: true, taskId: result.output.task_id };
    } else {
      return { success: false, error: '响应格式错误' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试查询任务状态
async function testTaskStatus(taskId) {
  try {
    const requestBody = {
      model: 'wan2.2-i2v-flash',
      task_id: taskId
    };
    
    const response = await fetch(`${BASE_URL}/services/aigc/video-generation/video-synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody),
      timeout: 15000
    });
    
    const responseText = await response.text();
    console.log('查询响应状态:', response.status);
    console.log('查询响应内容:', responseText);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }
    
    const result = JSON.parse(responseText);
    
    if (result.output) {
      return { success: true, status: result.output.task_status };
    } else {
      return { success: false, error: '响应格式错误' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试本地API端点
async function testLocalApi() {
  try {
    const response = await fetch('http://localhost:5173/api/video/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        inputImageUrl: TEST_IMAGE_URL,
        params: {
          prompt: '测试本地API',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      }),
      timeout: 10000
    });
    
    if (response.ok) {
      const result = await response.json();
      return { success: true, result };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 运行主函数
main().catch(console.error);
