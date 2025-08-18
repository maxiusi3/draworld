#!/usr/bin/env node

/**
 * 简化的生产环境API测试
 * 直接测试TableStore API端点
 */

const PRODUCTION_URL = 'https://draworld-e8ncxonhq-fangzero-3350s-projects.vercel.app';

console.log('🧪 测试生产环境TableStore API...\n');
console.log(`📍 生产URL: ${PRODUCTION_URL}\n`);

async function testAPI(endpoint, description) {
  try {
    console.log(`🔍 测试: ${description}`);
    console.log(`   URL: ${PRODUCTION_URL}${endpoint}`);
    
    const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'TableStore-API-Test/1.0'
      }
    });
    
    console.log(`   状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ 成功响应`);
      
      // 检查响应内容
      if (data.error && data.error.includes('TABLESTORE')) {
        console.log(`   🎯 正确使用 TableStore 配置`);
      } else if (data.error && data.error.includes('Missing required environment variables')) {
        console.log(`   ⚠️  环境变量配置问题`);
      } else if (data.success) {
        console.log(`   🎯 API 正常工作`);
      }
      
      // 显示部分响应数据
      if (data.error) {
        console.log(`   错误: ${data.error.substring(0, 100)}...`);
      } else if (data.packages) {
        console.log(`   数据: 找到 ${data.packages.length} 个积分套餐`);
      } else if (data.data) {
        console.log(`   数据: 找到 ${data.data.length} 个项目`);
      }
    } else {
      const text = await response.text();
      console.log(`   ❌ 失败: ${text.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`   ❌ 网络错误: ${error.message}`);
  }
  
  console.log('');
}

async function runTests() {
  const tests = [
    { endpoint: '/api/orders?action=packages', description: 'Orders API - 积分套餐列表' },
    { endpoint: '/api/artworks', description: 'Artworks API - 作品列表' },
    { endpoint: '/api/credits?action=balance', description: 'Credits API - 积分余额 (需要认证)' },
    { endpoint: '/', description: '前端首页' }
  ];

  for (const test of tests) {
    await testAPI(test.endpoint, test.description);
  }

  console.log('🎯 测试完成！');
  console.log('\n📋 总结:');
  console.log('- 如果看到 "正确使用 TableStore 配置" 说明API已正确迁移');
  console.log('- 如果看到 "环境变量配置问题" 需要检查Vercel环境变量');
  console.log('- 如果看到 "API 正常工作" 说明一切正常');
  console.log('- 如果看到网络错误，可能是部署还在进行中');
}

// 使用原生fetch (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ 需要 Node.js 18+ 或安装 node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
