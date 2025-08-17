#!/usr/bin/env node

/**
 * 本地测试积分 API
 */

// 模拟 Vercel 请求和响应对象
class MockRequest {
  constructor(method = 'GET', headers = {}, url = '/api/credits/balance') {
    this.method = method;
    this.headers = headers;
    this.url = url;
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
  }
  
  setHeader(key, value) {
    this.headers[key] = value;
    return this;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.body = JSON.stringify(data);
    console.log(`📤 响应状态: ${this.statusCode}`);
    console.log(`📋 响应头:`, this.headers);
    console.log(`📄 响应数据:`, this.body);
    return this;
  }
  
  end() {
    console.log(`✅ 响应结束`);
    return this;
  }
}

// 测试积分余额 API
async function testCreditsBalanceAPI() {
  console.log('🧪 测试积分余额 API...\n');
  
  try {
    // 动态导入 API 处理函数
    const { default: handler } = await import('./api/credits/balance.js');
    
    // 创建模拟请求
    const req = new MockRequest('GET', {
      'authorization': 'Bearer test-token-for-testing',
      'content-type': 'application/json'
    });
    
    const res = new MockResponse();
    
    console.log(`📥 请求方法: ${req.method}`);
    console.log(`📥 请求头:`, req.headers);
    console.log(`📥 请求 URL: ${req.url}\n`);
    
    // 调用处理函数
    await handler(req, res);
    
    console.log('\n✅ 积分余额 API 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 测试每日签到 API
async function testDailySigninAPI() {
  console.log('\n🧪 测试每日签到 API...\n');
  
  try {
    // 动态导入 API 处理函数
    const { default: handler } = await import('./api/credits/daily-signin.js');
    
    // 创建模拟请求
    const req = new MockRequest('POST', {
      'authorization': 'Bearer test-token-for-testing',
      'content-type': 'application/json'
    }, '/api/credits/daily-signin');
    
    const res = new MockResponse();
    
    console.log(`📥 请求方法: ${req.method}`);
    console.log(`📥 请求头:`, req.headers);
    console.log(`📥 请求 URL: ${req.url}\n`);
    
    // 调用处理函数
    await handler(req, res);
    
    console.log('\n✅ 每日签到 API 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行所有测试
async function runAllTests() {
  await testCreditsBalanceAPI();
  await testDailySigninAPI();
}

runAllTests();
