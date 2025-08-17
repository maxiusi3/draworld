#!/usr/bin/env node

/**
 * 简单的 API 测试脚本
 */

const API_BASE = 'https://draworld-eca7ckix7-fangzero-3350s-projects.vercel.app';

async function testAPI() {
  console.log('🧪 测试 API 端点...');
  
  try {
    const url = `${API_BASE}/api/video/list?limit=20`;
    console.log(`📍 测试 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ 状态码: ${response.status}`);
    console.log(`📋 状态文本: ${response.statusText}`);
    
    const data = await response.text();
    console.log(`📄 响应数据:`, data);
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(data);
        console.log(`🎉 JSON 解析成功:`, JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(`⚠️  响应不是有效的 JSON`);
      }
    }
    
  } catch (error) {
    console.error(`❌ 错误:`, error.message);
  }
}

testAPI();
