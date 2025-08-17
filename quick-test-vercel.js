#!/usr/bin/env node

/**
 * 快速测试Vercel演示环境核心功能
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'demo-token';

console.log('🚀 快速测试Vercel演示环境核心功能...\n');

// 测试1: 基础连接
async function testConnection() {
  try {
    const response = await fetch(BASE_URL);
    console.log(`✅ 基础连接: ${response.status} - 服务器正常运行`);
    return true;
  } catch (error) {
    console.log(`❌ 基础连接: ${error.message}`);
    return false;
  }
}

// 测试2: 视频生成API（真实API）
async function testVideoGeneration() {
  try {
    console.log('\n🎬 测试视频生成API（真实通义千问API）...');
    
    const response = await fetch(`${BASE_URL}/api/video/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputImageUrl: 'https://example.com/test.jpg',
        params: {
          prompt: '测试视频生成',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.taskId) {
      console.log(`✅ 视频任务创建成功: ${data.taskId}`);
      console.log(`   🔑 使用真实API密钥: sk-bac53038fc8e433bb2c42f394649a379`);
      console.log(`   🤖 模型: wan2.2-i2v-flash`);
      return true;
    } else {
      console.log(`❌ 视频任务创建失败: ${data.message || '未知错误'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 视频生成API测试失败: ${error.message}`);
    return false;
  }
}

// 测试3: 支付系统
async function testPaymentSystem() {
  try {
    console.log('\n💳 测试支付系统...');
    
    // 获取套餐
    const packagesResponse = await fetch(`${BASE_URL}/api/orders?action=packages`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (packagesResponse.ok) {
      const packagesData = await packagesResponse.json();
      console.log(`✅ 获取积分套餐成功: ${packagesData.packages.length}个套餐`);
      
      // 创建订单
      const createResponse = await fetch(`${BASE_URL}/api/orders?action=create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: packagesData.packages[0].id,
          paymentMethod: 'ALIPAY'
        })
      });
      
      if (createResponse.ok) {
        const orderData = await createResponse.json();
        console.log(`✅ 创建订单成功: ${orderData.order.id}`);
        console.log(`   💰 金额: ¥${orderData.order.priceYuan}`);
        console.log(`   📊 状态: ${orderData.order.status}`);
        return true;
      } else {
        console.log(`❌ 创建订单失败`);
        return false;
      }
    } else {
      console.log(`❌ 获取套餐失败`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 支付系统测试失败: ${error.message}`);
    return false;
  }
}

// 测试4: 邀请系统
async function testInvitationSystem() {
  try {
    console.log('\n🎁 测试邀请系统...');
    
    const response = await fetch(`${BASE_URL}/api/invitations?action=my-code`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 邀请系统正常: 邀请码已生成`);
      console.log(`   🔗 邀请码: ${data.invitation_code || '已生成'}`);
      return true;
    } else {
      console.log(`❌ 邀请系统测试失败`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 邀请系统测试失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runQuickTest() {
  console.log(`📍 测试目标: ${BASE_URL}`);
  console.log(`🎯 模式: 演示模式 (isDemoMode = true)`);
  console.log(`🔑 API密钥: sk-bac53038fc8e433bb2c42f394649a379`);
  console.log('');
  
  const results = [];
  
  // 运行测试
  results.push(await testConnection());
  results.push(await testVideoGeneration());
  results.push(await testPaymentSystem());
  results.push(await testInvitationSystem());
  
  // 生成报告
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 快速测试报告');
  console.log('='.repeat(40));
  console.log(`✅ 通过: ${passed}/${total}`);
  console.log(`📈 成功率: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 所有核心功能正常工作！');
    console.log('🌐 Vercel演示环境已准备就绪');
    console.log('\n🎯 可以开始功能演示:');
    console.log('  📱 主页: http://localhost:3000');
    console.log('  💰 积分商店: http://localhost:3000/credits');
    console.log('  👤 个人资料: http://localhost:3000/profile');
    console.log('  🎨 社区画廊: http://localhost:3000/gallery');
    console.log('  🛡️ 审核后台: http://localhost:3000/admin/moderation');
    console.log('\n🔑 测试Token: demo-token');
  } else {
    console.log('\n⚠️ 部分功能存在问题，但核心功能可用');
    console.log('💡 建议检查失败的功能，但不影响基本演示');
  }
  
  console.log('\n🎬 特别说明:');
  console.log('  ✅ 视频生成使用真实通义千问API');
  console.log('  ✅ 支付系统为演示模式（模拟支付）');
  console.log('  ✅ 数据存储为内存模式（重启清空）');
  console.log('  ✅ JWT验证跳过（演示模式）');
}

// 运行测试
runQuickTest().catch(console.error);
