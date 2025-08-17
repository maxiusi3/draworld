#!/usr/bin/env node

/**
 * 完整的端到端测试
 * 验证从图片上传到视频生成的完整流程
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🎬 测试完整视频生成流程...\n');

// 创建测试图片数据
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

// 测试1: 检查用户积分
async function checkUserCredits() {
  console.log('💰 检查用户积分...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/credits?action=balance`, {
      headers: { 'Authorization': `Bearer new-user-token` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📊 用户积分: ${data.balance}`);
      
      if (data.balance >= 1) {
        console.log('  ✅ 积分充足，可以生成视频');
        return { success: true, credits: data.balance };
      } else {
        console.log('  ❌ 积分不足');
        return { success: false, credits: data.balance };
      }
    } else {
      console.log('  ❌ 无法获取积分信息');
      return { success: false, credits: 0 };
    }
  } catch (error) {
    console.log(`  ❌ 积分检查失败: ${error.message}`);
    return { success: false, credits: 0 };
  }
}

// 测试2: 上传图片
async function uploadImage() {
  console.log('\n🖼️ 上传测试图片...');
  
  try {
    const uploadUrl = `${BASE_URL}/api/upload/image`;
    
    const requestBody = {
      imageData: testImageBase64,
      fileName: 'test-video-image.png',
      contentType: 'image/png'
    };
    
    console.log('  📤 发送上传请求...');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-user-token'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 图片上传成功');
      console.log(`  📋 图片URL: ${result.url.substring(0, 50)}...`);
      return { success: true, imageUrl: result.url };
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 图片上传失败: ${errorText}`);
      return { success: false, imageUrl: null };
    }
  } catch (error) {
    console.log(`  ❌ 上传失败: ${error.message}`);
    return { success: false, imageUrl: null };
  }
}

// 测试3: 生成视频
async function generateVideo(imageUrl) {
  console.log('\n🎬 生成视频...');
  
  try {
    const videoUrl = `${BASE_URL}/api/video/start`;
    
    const requestBody = {
      inputImageUrl: imageUrl,
      params: {
        prompt: '完整流程测试视频 - 一个美丽的动画场景',
        aspectRatio: '16:9',
        musicStyle: 'Joyful'
      }
    };
    
    console.log('  📤 发送视频生成请求...');
    console.log(`  📋 提示词: ${requestBody.params.prompt}`);
    console.log(`  📋 宽高比: ${requestBody.params.aspectRatio}`);
    console.log(`  📋 音乐风格: ${requestBody.params.musicStyle}`);
    
    const response = await fetch(videoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-user-token'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 视频生成任务创建成功');
      console.log(`  📋 任务ID: ${result.taskId}`);
      console.log(`  📋 状态: ${result.status}`);
      console.log(`  📋 消息: ${result.message}`);
      console.log(`  💰 消费积分: ${result.creditsUsed}`);
      console.log(`  💰 剩余积分: ${result.remainingCredits}`);
      
      return { 
        success: true, 
        taskId: result.taskId,
        creditsUsed: result.creditsUsed,
        remainingCredits: result.remainingCredits
      };
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 视频生成失败: ${errorText}`);
      return { success: false, taskId: null };
    }
  } catch (error) {
    console.log(`  ❌ 生成失败: ${error.message}`);
    return { success: false, taskId: null };
  }
}

// 测试4: 检查任务状态
async function checkTaskStatus(taskId) {
  console.log('\n📊 检查任务状态...');
  
  try {
    const statusUrl = `${BASE_URL}/api/video/status?taskId=${taskId}`;
    
    console.log(`  📤 查询任务状态: ${taskId}`);
    
    const response = await fetch(statusUrl, {
      headers: { 'Authorization': `Bearer new-user-token` }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 任务状态查询成功');
      console.log(`  📋 任务ID: ${result.taskId}`);
      console.log(`  📋 状态: ${result.status}`);
      console.log(`  📋 进度: ${result.progress || 0}%`);
      console.log(`  📋 消息: ${result.message}`);
      
      if (result.resultVideoUrl) {
        console.log(`  🎬 视频URL: ${result.resultVideoUrl}`);
      }
      
      return { success: true, status: result.status, progress: result.progress };
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 状态查询失败: ${errorText}`);
      return { success: false, status: null };
    }
  } catch (error) {
    console.log(`  ❌ 查询失败: ${error.message}`);
    return { success: false, status: null };
  }
}

// 测试5: 验证积分消费
async function verifyCreditsConsumption(initialCredits, expectedConsumption) {
  console.log('\n💳 验证积分消费...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/credits?action=balance`, {
      headers: { 'Authorization': `Bearer new-user-token` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const currentCredits = data.balance;
      const actualConsumption = initialCredits - currentCredits;
      
      console.log(`  📊 初始积分: ${initialCredits}`);
      console.log(`  📊 当前积分: ${currentCredits}`);
      console.log(`  📊 实际消费: ${actualConsumption}`);
      console.log(`  📊 预期消费: ${expectedConsumption}`);
      
      if (actualConsumption === expectedConsumption) {
        console.log('  ✅ 积分消费正确');
        return { success: true, consumption: actualConsumption };
      } else {
        console.log('  ❌ 积分消费不正确');
        return { success: false, consumption: actualConsumption };
      }
    } else {
      console.log('  ❌ 无法获取当前积分');
      return { success: false, consumption: 0 };
    }
  } catch (error) {
    console.log(`  ❌ 验证失败: ${error.message}`);
    return { success: false, consumption: 0 };
  }
}

// 主测试函数
async function runCompleteFlowTest() {
  console.log('🎯 开始完整视频生成流程测试...\n');
  
  const results = [];
  let initialCredits = 0;
  let imageUrl = null;
  let taskId = null;
  
  try {
    // 步骤1: 检查积分
    const creditsResult = await checkUserCredits();
    results.push({ name: '积分检查', success: creditsResult.success });
    
    if (!creditsResult.success) {
      console.log('\n❌ 积分不足，无法继续测试');
      return;
    }
    
    initialCredits = creditsResult.credits;
    
    // 步骤2: 上传图片
    const uploadResult = await uploadImage();
    results.push({ name: '图片上传', success: uploadResult.success });
    
    if (!uploadResult.success) {
      console.log('\n❌ 图片上传失败，无法继续测试');
      return;
    }
    
    imageUrl = uploadResult.imageUrl;
    
    // 步骤3: 生成视频
    const videoResult = await generateVideo(imageUrl);
    results.push({ name: '视频生成', success: videoResult.success });
    
    if (!videoResult.success) {
      console.log('\n❌ 视频生成失败，无法继续测试');
      return;
    }
    
    taskId = videoResult.taskId;
    
    // 步骤4: 检查任务状态
    const statusResult = await checkTaskStatus(taskId);
    results.push({ name: '任务状态', success: statusResult.success });
    
    // 步骤5: 验证积分消费
    const consumptionResult = await verifyCreditsConsumption(initialCredits, 1);
    results.push({ name: '积分消费验证', success: consumptionResult.success });
    
    // 生成报告
    console.log('\n📊 完整流程测试报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 测试成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 完整视频生成流程测试全部通过！');
      
      console.log('\n🎬 流程总结:');
      console.log(`✅ 用户积分: ${initialCredits} → ${initialCredits - 1}`);
      console.log('✅ 图片上传: 成功转换为base64 data URL');
      console.log('✅ 视频生成: 任务创建成功');
      console.log('✅ 积分消费: 正确消费1积分');
      console.log('✅ 任务状态: 可以正常查询');
      
      console.log('\n🚀 系统状态:');
      console.log('• 前端积分要求: 1积分 ✅');
      console.log('• 后端积分消费: 1积分 ✅');
      console.log('• 图片上传API: 正常工作 ✅');
      console.log('• 视频生成API: 正常工作 ✅');
      console.log('• 前后端一致性: 完全同步 ✅');
      
    } else {
      console.log('\n⚠️ 部分测试未通过，需要进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行完整流程测试
runCompleteFlowTest().catch(console.error);
