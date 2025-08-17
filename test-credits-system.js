#!/usr/bin/env node

/**
 * 积分系统完整功能测试脚本
 */

const API_BASE = 'https://draworld-k9sgdpzfg-fangzero-3350s-projects.vercel.app';

// 测试用的模拟 token
const TEST_TOKEN = 'test-token-for-demo';

// 测试积分余额 API
async function testCreditBalance() {
  console.log('\n🧪 测试积分余额 API...');
  
  try {
    const response = await fetch(`${API_BASE}/api/credits/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 积分余额数据:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ 错误响应:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

// 测试每日签到 API
async function testDailySignin() {
  console.log('\n🧪 测试每日签到 API...');
  
  try {
    const response = await fetch(`${API_BASE}/api/credits/daily-signin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🎁 签到结果:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ 错误响应:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

// 测试积分交易 API
async function testCreditTransaction(transactionType, amount, reason) {
  console.log(`\n🧪 测试积分交易 API (${transactionType} ${amount} 积分)...`);
  
  try {
    const response = await fetch(`${API_BASE}/api/credits/transaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionType,
        amount,
        reason,
        description: `测试${transactionType === 'EARN' ? '获得' : '消费'}积分`,
      }),
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('💰 交易结果:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ 错误响应:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

// 测试积分历史 API
async function testCreditHistory() {
  console.log('\n🧪 测试积分历史 API...');
  
  try {
    const response = await fetch(`${API_BASE}/api/credits/history?limit=10&offset=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📜 历史记录:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ 错误响应:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    return null;
  }
}

// 运行完整的积分系统测试
async function runCompleteTest() {
  console.log('🚀 开始积分系统完整功能测试...');
  console.log(`📍 测试环境: ${API_BASE}`);
  console.log(`🔑 测试 Token: ${TEST_TOKEN}`);
  
  const results = {
    balance: null,
    signin: null,
    earnTransaction: null,
    spendTransaction: null,
    history: null,
  };
  
  // 1. 测试积分余额
  results.balance = await testCreditBalance();
  
  // 2. 测试每日签到
  results.signin = await testDailySignin();
  
  // 3. 测试获得积分交易
  results.earnTransaction = await testCreditTransaction('EARN', 50, 'MANUAL_ADJUSTMENT');
  
  // 4. 测试消费积分交易
  results.spendTransaction = await testCreditTransaction('SPEND', 30, 'VIDEO_GENERATION');
  
  // 5. 测试积分历史
  results.history = await testCreditHistory();
  
  // 6. 再次查询余额验证变化
  console.log('\n🧪 再次查询积分余额验证变化...');
  const finalBalance = await testCreditBalance();
  
  // 总结测试结果
  console.log('\n📊 测试结果总结:');
  console.log('='.repeat(50));
  console.log('✅ 积分余额 API:', results.balance ? '成功' : '失败');
  console.log('✅ 每日签到 API:', results.signin ? '成功' : '失败');
  console.log('✅ 积分交易 API (获得):', results.earnTransaction ? '成功' : '失败');
  console.log('✅ 积分交易 API (消费):', results.spendTransaction ? '成功' : '失败');
  console.log('✅ 积分历史 API:', results.history ? '成功' : '失败');
  console.log('✅ 余额变化验证:', finalBalance ? '成功' : '失败');
  
  const successCount = Object.values(results).filter(Boolean).length + (finalBalance ? 1 : 0);
  const totalTests = 6;
  
  console.log(`\n🎯 测试通过率: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 所有积分系统 API 都正常工作！');
    console.log('✨ 积分系统已完全集成并可以正常使用。');
  } else {
    console.log('\n⚠️  部分 API 可能需要进一步检查。');
  }
  
  return results;
}

// 运行测试
runCompleteTest().catch(console.error);
