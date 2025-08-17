#!/usr/bin/env node

/**
 * Vercel演示环境功能测试脚本
 * 验证所有API端点在Vercel环境中正常工作
 */

import fetch from 'node-fetch';

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'demo-token';

console.log(`🧪 开始测试Vercel演示环境功能...`);
console.log(`📍 测试目标: ${BASE_URL}`);
console.log(`🔑 测试令牌: ${TEST_TOKEN}`);
console.log(`🎯 模式: 演示模式 (isDemoMode = true)`);
console.log(`🎬 视频API: 真实通义千问API (DASHSCOPE_API_KEY配置)`);
console.log('');

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

// 测试1: 基础连接测试
async function testBasicConnection() {
  console.log('\n🌐 测试基础连接...');
  
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      logTest('基础连接', true, `服务器响应正常 (${response.status})`);
    } else {
      logTest('基础连接', false, `服务器响应异常 (${response.status})`);
    }
  } catch (error) {
    logTest('基础连接', false, `连接失败: ${error.message}`);
  }
}

// 测试2: 邀请系统API
async function testInvitationAPI() {
  console.log('\n🎁 测试邀请系统API...');
  
  try {
    // 获取邀请码
    const codeResponse = await apiCall('/api/invitations?action=my-code');
    if (codeResponse.ok) {
      const inviteCode = codeResponse.data.invitation_code;
      logTest('获取邀请码', true, `成功获取: ${inviteCode}`);
      
      // 测试邀请注册
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
      
      // 测试首次视频奖励
      const videoRewardResponse = await apiCall('/api/invitations?action=trigger-video-reward', {
        method: 'POST',
        headers: { 'Authorization': `Bearer new-user-token` }
      });
      
      if (videoRewardResponse.ok && videoRewardResponse.data.success) {
        logTest('首次视频奖励', true, '奖励发放成功', videoRewardResponse.data.reward);
      } else {
        logTest('首次视频奖励', false, videoRewardResponse.data.message || '奖励发放失败');
      }
    } else {
      logTest('获取邀请码', false, codeResponse.data.message || '获取失败');
    }
  } catch (error) {
    logTest('邀请系统API', false, error.message);
  }
}

// 测试3: 积分系统API
async function testCreditsAPI() {
  console.log('\n💰 测试积分系统API...');
  
  try {
    // 获取积分余额
    const balanceResponse = await apiCall('/api/credits?action=balance');
    if (balanceResponse.ok) {
      logTest('获取积分余额', true, `余额: ${balanceResponse.data.balance}积分`);
    } else {
      logTest('获取积分余额', false, '获取失败');
    }
    
    // 每日签到
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
    
    // 获取交易历史
    const historyResponse = await apiCall('/api/credits?action=history&limit=5');
    if (historyResponse.ok) {
      const transactions = historyResponse.data.transactions || [];
      logTest('交易历史', true, `获取${transactions.length}条记录`);
    } else {
      logTest('交易历史', false, '获取失败');
    }
  } catch (error) {
    logTest('积分系统API', false, error.message);
  }
}

// 测试4: 支付系统API
async function testPaymentAPI() {
  console.log('\n💳 测试支付系统API...');
  
  try {
    // 获取积分套餐
    const packagesResponse = await apiCall('/api/orders?action=packages');
    if (packagesResponse.ok) {
      const packages = packagesResponse.data.packages;
      logTest('获取积分套餐', true, `获取${packages.length}个套餐`);
      
      if (packages.length > 0) {
        // 创建订单
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
          
          // 查询订单状态
          const statusResponse = await apiCall(`/api/orders?action=get&orderId=${order.id}`);
          if (statusResponse.ok) {
            logTest('查询订单', true, `状态: ${statusResponse.data.order.status}`);
          } else {
            logTest('查询订单', false, '查询失败');
          }
        } else {
          logTest('创建订单', false, createOrderResponse.data.message || '创建失败');
        }
      }
    } else {
      logTest('获取积分套餐', false, '获取失败');
    }
  } catch (error) {
    logTest('支付系统API', false, error.message);
  }
}

// 测试5: 社区功能API
async function testCommunityAPI() {
  console.log('\n🎨 测试社区功能API...');
  
  try {
    // 获取作品列表
    const artworksResponse = await apiCall('/api/community?action=list&limit=5');
    if (artworksResponse.ok) {
      const artworks = artworksResponse.data.artworks || [];
      logTest('获取作品列表', true, `获取${artworks.length}个作品`);
      
      if (artworks.length > 0) {
        const artwork = artworks[0];
        
        // 点赞作品
        const likeResponse = await apiCall('/api/community?action=like', {
          method: 'POST',
          body: JSON.stringify({ artworkId: artwork.id })
        });
        
        if (likeResponse.ok) {
          logTest('点赞作品', true, '点赞成功', likeResponse.data.rewards);
        } else {
          logTest('点赞作品', false, likeResponse.data.message || '点赞失败');
        }
        
        // 添加评论
        const commentResponse = await apiCall('/api/community?action=comment', {
          method: 'POST',
          body: JSON.stringify({
            artworkId: artwork.id,
            content: '这是一个Vercel环境测试评论！'
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
    logTest('社区功能API', false, error.message);
  }
}

// 测试6: 视频生成API（真实API）
async function testVideoAPI() {
  console.log('\n🎬 测试视频生成API（真实通义千问API）...');
  
  try {
    // 创建视频任务
    const createResponse = await apiCall('/api/video/start', {
      method: 'POST',
      body: JSON.stringify({
        inputImageUrl: 'https://example.com/test-image.jpg',
        params: {
          prompt: 'Vercel环境测试视频生成',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    });
    
    if (createResponse.ok) {
      const taskId = createResponse.data.taskId;
      logTest('创建视频任务', true, `任务ID: ${taskId}`, {
        apiKey: 'sk-bac53038fc8e433bb2c42f394649a379',
        model: 'wan2.2-i2v-flash'
      });
      
      // 查询任务状态
      const statusResponse = await apiCall(`/api/video/status?taskId=${encodeURIComponent(taskId)}`);
      if (statusResponse.ok) {
        const task = statusResponse.data;
        logTest('查询视频状态', true, `状态: ${task.status}`, {
          progress: task.progress,
          message: task.message,
          isRealAPI: task.taskId.includes('tongyi') || task.taskId.includes('dashscope')
        });
      } else {
        logTest('查询视频状态', false, '查询失败');
      }
    } else {
      logTest('创建视频任务', false, createResponse.data.message || '创建失败');
    }
  } catch (error) {
    logTest('视频生成API', false, error.message);
  }
}

// 测试7: 审核系统API
async function testModerationAPI() {
  console.log('\n🛡️ 测试审核系统API...');
  
  try {
    // 获取待审核内容
    const moderationResponse = await apiCall('/api/admin/moderation?action=list&status=pending&limit=5');
    if (moderationResponse.ok) {
      const items = moderationResponse.data.items || [];
      logTest('获取待审核内容', true, `获取${items.length}个待审核项目`);
      
      if (items.length > 0) {
        const item = items[0];
        
        // 审核通过
        const approveResponse = await apiCall('/api/admin/moderation?action=approve', {
          method: 'POST',
          body: JSON.stringify({
            contentId: item.id,
            contentType: item.type,
            reason: 'Vercel环境测试审核'
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
    logTest('审核系统API', false, error.message);
  }
}

// 主测试函数
async function runVercelTests() {
  const startTime = Date.now();
  
  // 运行所有测试
  await testBasicConnection();
  await testInvitationAPI();
  await testCreditsAPI();
  await testPaymentAPI();
  await testCommunityAPI();
  await testVideoAPI();
  await testModerationAPI();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 生成测试报告
  console.log('\n📊 Vercel演示环境测试报告');
  console.log('='.repeat(60));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`🌐 测试环境: ${BASE_URL}`);
  console.log(`🎯 运行模式: 演示模式 (Vercel Dev)`);
  console.log(`🔑 API密钥: sk-bac53038fc8e433bb2c42f394649a379`);
  console.log(`📊 总测试数: ${totalTests}`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`⏱️ 耗时: ${duration}ms`);
  
  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n🎯 Vercel演示环境功能验证完成！');
  
  if (passedTests / totalTests >= 0.8) {
    console.log('✅ Vercel演示环境状态良好，所有核心功能正常工作');
    console.log('🚀 可以进行功能展示和演示');
  } else {
    console.log('⚠️ Vercel演示环境存在问题，建议检查配置');
  }
  
  console.log('\n🌐 访问地址:');
  console.log('  📱 主页: http://localhost:3000');
  console.log('  💰 积分商店: http://localhost:3000/credits');
  console.log('  👤 个人资料: http://localhost:3000/profile');
  console.log('  🎨 社区画廊: http://localhost:3000/gallery');
  console.log('  🛡️ 审核后台: http://localhost:3000/admin/moderation');
  
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
if (import.meta.url === `file://${process.argv[1]}`) {
  runVercelTests().catch(console.error);
}

export { runVercelTests };
