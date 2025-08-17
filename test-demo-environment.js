#!/usr/bin/env node

/**
 * 演示环境功能测试脚本
 * 验证所有新实现的功能在演示环境中正常工作
 */

const fetch = require('node-fetch');

// 测试配置
const BASE_URL = process.env.DEMO_URL || 'http://localhost:3000';
const TEST_TOKEN = 'demo-token';

console.log(`🧪 开始测试演示环境功能...`);
console.log(`📍 测试目标: ${BASE_URL}`);
console.log(`🔑 测试令牌: ${TEST_TOKEN}\n`);

// 测试结果收集
const testResults = [];

function logTest(name, success, message, details = null) {
  const result = { name, success, message, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}: ${message}`);
  if (details && typeof details === 'object') {
    console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
  } else if (details) {
    console.log(`   详情: ${details}`);
  }
}

// API调用辅助函数
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: { error: error.message }
    };
  }
}

// 测试1: 邀请系统完整流程
async function testInvitationSystem() {
  console.log('\n🎯 测试邀请系统...');
  
  try {
    // 1. 获取邀请码
    const codeResponse = await apiCall('/api/invitations?action=my-code');
    if (!codeResponse.ok) {
      throw new Error(`获取邀请码失败: ${codeResponse.data.message}`);
    }
    
    const inviteCode = codeResponse.data.invitation_code;
    logTest('获取邀请码', true, `成功获取: ${inviteCode}`);
    
    // 2. 模拟新用户注册
    const registerResponse = await apiCall('/api/invitations?action=register-with-code', {
      method: 'POST',
      body: JSON.stringify({ invitationCode: inviteCode }),
      headers: { 'Authorization': `Bearer new-user-token` }
    });
    
    if (registerResponse.ok && registerResponse.data.success) {
      logTest('邀请注册', true, '注册成功', registerResponse.data.rewards);
    } else {
      logTest('邀请注册', false, registerResponse.data.message || '注册失败');
    }
    
    // 3. 触发首次视频奖励
    const videoRewardResponse = await apiCall('/api/invitations?action=trigger-video-reward', {
      method: 'POST',
      headers: { 'Authorization': `Bearer new-user-token` }
    });
    
    if (videoRewardResponse.ok && videoRewardResponse.data.success) {
      logTest('首次视频奖励', true, '奖励发放成功', videoRewardResponse.data.reward);
    } else {
      logTest('首次视频奖励', false, videoRewardResponse.data.message || '奖励发放失败');
    }
    
  } catch (error) {
    logTest('邀请系统', false, error.message);
  }
}

// 测试2: 积分系统
async function testCreditsSystem() {
  console.log('\n💰 测试积分系统...');
  
  try {
    // 1. 获取积分余额
    const balanceResponse = await apiCall('/api/credits?action=balance');
    if (balanceResponse.ok) {
      logTest('获取积分余额', true, `余额: ${balanceResponse.data.balance}积分`);
    } else {
      logTest('获取积分余额', false, '获取失败');
    }
    
    // 2. 每日签到
    const signinResponse = await apiCall('/api/credits?action=daily-signin', {
      method: 'POST'
    });
    
    if (signinResponse.ok) {
      const result = signinResponse.data;
      if (result.alreadySignedToday) {
        logTest('每日签到', true, '今日已签到');
      } else {
        logTest('每日签到', true, `签到成功，获得${result.creditsEarned}积分`);
      }
    } else {
      logTest('每日签到', false, '签到失败');
    }
    
    // 3. 获取交易历史
    const historyResponse = await apiCall('/api/credits?action=history&limit=5');
    if (historyResponse.ok) {
      const transactions = historyResponse.data.transactions || [];
      logTest('交易历史', true, `获取${transactions.length}条记录`);
    } else {
      logTest('交易历史', false, '获取失败');
    }
    
  } catch (error) {
    logTest('积分系统', false, error.message);
  }
}

// 测试3: 支付系统
async function testPaymentSystem() {
  console.log('\n💳 测试支付系统...');
  
  try {
    // 1. 获取积分套餐
    const packagesResponse = await apiCall('/api/orders?action=packages');
    if (!packagesResponse.ok) {
      throw new Error(`获取套餐失败: ${packagesResponse.data.message}`);
    }
    
    const packages = packagesResponse.data.packages;
    logTest('获取积分套餐', true, `获取${packages.length}个套餐`);
    
    if (packages.length > 0) {
      // 2. 创建订单
      const createOrderResponse = await apiCall('/api/orders?action=create', {
        method: 'POST',
        body: JSON.stringify({
          packageId: packages[0].id,
          paymentMethod: 'ALIPAY'
        })
      });
      
      if (createOrderResponse.ok) {
        const order = createOrderResponse.data.order;
        logTest('创建订单', true, `订单ID: ${order.id}`, {
          status: order.status,
          amount: order.priceYuan
        });
        
        // 3. 查询订单状态
        const statusResponse = await apiCall(`/api/orders?action=get&orderId=${order.id}`);
        if (statusResponse.ok) {
          logTest('查询订单', true, `状态: ${statusResponse.data.order.status}`);
        } else {
          logTest('查询订单', false, '查询失败');
        }
        
        // 4. 取消订单
        const cancelResponse = await apiCall('/api/orders?action=cancel', {
          method: 'POST',
          body: JSON.stringify({ orderId: order.id })
        });
        
        if (cancelResponse.ok && cancelResponse.data.success) {
          logTest('取消订单', true, '取消成功');
        } else {
          logTest('取消订单', false, '取消失败');
        }
      } else {
        logTest('创建订单', false, createOrderResponse.data.message || '创建失败');
      }
    }
    
  } catch (error) {
    logTest('支付系统', false, error.message);
  }
}

// 测试4: 社区功能
async function testCommunityFeatures() {
  console.log('\n🎨 测试社区功能...');
  
  try {
    // 1. 获取作品列表
    const artworksResponse = await apiCall('/api/community?action=list&limit=5');
    if (artworksResponse.ok) {
      const artworks = artworksResponse.data.artworks || [];
      logTest('获取作品列表', true, `获取${artworks.length}个作品`);
      
      if (artworks.length > 0) {
        const artwork = artworks[0];
        
        // 2. 点赞作品
        const likeResponse = await apiCall('/api/community?action=like', {
          method: 'POST',
          body: JSON.stringify({ artworkId: artwork.id })
        });
        
        if (likeResponse.ok) {
          logTest('点赞作品', true, '点赞成功', likeResponse.data.rewards);
        } else {
          logTest('点赞作品', false, likeResponse.data.message || '点赞失败');
        }
        
        // 3. 添加评论
        const commentResponse = await apiCall('/api/community?action=comment', {
          method: 'POST',
          body: JSON.stringify({
            artworkId: artwork.id,
            content: '这是一个测试评论，内容很棒！'
          })
        });
        
        if (commentResponse.ok && commentResponse.data.success) {
          logTest('添加评论', true, '评论成功');
        } else {
          logTest('添加评论', false, commentResponse.data.message || '评论失败');
        }
      }
    } else {
      logTest('获取作品列表', false, '获取失败');
    }
    
  } catch (error) {
    logTest('社区功能', false, error.message);
  }
}

// 测试5: 视频生成功能
async function testVideoGeneration() {
  console.log('\n🎬 测试视频生成功能...');
  
  try {
    // 1. 创建视频任务
    const createResponse = await apiCall('/api/video/start', {
      method: 'POST',
      body: JSON.stringify({
        inputImageUrl: 'https://example.com/test-image.jpg',
        params: {
          prompt: '测试视频生成',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    });
    
    if (createResponse.ok) {
      const taskId = createResponse.data.taskId;
      logTest('创建视频任务', true, `任务ID: ${taskId}`);
      
      // 2. 查询任务状态
      const statusResponse = await apiCall(`/api/video/status?taskId=${encodeURIComponent(taskId)}`);
      if (statusResponse.ok) {
        const task = statusResponse.data;
        logTest('查询视频状态', true, `状态: ${task.status}`, {
          progress: task.progress,
          message: task.message
        });
      } else {
        logTest('查询视频状态', false, '查询失败');
      }
    } else {
      logTest('创建视频任务', false, createResponse.data.message || '创建失败');
    }
    
  } catch (error) {
    logTest('视频生成功能', false, error.message);
  }
}

// 测试6: 审核系统
async function testModerationSystem() {
  console.log('\n🛡️ 测试审核系统...');
  
  try {
    // 1. 获取待审核内容
    const moderationResponse = await apiCall('/api/admin/moderation?action=list&status=pending&limit=5');
    if (moderationResponse.ok) {
      const items = moderationResponse.data.items || [];
      logTest('获取待审核内容', true, `获取${items.length}个待审核项目`);
      
      if (items.length > 0) {
        const item = items[0];
        
        // 2. 审核通过
        const approveResponse = await apiCall('/api/admin/moderation?action=approve', {
          method: 'POST',
          body: JSON.stringify({
            contentId: item.id,
            contentType: item.type,
            reason: '内容符合规范'
          })
        });
        
        if (approveResponse.ok && approveResponse.data.success) {
          logTest('审核通过', true, '审核操作成功');
        } else {
          logTest('审核通过', false, approveResponse.data.message || '审核失败');
        }
      }
    } else {
      logTest('获取待审核内容', false, '获取失败');
    }
    
  } catch (error) {
    logTest('审核系统', false, error.message);
  }
}

// 主测试函数
async function runDemoTests() {
  const startTime = Date.now();
  
  // 运行所有测试
  await testInvitationSystem();
  await testCreditsSystem();
  await testPaymentSystem();
  await testCommunityFeatures();
  await testVideoGeneration();
  await testModerationSystem();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 生成测试报告
  console.log('\n📊 演示环境测试报告');
  console.log('='.repeat(50));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`耗时: ${duration}ms`);
  
  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n🎯 演示环境功能验证完成！');
  
  if (passedTests / totalTests >= 0.8) {
    console.log('✅ 演示环境状态良好，可以进行功能展示');
  } else {
    console.log('⚠️ 演示环境存在问题，建议检查配置');
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: (passedTests / totalTests) * 100,
    duration,
    results: testResults
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  runDemoTests().catch(console.error);
}

module.exports = { runDemoTests };
