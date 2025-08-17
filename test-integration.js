#!/usr/bin/env node

/**
 * 集成测试脚本 - 验证关键业务流程
 * 测试邀请奖励、支付流程、社区功能、积分系统的端到端集成
 */

const fetch = require('node-fetch');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'test-token-demo-user';

// 测试结果收集
const testResults = [];

function logTest(name, success, message, details = null) {
  const result = {
    name,
    success,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}: ${message}`);
  if (details) {
    console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
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
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// 测试1: 邀请系统端到端流程
async function testInvitationFlow() {
  console.log('\n🧪 测试邀请系统端到端流程...');
  
  try {
    // 1. 获取邀请码
    const codeResponse = await apiCall('/api/invitations?action=my-code');
    if (!codeResponse.ok) {
      throw new Error(`获取邀请码失败: ${codeResponse.data.message}`);
    }
    
    const inviteCode = codeResponse.data.invitation_code;
    logTest('获取邀请码', true, `成功获取邀请码: ${inviteCode}`);
    
    // 2. 模拟新用户使用邀请码注册
    const registerResponse = await apiCall('/api/invitations?action=register-with-code', {
      method: 'POST',
      body: JSON.stringify({ invitationCode: inviteCode }),
      headers: {
        'Authorization': `Bearer test-token-new-user`
      }
    });
    
    if (registerResponse.ok && registerResponse.data.success) {
      logTest('邀请注册', true, '邀请注册成功', registerResponse.data.rewards);
    } else {
      logTest('邀请注册', false, registerResponse.data.message || '邀请注册失败');
    }
    
    // 3. 触发首次视频奖励
    const videoRewardResponse = await apiCall('/api/invitations?action=trigger-video-reward', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer test-token-new-user`
      }
    });
    
    if (videoRewardResponse.ok && videoRewardResponse.data.success) {
      logTest('首次视频奖励', true, '首次视频奖励发放成功', videoRewardResponse.data.reward);
    } else {
      logTest('首次视频奖励', false, videoRewardResponse.data.message || '首次视频奖励失败');
    }
    
  } catch (error) {
    logTest('邀请系统流程', false, error.message);
  }
}

// 测试2: 支付流程
async function testPaymentFlow() {
  console.log('\n🧪 测试支付流程...');
  
  try {
    // 1. 获取积分套餐
    const packagesResponse = await apiCall('/api/orders?action=packages');
    if (!packagesResponse.ok) {
      throw new Error(`获取套餐失败: ${packagesResponse.data.message}`);
    }
    
    const packages = packagesResponse.data.packages;
    if (!packages || packages.length === 0) {
      throw new Error('没有可用的积分套餐');
    }
    
    logTest('获取积分套餐', true, `成功获取${packages.length}个套餐`);
    
    // 2. 创建订单
    const createOrderResponse = await apiCall('/api/orders?action=create', {
      method: 'POST',
      body: JSON.stringify({
        packageId: packages[0].id,
        paymentMethod: 'ALIPAY'
      })
    });
    
    if (!createOrderResponse.ok) {
      throw new Error(`创建订单失败: ${createOrderResponse.data.message}`);
    }
    
    const order = createOrderResponse.data.order;
    logTest('创建订单', true, `订单创建成功: ${order.id}`, {
      orderId: order.id,
      status: order.status,
      amount: order.priceYuan
    });
    
    // 3. 查询订单状态
    const statusResponse = await apiCall(`/api/orders?action=get&orderId=${order.id}`);
    if (statusResponse.ok) {
      logTest('查询订单状态', true, `订单状态: ${statusResponse.data.order.status}`);
    } else {
      logTest('查询订单状态', false, '查询订单状态失败');
    }
    
    // 4. 取消订单（测试）
    const cancelResponse = await apiCall('/api/orders?action=cancel', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.id })
    });
    
    if (cancelResponse.ok && cancelResponse.data.success) {
      logTest('取消订单', true, '订单取消成功');
    } else {
      logTest('取消订单', false, cancelResponse.data.message || '取消订单失败');
    }
    
  } catch (error) {
    logTest('支付流程', false, error.message);
  }
}

// 测试3: 社区功能
async function testCommunityFlow() {
  console.log('\n🧪 测试社区功能...');
  
  try {
    // 1. 获取作品列表
    const artworksResponse = await apiCall('/api/community?action=list&limit=10');
    if (!artworksResponse.ok) {
      throw new Error(`获取作品列表失败: ${artworksResponse.data.message}`);
    }
    
    const artworks = artworksResponse.data.artworks || [];
    logTest('获取作品列表', true, `成功获取${artworks.length}个作品`);
    
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
        logTest('添加评论', true, '评论添加成功');
      } else {
        logTest('添加评论', false, commentResponse.data.message || '添加评论失败');
      }
    }
    
  } catch (error) {
    logTest('社区功能', false, error.message);
  }
}

// 测试4: 积分系统
async function testCreditsSystem() {
  console.log('\n🧪 测试积分系统...');
  
  try {
    // 1. 获取积分余额
    const balanceResponse = await apiCall('/api/credits?action=balance');
    if (!balanceResponse.ok) {
      throw new Error(`获取积分余额失败: ${balanceResponse.data.message}`);
    }
    
    const balance = balanceResponse.data.balance;
    logTest('获取积分余额', true, `当前余额: ${balance}积分`);
    
    // 2. 获取交易历史
    const historyResponse = await apiCall('/api/credits?action=history&limit=10');
    if (historyResponse.ok) {
      const transactions = historyResponse.data.transactions || [];
      logTest('获取交易历史', true, `获取到${transactions.length}条交易记录`);
    } else {
      logTest('获取交易历史', false, '获取交易历史失败');
    }
    
    // 3. 每日签到
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
      logTest('每日签到', false, '每日签到失败');
    }
    
  } catch (error) {
    logTest('积分系统', false, error.message);
  }
}

// 测试5: 审核系统
async function testModerationSystem() {
  console.log('\n🧪 测试审核系统...');
  
  try {
    // 1. 获取待审核内容
    const moderationResponse = await apiCall('/api/admin/moderation?action=list&status=pending&limit=10');
    if (!moderationResponse.ok) {
      throw new Error(`获取待审核内容失败: ${moderationResponse.data.message}`);
    }
    
    const items = moderationResponse.data.items || [];
    logTest('获取待审核内容', true, `获取到${items.length}个待审核项目`);
    
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
        logTest('审核通过', true, '内容审核通过');
      } else {
        logTest('审核通过', false, approveResponse.data.message || '审核操作失败');
      }
    }
    
  } catch (error) {
    logTest('审核系统', false, error.message);
  }
}

// 主测试函数
async function runIntegrationTests() {
  console.log('🚀 开始运行集成测试...\n');
  console.log(`测试目标: ${BASE_URL}`);
  console.log(`测试令牌: ${TEST_TOKEN}\n`);
  
  const startTime = Date.now();
  
  // 运行所有测试
  await testInvitationFlow();
  await testPaymentFlow();
  await testCommunityFlow();
  await testCreditsSystem();
  await testModerationSystem();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 生成测试报告
  console.log('\n📊 测试报告');
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
  
  console.log('\n✅ 集成测试完成！');
  
  // 返回测试结果
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
  runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };
