#!/usr/bin/env node

/**
 * API 端点测试脚本
 * 用于验证 Vercel API 路由是否正常工作
 */

import https from 'https';
import http from 'http';

// 测试配置
const testConfigs = [
  {
    name: '当前配置的 API 端点',
    url: 'https://draworld-40ab9jct3-fangzero-3350s-projects.vercel.app/api/video/list?limit=20'
  },
  {
    name: '错误信息中的 API 端点',
    url: 'https://draworld-8criq4oss-fangzero-3350s-projects.vercel.app/api/video/list?limit=20'
  }
];

// 测试函数
async function testEndpoint(config) {
  return new Promise((resolve) => {
    console.log(`\n🧪 测试: ${config.name}`);
    console.log(`📍 URL: ${config.url}`);
    
    const url = new URL(config.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-for-testing',
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script/1.0'
      },
      timeout: 10000
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 状态码: ${res.statusCode}`);
        console.log(`📋 响应头:`, JSON.stringify(res.headers, null, 2));
        
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`📄 响应数据:`, JSON.stringify(jsonData, null, 2));
          } catch (e) {
            console.log(`📄 响应数据 (原始):`, data.substring(0, 500));
          }
        }
        
        resolve({
          success: res.statusCode < 400,
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 请求错误:`, error.message);
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      console.log(`⏰ 请求超时`);
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始 API 端点测试...\n');
  
  const results = [];
  
  for (const config of testConfigs) {
    const result = await testEndpoint(config);
    results.push({ config, result });
    
    // 等待一秒再测试下一个
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 总结结果
  console.log('\n📊 测试结果总结:');
  console.log('='.repeat(50));
  
  results.forEach(({ config, result }, index) => {
    console.log(`\n${index + 1}. ${config.name}`);
    console.log(`   状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    if (result.statusCode) {
      console.log(`   状态码: ${result.statusCode}`);
    }
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  console.log('\n🏁 测试完成!');
}

// 运行测试
runTests().catch(console.error);

export { testEndpoint, runTests };
