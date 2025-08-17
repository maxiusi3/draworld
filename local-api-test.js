#!/usr/bin/env node

/**
 * 本地 API 测试 - 直接运行 API 函数
 */

// 模拟 Vercel 请求和响应对象
class MockRequest {
  constructor(method = 'GET', headers = {}, url = '/api/video/list?limit=20') {
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

// 导入 API 处理函数
async function testVideoListAPI() {
  console.log('🧪 测试视频列表 API...\n');
  
  try {
    // 动态导入 API 处理函数
    const { default: handler } = await import('./api/video/list.js');
    
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
    
    console.log('\n✅ API 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testVideoListAPI();
