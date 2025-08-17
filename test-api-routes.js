#!/usr/bin/env node

/**
 * 测试API路由是否正常工作
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'demo-token';

console.log('🧪 测试API路由...\n');

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
    
    console.log(`📍 测试: ${method} ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await response.text();
    
    console.log(`   状态: ${response.status}`);
    console.log(`   内容类型: ${response.headers.get('content-type')}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        console.log(`   ✅ JSON响应正常`);
        return { success: true, data };
      } catch (e) {
        console.log(`   ❌ JSON解析失败`);
        console.log(`   原始内容: ${text.substring(0, 100)}...`);
        return { success: false, error: 'JSON解析失败', text };
      }
    } else {
      console.log(`   ❌ 非JSON响应`);
      console.log(`   原始内容: ${text.substring(0, 100)}...`);
      return { success: false, error: '非JSON响应', text };
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAPITests() {
  console.log(`🎯 测试目标: ${BASE_URL}\n`);
  
  const tests = [
    // 视频相关API
    { name: '视频列表', endpoint: '/api/video/list' },
    { name: '视频状态', endpoint: '/api/video/status?taskId=test-task' },
    
    // 订单相关API
    { name: '积分套餐', endpoint: '/api/orders?action=packages' },
    { name: '订单列表', endpoint: '/api/orders?action=list' },
    
    // 积分相关API
    { name: '积分余额', endpoint: '/api/credits?action=balance' },
    
    // 邀请相关API
    { name: '邀请码', endpoint: '/api/invitations?action=my-code' },
    
    // 社区相关API
    { name: '社区作品', endpoint: '/api/community?action=list' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    const result = await testAPI(test.endpoint);
    results.push({ ...test, ...result });
    
    if (result.success) {
      console.log(`   ✅ 成功`);
    } else {
      console.log(`   ❌ 失败: ${result.error}`);
    }
  }
  
  // 生成报告
  console.log('\n📊 API测试报告');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ 成功: ${successful}/${total}`);
  console.log(`❌ 失败: ${total - successful}/${total}`);
  console.log(`📈 成功率: ${((successful / total) * 100).toFixed(1)}%`);
  
  if (successful < total) {
    console.log('\n❌ 失败的API:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
      if (r.text && r.text.includes('export')) {
        console.log(`    💡 可能原因: API返回了JavaScript代码而不是JSON`);
      }
    });
  }
  
  console.log('\n💡 修复建议:');
  if (results.some(r => !r.success && r.text?.includes('export'))) {
    console.log('1. API路由可能没有正确配置为Vercel函数');
    console.log('2. 检查vite.config.ts中的API代理配置');
    console.log('3. 确保使用正确的开发服务器（Vercel dev vs Vite dev）');
  }
  
  return results;
}

// 运行测试
runAPITests().catch(console.error);
