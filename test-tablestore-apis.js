#!/usr/bin/env node

/**
 * 测试修正后的 TableStore API 实现
 * 验证 Orders, Artworks, Credits API 是否正确使用 TableStore
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'https://draworld-1vknj9jdw-fangzero-3350s-projects.vercel.app';
const TEST_TOKEN = 'demo-token';

console.log('🧪 测试 TableStore API 修正结果...\n');
console.log(`📍 测试地址: ${BASE_URL}\n`);

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`🔍 测试: ${method} ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    const success = response.ok;
    const status = response.status;
    
    if (success) {
      console.log(`  ✅ 成功 (${status})`);
      
      // 检查响应是否包含 TableStore 特征
      if (data.error && data.error.includes('TableStore')) {
        console.log(`  🎯 正确使用 TableStore`);
      } else if (data.error && data.error.includes('Supabase')) {
        console.log(`  ❌ 仍在使用 Supabase - 需要修正`);
      } else if (data.success) {
        console.log(`  🎯 API 响应正常`);
      }
    } else {
      console.log(`  ❌ 失败 (${status}): ${data.error || data.message}`);
      
      // 检查错误信息中是否包含配置问题
      if (data.message && data.message.includes('TABLESTORE_INSTANCE')) {
        console.log(`  🎯 正确检查 TableStore 环境变量`);
      } else if (data.message && data.message.includes('SUPABASE')) {
        console.log(`  ❌ 仍在检查 Supabase 环境变量 - 需要修正`);
      }
    }
    
    return { success, status, data };
  } catch (error) {
    console.log(`  ❌ 请求失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTableStoreAPITests() {
  console.log('📋 测试计划:\n');
  console.log('1. Orders API - 应使用 OrdersRepository');
  console.log('2. Artworks API - 应使用 CommunityRepository');
  console.log('3. Credits API - 应使用 CreditsService');
  console.log('4. 环境变量检查 - 应检查 TableStore 配置\n');
  
  const tests = [
    // Orders API 测试
    { 
      name: '积分套餐列表', 
      endpoint: '/api/orders?action=packages',
      expectedFeature: 'OrdersRepository'
    },
    { 
      name: '创建订单', 
      endpoint: '/api/orders?action=create',
      method: 'POST',
      body: { packageId: 'basic', paymentMethod: 'ALIPAY' },
      expectedFeature: 'OrdersRepository'
    },
    { 
      name: '订单列表', 
      endpoint: '/api/orders?action=list',
      expectedFeature: 'OrdersRepository'
    },
    
    // Artworks API 测试
    { 
      name: '作品列表', 
      endpoint: '/api/artworks',
      expectedFeature: 'CommunityRepository'
    },
    { 
      name: '作品搜索', 
      endpoint: '/api/artworks?action=search&q=test',
      expectedFeature: 'CommunityRepository'
    },
    
    // Credits API 测试
    { 
      name: '积分余额', 
      endpoint: '/api/credits?action=balance',
      expectedFeature: 'CreditsService'
    },
    { 
      name: '积分历史', 
      endpoint: '/api/credits?action=history',
      expectedFeature: 'CreditsService'
    },
    { 
      name: '每日签到', 
      endpoint: '/api/credits?action=daily-signin',
      method: 'POST',
      expectedFeature: 'CreditsService'
    }
  ];

  const results = [];
  let successCount = 0;
  let tableStoreCount = 0;

  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.method, test.body);
    results.push({ ...test, ...result });
    
    if (result.success) {
      successCount++;
    }
    
    // 检查是否正确使用了 TableStore
    if (result.data && result.data.error) {
      if (result.data.error.includes('TABLESTORE') || 
          result.data.error.includes('ALIBABA_CLOUD')) {
        tableStoreCount++;
        console.log(`  🎯 正确使用 ${test.expectedFeature}`);
      }
    }
    
    console.log(''); // 空行分隔
  }

  // 测试总结
  console.log('📊 测试总结:');
  console.log(`总测试数: ${tests.length}`);
  console.log(`成功响应: ${successCount}`);
  console.log(`TableStore集成: ${tableStoreCount}`);
  console.log('');

  // 详细分析
  console.log('🔍 详细分析:');
  
  const orderTests = results.filter(r => r.endpoint.includes('/api/orders'));
  const artworkTests = results.filter(r => r.endpoint.includes('/api/artworks'));
  const creditTests = results.filter(r => r.endpoint.includes('/api/credits'));
  
  console.log(`Orders API: ${orderTests.length} 个测试`);
  orderTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`  ${status} ${test.name}`);
  });
  
  console.log(`Artworks API: ${artworkTests.length} 个测试`);
  artworkTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`  ${status} ${test.name}`);
  });
  
  console.log(`Credits API: ${creditTests.length} 个测试`);
  creditTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`  ${status} ${test.name}`);
  });

  // 修正建议
  console.log('\n💡 修正状态:');
  if (tableStoreCount === 0) {
    console.log('❌ 所有API仍在使用 Supabase，需要完成 TableStore 迁移');
  } else if (tableStoreCount < tests.length) {
    console.log(`⚠️  部分API已迁移到 TableStore (${tableStoreCount}/${tests.length})，需要完成剩余迁移`);
  } else {
    console.log('✅ 所有API已成功迁移到 TableStore');
  }
  
  console.log('\n🎯 下一步操作:');
  console.log('1. 确保环境变量正确设置:');
  console.log('   - TABLESTORE_INSTANCE');
  console.log('   - ALIBABA_CLOUD_ACCESS_KEY_ID');
  console.log('   - ALIBABA_CLOUD_ACCESS_KEY_SECRET');
  console.log('2. 部署到 Vercel 并测试生产环境');
  console.log('3. 验证 Function Compute 后端服务连接');

  return results;
}

// 运行测试
runTableStoreAPITests().catch(console.error);
