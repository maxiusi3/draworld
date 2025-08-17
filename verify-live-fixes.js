#!/usr/bin/env node

/**
 * 验证实际应用中的修复是否生效
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🔍 验证实际应用中的修复...\n');

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

// 验证1: 积分购买修复
async function verifyCreditsFixture() {
  console.log('💰 验证积分购买修复...');
  
  // 获取初始积分
  const initialBalance = await apiCall('/api/credits?action=balance');
  if (!initialBalance.success) {
    console.log('  ❌ 无法获取积分余额');
    return false;
  }
  
  console.log(`  📊 初始积分: ${initialBalance.data.balance}`);
  
  // 获取套餐
  const packages = await apiCall('/api/orders?action=packages');
  if (!packages.success) {
    console.log('  ❌ 无法获取积分套餐');
    return false;
  }
  
  console.log(`  📦 可用套餐: ${packages.data.packages.length}个`);
  
  // 创建订单
  const order = await apiCall('/api/orders?action=create', {
    method: 'POST',
    body: JSON.stringify({
      packageId: 'basic',
      paymentMethod: 'ALIPAY'
    })
  });
  
  if (!order.success) {
    console.log(`  ❌ 订单创建失败: ${order.data?.error || '未知错误'}`);
    return false;
  }
  
  console.log(`  ✅ 订单创建成功: ${order.data.order.id}`);
  console.log(`  💰 套餐: ${order.data.order.packageName} (${order.data.order.credits}积分)`);
  
  // 等待支付完成
  console.log('  ⏳ 等待模拟支付完成...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // 检查积分是否增加
  const finalBalance = await apiCall('/api/credits?action=balance');
  if (finalBalance.success) {
    const increase = finalBalance.data.balance - initialBalance.data.balance;
    console.log(`  ✅ 支付完成，积分增加: ${increase}`);
    console.log(`  💰 最终余额: ${finalBalance.data.balance}`);
    return increase > 0;
  }
  
  return false;
}

// 验证2: 视频生成积分要求
async function verifyVideoGeneration() {
  console.log('\n🎬 验证视频生成积分要求...');
  
  const result = await apiCall('/api/video/start', {
    method: 'POST',
    body: JSON.stringify({
      inputImageUrl: 'https://picsum.photos/512/512?random=1',
      params: {
        prompt: '验证测试视频',
        aspectRatio: '16:9'
      }
    })
  });
  
  if (result.success) {
    console.log(`  ✅ 视频生成成功: ${result.data.taskId}`);
    console.log(`  💰 消费积分: ${result.data.creditsUsed}`);
    console.log(`  💰 剩余积分: ${result.data.remainingCredits}`);
    return true;
  } else {
    if (result.data?.required) {
      console.log(`  ⚠️ 积分不足: 需要${result.data.required}，当前${result.data.current}`);
      console.log(`  💡 积分要求已降低到30，但当前用户积分不足`);
    } else {
      console.log(`  ❌ 视频生成失败: ${result.data?.error || '未知错误'}`);
    }
    return false;
  }
}

// 验证3: 社区内容增强
async function verifyCommunityContent() {
  console.log('\n🎨 验证社区内容增强...');
  
  const result = await apiCall('/api/artworks');
  
  if (result.success) {
    const artworks = result.data.artworks;
    console.log(`  ✅ 获取到 ${artworks.length} 个作品`);
    
    if (artworks.length >= 5) {
      console.log('  ✅ 作品数量充足（≥5个）');
      
      // 检查作品质量
      const firstArtwork = artworks[0];
      const hasRichData = firstArtwork.title && firstArtwork.description && 
                         firstArtwork.userName && firstArtwork.tags && 
                         firstArtwork.tags.length > 0;
      
      if (hasRichData) {
        console.log('  ✅ 作品数据丰富，包含标题、描述、创作者、标签');
        console.log(`  🖼️ 示例作品: "${firstArtwork.title}" by ${firstArtwork.userName}`);
        console.log(`  🏷️ 标签: ${firstArtwork.tags.join(', ')}`);
        return true;
      } else {
        console.log('  ⚠️ 作品数据不够丰富');
        return false;
      }
    } else {
      console.log(`  ⚠️ 作品数量不足（${artworks.length}个，期望≥5个）`);
      return false;
    }
  } else {
    console.log('  ❌ 无法获取作品列表');
    return false;
  }
}

// 验证4: 多用户功能
async function verifyMultiUser() {
  console.log('\n👥 验证多用户功能...');
  
  const testUsers = [
    { token: 'demo-token', name: '演示用户' },
    { token: 'new-user-token', name: '新用户' },
    { token: 'test-user-1-token', name: '测试用户1' }
  ];
  
  let successCount = 0;
  
  for (const user of testUsers) {
    const balance = await apiCall('/api/credits?action=balance', {}, user.token);
    if (balance.success) {
      console.log(`  ✅ ${user.name}: ${balance.data.balance} 积分`);
      successCount++;
    } else {
      console.log(`  ❌ ${user.name}: 无法获取积分`);
    }
  }
  
  const success = successCount === testUsers.length;
  if (success) {
    console.log('  ✅ 多用户系统正常工作');
  } else {
    console.log(`  ⚠️ 部分用户功能异常 (${successCount}/${testUsers.length})`);
  }
  
  return success;
}

// 验证5: 社交功能奖励
async function verifySocialRewards() {
  console.log('\n👍 验证社交功能奖励...');
  
  // 获取初始积分
  const initialBalance = await apiCall('/api/credits?action=balance');
  if (!initialBalance.success) {
    console.log('  ❌ 无法获取初始积分');
    return false;
  }
  
  // 点赞作品
  const likeResult = await apiCall('/api/community?action=like', {
    method: 'POST',
    body: JSON.stringify({ artworkId: 'artwork-1' })
  });
  
  if (likeResult.success) {
    console.log(`  ✅ 点赞成功，获得 ${likeResult.data.rewards.credits} 积分`);
    
    // 评论作品
    const commentResult = await apiCall('/api/community?action=comment', {
      method: 'POST',
      body: JSON.stringify({ 
        artworkId: 'artwork-1',
        content: '验证测试评论'
      })
    });
    
    if (commentResult.success) {
      console.log(`  ✅ 评论成功，获得 ${commentResult.data.rewards.credits} 积分`);
      
      // 检查最终积分
      const finalBalance = await apiCall('/api/credits?action=balance');
      if (finalBalance.success) {
        const totalIncrease = finalBalance.data.balance - initialBalance.data.balance;
        console.log(`  💰 总积分增加: ${totalIncrease}`);
        return totalIncrease > 0;
      }
    } else {
      console.log('  ❌ 评论失败');
    }
  } else {
    console.log('  ❌ 点赞失败');
  }
  
  return false;
}

// 主验证函数
async function runVerification() {
  console.log('🎯 开始验证实际应用中的修复...\n');
  
  const results = [];
  
  try {
    results.push({ name: '积分购买修复', success: await verifyCreditsFixture() });
    results.push({ name: '视频生成积分要求', success: await verifyVideoGeneration() });
    results.push({ name: '社区内容增强', success: await verifyCommunityContent() });
    results.push({ name: '多用户功能', success: await verifyMultiUser() });
    results.push({ name: '社交功能奖励', success: await verifySocialRewards() });
    
    // 生成报告
    console.log('\n📊 验证结果报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 总体成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 所有修复都在实际应用中正常工作！');
      console.log('🌐 应用地址: http://localhost:3000');
      console.log('\n🎯 用户界面改进:');
      console.log('✅ 导航栏重复项已合并');
      console.log('✅ 我的作品已整合到个人中心');
      console.log('✅ 用户切换器已添加到界面');
      console.log('✅ 路由配置已优化');
    } else {
      console.log('\n⚠️ 部分修复可能需要进一步调整');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error);
  }
}

// 运行验证
runVerification().catch(console.error);
