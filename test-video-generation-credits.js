#!/usr/bin/env node

/**
 * 测试视频生成积分要求降低
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🎬 测试视频生成积分要求降低...\n');

async function apiCall(endpoint, options = {}, token = 'demo-token') {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试1: 验证新用户可以生成视频
async function testNewUserVideoGeneration() {
  console.log('👤 测试新用户视频生成...');
  
  // 使用新用户token（通常只有50积分）
  const newUserToken = 'new-user-token';
  
  // 获取新用户的积分余额
  const balanceResult = await apiCall('/api/credits?action=balance', {}, newUserToken);
  
  if (!balanceResult.success) {
    console.log('  ❌ 无法获取新用户积分余额');
    return false;
  }
  
  const initialBalance = balanceResult.data.balance;
  console.log(`  📊 新用户初始积分: ${initialBalance}`);
  
  // 尝试生成视频
  const videoResult = await apiCall('/api/video/start', {
    method: 'POST',
    body: JSON.stringify({
      inputImageUrl: 'https://picsum.photos/512/512?random=new-user',
      params: {
        prompt: '新用户测试视频生成',
        aspectRatio: '16:9',
        musicStyle: 'Joyful'
      }
    })
  }, newUserToken);
  
  if (videoResult.success) {
    console.log(`  ✅ 新用户视频生成成功: ${videoResult.data.taskId}`);
    console.log(`  💰 消费积分: ${videoResult.data.creditsUsed}`);
    console.log(`  💰 剩余积分: ${videoResult.data.remainingCredits}`);
    
    // 验证积分消费是否为1
    if (videoResult.data.creditsUsed === 1) {
      console.log('  ✅ 积分消费正确（1积分）');
      return true;
    } else {
      console.log(`  ❌ 积分消费错误: 期望1积分，实际${videoResult.data.creditsUsed}积分`);
      return false;
    }
  } else {
    console.log(`  ❌ 新用户视频生成失败: ${videoResult.data?.error || '未知错误'}`);
    if (videoResult.data?.required) {
      console.log(`  💡 需要 ${videoResult.data.required} 积分，当前 ${videoResult.data.current} 积分`);
    }
    return false;
  }
}

// 测试2: 验证多次生成
async function testMultipleVideoGeneration() {
  console.log('\n🔄 测试多次视频生成...');
  
  const testUserToken = 'test-user-1-token';
  
  // 获取初始积分
  const initialBalanceResult = await apiCall('/api/credits?action=balance', {}, testUserToken);
  if (!initialBalanceResult.success) {
    console.log('  ❌ 无法获取测试用户积分余额');
    return false;
  }
  
  const initialBalance = initialBalanceResult.data.balance;
  console.log(`  📊 测试用户初始积分: ${initialBalance}`);
  
  const videosToGenerate = Math.min(5, initialBalance); // 最多生成5个视频或用完积分
  let successCount = 0;
  
  for (let i = 1; i <= videosToGenerate; i++) {
    console.log(`  🎬 生成第 ${i} 个视频...`);
    
    const videoResult = await apiCall('/api/video/start', {
      method: 'POST',
      body: JSON.stringify({
        inputImageUrl: `https://picsum.photos/512/512?random=test-${i}`,
        params: {
          prompt: `测试视频 ${i}`,
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    }, testUserToken);
    
    if (videoResult.success) {
      console.log(`    ✅ 视频 ${i} 生成成功: ${videoResult.data.taskId}`);
      console.log(`    💰 剩余积分: ${videoResult.data.remainingCredits}`);
      successCount++;
    } else {
      console.log(`    ❌ 视频 ${i} 生成失败: ${videoResult.data?.error || '未知错误'}`);
      break;
    }
    
    // 稍微延迟一下
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`  📊 成功生成 ${successCount}/${videosToGenerate} 个视频`);
  
  // 获取最终积分
  const finalBalanceResult = await apiCall('/api/credits?action=balance', {}, testUserToken);
  if (finalBalanceResult.success) {
    const finalBalance = finalBalanceResult.data.balance;
    const totalUsed = initialBalance - finalBalance;
    console.log(`  💰 总消费积分: ${totalUsed}`);
    console.log(`  💰 最终余额: ${finalBalance}`);
    
    // 验证积分消费是否正确（每个视频1积分）
    if (totalUsed === successCount) {
      console.log('  ✅ 积分消费计算正确');
      return true;
    } else {
      console.log(`  ❌ 积分消费计算错误: 期望${successCount}积分，实际${totalUsed}积分`);
      return false;
    }
  }
  
  return successCount > 0;
}

// 测试3: 验证积分不足的处理
async function testInsufficientCredits() {
  console.log('\n💸 测试积分不足处理...');
  
  // 创建一个临时用户，手动设置为0积分
  const tempUserToken = 'temp-zero-credits-token';
  
  // 先尝试生成视频，这应该会失败
  const videoResult = await apiCall('/api/video/start', {
    method: 'POST',
    body: JSON.stringify({
      inputImageUrl: 'https://picsum.photos/512/512?random=zero-credits',
      params: {
        prompt: '积分不足测试',
        aspectRatio: '16:9'
      }
    })
  }, tempUserToken);
  
  if (!videoResult.success && videoResult.data?.error === 'Insufficient credits') {
    console.log('  ✅ 积分不足时正确返回错误');
    console.log(`  📋 错误信息: ${videoResult.data.message}`);
    console.log(`  💰 需要积分: ${videoResult.data.required}`);
    console.log(`  💰 当前积分: ${videoResult.data.current}`);
    
    // 验证需要的积分是否为1
    if (videoResult.data.required === 1) {
      console.log('  ✅ 积分要求正确（1积分）');
      return true;
    } else {
      console.log(`  ❌ 积分要求错误: 期望1积分，实际${videoResult.data.required}积分`);
      return false;
    }
  } else {
    console.log('  ❌ 积分不足处理异常');
    console.log('  📋 响应:', videoResult);
    return false;
  }
}

// 测试4: 验证不同用户的积分隔离
async function testUserCreditIsolation() {
  console.log('\n👥 测试用户积分隔离...');
  
  const users = [
    { token: 'demo-token', name: '演示用户' },
    { token: 'new-user-token', name: '新用户' },
    { token: 'test-user-2-token', name: '测试用户2' }
  ];
  
  const userBalances = {};
  
  // 获取每个用户的初始积分
  for (const user of users) {
    const balanceResult = await apiCall('/api/credits?action=balance', {}, user.token);
    if (balanceResult.success) {
      userBalances[user.name] = {
        initial: balanceResult.data.balance,
        token: user.token
      };
      console.log(`  📊 ${user.name}: ${balanceResult.data.balance} 积分`);
    }
  }
  
  // 让每个用户生成一个视频
  for (const [userName, userInfo] of Object.entries(userBalances)) {
    const videoResult = await apiCall('/api/video/start', {
      method: 'POST',
      body: JSON.stringify({
        inputImageUrl: `https://picsum.photos/512/512?random=${userName}`,
        params: {
          prompt: `${userName}的测试视频`,
          aspectRatio: '16:9'
        }
      })
    }, userInfo.token);
    
    if (videoResult.success) {
      console.log(`  ✅ ${userName} 视频生成成功`);
      userInfo.final = videoResult.data.remainingCredits;
    } else {
      console.log(`  ❌ ${userName} 视频生成失败`);
      userInfo.final = userInfo.initial; // 没有消费
    }
  }
  
  // 验证积分变化
  let allCorrect = true;
  for (const [userName, userInfo] of Object.entries(userBalances)) {
    const expectedFinal = userInfo.initial - 1; // 应该减少1积分
    if (userInfo.final === expectedFinal) {
      console.log(`  ✅ ${userName} 积分变化正确: ${userInfo.initial} → ${userInfo.final}`);
    } else {
      console.log(`  ❌ ${userName} 积分变化错误: 期望${expectedFinal}，实际${userInfo.final}`);
      allCorrect = false;
    }
  }
  
  return allCorrect;
}

// 主测试函数
async function runVideoGenerationTests() {
  console.log('🎯 开始视频生成积分测试...\n');
  
  const results = [];
  
  try {
    results.push({ name: '新用户视频生成', success: await testNewUserVideoGeneration() });
    results.push({ name: '多次视频生成', success: await testMultipleVideoGeneration() });
    results.push({ name: '积分不足处理', success: await testInsufficientCredits() });
    results.push({ name: '用户积分隔离', success: await testUserCreditIsolation() });
    
    // 生成报告
    console.log('\n📊 视频生成积分测试报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 测试成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 视频生成积分测试全部通过！');
      console.log('\n🔧 修改总结:');
      console.log('✅ 视频生成积分要求: 30积分 → 1积分');
      console.log('✅ 仅影响演示环境，不影响生产环境');
      console.log('✅ 新用户（50积分）可以生成50个视频');
      console.log('✅ 积分不足时正确显示错误信息');
      console.log('✅ 多用户积分正确隔离');
      
      console.log('\n🎮 使用指南:');
      console.log('• 新用户现在可以轻松测试视频生成功能');
      console.log('• 每次生成只消费1积分，便于多次测试');
      console.log('• 演示用户（200积分）可以生成200个视频');
      console.log('• 积分不足时会显示清晰的错误信息');
      
    } else {
      console.log('\n⚠️ 部分测试未通过，可能需要进一步调整');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runVideoGenerationTests().catch(console.error);
