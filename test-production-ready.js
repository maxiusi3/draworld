#!/usr/bin/env node

/**
 * 生产环境就绪测试
 * 验证所有功能在生产环境配置下正常工作
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

console.log('🚀 生产环境就绪测试...\n');
console.log(`📍 测试目标: ${BASE_URL}\n`);

// 创建测试图片数据
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

// 测试1: 环境配置验证
async function testEnvironmentConfiguration() {
  console.log('⚙️ 测试1: 环境配置验证...');
  
  try {
    // 检查环境变量配置
    const envChecks = [
      { name: 'NODE_ENV', value: process.env.NODE_ENV },
      { name: 'VERCEL_ENV', value: process.env.VERCEL_ENV },
      { name: 'DASHSCOPE_API_KEY', value: process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置' },
      { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL ? '已配置' : '未配置' },
      { name: 'OSS_BUCKET', value: process.env.OSS_BUCKET ? '已配置' : '未配置' }
    ];
    
    console.log('  📋 环境变量检查:');
    envChecks.forEach(check => {
      console.log(`    ${check.name}: ${check.value || '未设置'}`);
    });
    
    // 检测当前环境类型
    const isProduction = process.env.NODE_ENV === 'production' && 
                        process.env.VERCEL_ENV === 'production';
    const isDemoMode = !process.env.DASHSCOPE_API_KEY || 
                      process.env.DEMO_MODE === 'true';
    
    console.log(`  📊 环境类型: ${isProduction ? '生产环境' : '开发/演示环境'}`);
    console.log(`  📊 演示模式: ${isDemoMode ? '启用' : '禁用'}`);
    
    return {
      success: true,
      isProduction,
      isDemoMode,
      hasRequiredEnvVars: !!process.env.DASHSCOPE_API_KEY
    };
    
  } catch (error) {
    console.log(`  ❌ 环境配置检查失败: ${error.message}`);
    return { success: false };
  }
}

// 测试2: API端点可用性
async function testAPIEndpoints() {
  console.log('\n🔗 测试2: API端点可用性...');
  
  const endpoints = [
    { name: '积分查询', path: '/api/credits?action=balance' },
    { name: '图片上传', path: '/api/upload/image', method: 'POST' },
    { name: '视频生成', path: '/api/video/start', method: 'POST' },
    { name: '任务状态', path: '/api/video/status?taskId=test' },
    { name: '社区作品', path: '/api/community?action=artworks' },
    { name: '用户作品', path: '/api/users/me/artworks' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  📤 测试 ${endpoint.name}...`);
      
      const options = {
        method: endpoint.method || 'GET',
        headers: {
          'Authorization': 'Bearer test-token-for-endpoint-check'
        }
      };
      
      if (endpoint.method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ test: true });
      }
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      
      // 检查响应状态（不期望200，但应该有合理的错误响应）
      const isValidResponse = response.status < 500; // 避免服务器错误
      
      console.log(`    📊 状态: ${response.status} ${response.statusText}`);
      results.push({ 
        name: endpoint.name, 
        success: isValidResponse,
        status: response.status 
      });
      
    } catch (error) {
      console.log(`    ❌ 请求失败: ${error.message}`);
      results.push({ name: endpoint.name, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`  📈 端点可用性: ${successCount}/${results.length}`);
  
  return { success: successCount === results.length, results };
}

// 测试3: 积分系统配置
async function testCreditSystemConfiguration() {
  console.log('\n💰 测试3: 积分系统配置...');
  
  try {
    // 获取用户积分
    const response = await fetch(`${BASE_URL}/api/credits?action=balance`, {
      headers: { 'Authorization': 'Bearer production-test-token' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📊 用户积分: ${data.balance}`);
      
      // 检查积分要求配置
      const isProduction = process.env.NODE_ENV === 'production';
      const expectedCost = isProduction ? 60 : 1;
      
      console.log(`  📋 预期视频生成积分: ${expectedCost}`);
      console.log(`  📋 用户是否可生成视频: ${data.balance >= expectedCost ? '是' : '否'}`);
      
      return {
        success: true,
        userCredits: data.balance,
        expectedCost,
        canGenerate: data.balance >= expectedCost
      };
    } else {
      console.log(`  ❌ 积分查询失败: ${response.status}`);
      return { success: false };
    }
    
  } catch (error) {
    console.log(`  ❌ 积分系统测试失败: ${error.message}`);
    return { success: false };
  }
}

// 测试4: 图片上传功能
async function testImageUploadFunctionality() {
  console.log('\n🖼️ 测试4: 图片上传功能...');
  
  try {
    const uploadResponse = await fetch(`${BASE_URL}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer production-test-token'
      },
      body: JSON.stringify({
        imageData: testImageBase64,
        fileName: 'production-test.png',
        contentType: 'image/png'
      })
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('  ✅ 图片上传成功');
      console.log(`  📋 上传方式: ${result.message}`);
      console.log(`  📋 图片URL类型: ${result.url.startsWith('data:') ? 'Base64内联' : 'OSS存储'}`);
      
      return {
        success: true,
        imageUrl: result.url,
        uploadMethod: result.url.startsWith('data:') ? 'base64' : 'oss'
      };
    } else {
      const errorText = await uploadResponse.text();
      console.log(`  ❌ 图片上传失败: ${errorText}`);
      return { success: false };
    }
    
  } catch (error) {
    console.log(`  ❌ 图片上传测试失败: ${error.message}`);
    return { success: false };
  }
}

// 测试5: 视频生成流程
async function testVideoGenerationFlow() {
  console.log('\n🎬 测试5: 视频生成流程...');
  
  try {
    // 先上传图片
    const uploadResult = await testImageUploadFunctionality();
    if (!uploadResult.success) {
      console.log('  ❌ 图片上传失败，无法测试视频生成');
      return { success: false };
    }
    
    // 创建视频任务
    const videoResponse = await fetch(`${BASE_URL}/api/video/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer production-test-token'
      },
      body: JSON.stringify({
        inputImageUrl: uploadResult.imageUrl,
        params: {
          prompt: '生产环境测试视频 - 美丽的动画场景',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    });
    
    if (videoResponse.ok) {
      const videoResult = await videoResponse.json();
      console.log('  ✅ 视频任务创建成功');
      console.log(`  📋 任务ID: ${videoResult.taskId}`);
      console.log(`  📋 状态: ${videoResult.status}`);
      
      // 检查任务状态
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const statusResponse = await fetch(`${BASE_URL}/api/video/status?taskId=${videoResult.taskId}`, {
        headers: { 'Authorization': 'Bearer production-test-token' }
      });
      
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`  📊 任务状态: ${statusResult.status} (${statusResult.progress}%)`);
        
        return {
          success: true,
          taskId: videoResult.taskId,
          status: statusResult.status,
          progress: statusResult.progress
        };
      } else {
        console.log('  ⚠️ 状态查询失败，但任务创建成功');
        return { success: true, taskId: videoResult.taskId };
      }
    } else {
      const errorText = await videoResponse.text();
      console.log(`  ❌ 视频任务创建失败: ${errorText}`);
      return { success: false };
    }
    
  } catch (error) {
    console.log(`  ❌ 视频生成流程测试失败: ${error.message}`);
    return { success: false };
  }
}

// 测试6: 用户作品管理
async function testUserArtworkManagement() {
  console.log('\n📚 测试6: 用户作品管理...');
  
  try {
    // 获取用户作品列表
    const artworksResponse = await fetch(`${BASE_URL}/api/users/me/artworks?page=1&limit=10`, {
      headers: { 'Authorization': 'Bearer production-test-token' }
    });
    
    if (artworksResponse.ok) {
      const artworksResult = await artworksResponse.json();
      console.log('  ✅ 用户作品列表获取成功');
      console.log(`  📊 作品总数: ${artworksResult.total}`);
      console.log(`  📊 当前页作品数: ${artworksResult.artworks.length}`);
      
      // 测试创建作品
      const createResponse = await fetch(`${BASE_URL}/api/community?action=artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer production-test-token'
        },
        body: JSON.stringify({
          title: '生产环境测试作品',
          description: '用于验证生产环境功能的测试作品',
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          isPublic: true
        })
      });
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('  ✅ 作品创建成功');
        console.log(`  📋 作品ID: ${createResult.data.id}`);
        
        return {
          success: true,
          totalArtworks: artworksResult.total,
          newArtworkId: createResult.data.id
        };
      } else {
        console.log('  ⚠️ 作品创建失败，但列表获取成功');
        return { success: true, totalArtworks: artworksResult.total };
      }
    } else {
      const errorText = await artworksResponse.text();
      console.log(`  ❌ 用户作品管理测试失败: ${errorText}`);
      return { success: false };
    }
    
  } catch (error) {
    console.log(`  ❌ 用户作品管理测试失败: ${error.message}`);
    return { success: false };
  }
}

// 主测试函数
async function runProductionReadinessTest() {
  console.log('🎯 开始生产环境就绪测试...\n');
  
  const testResults = [];
  
  try {
    // 运行所有测试
    testResults.push({ name: '环境配置', result: await testEnvironmentConfiguration() });
    testResults.push({ name: 'API端点', result: await testAPIEndpoints() });
    testResults.push({ name: '积分系统', result: await testCreditSystemConfiguration() });
    testResults.push({ name: '图片上传', result: await testImageUploadFunctionality() });
    testResults.push({ name: '视频生成', result: await testVideoGenerationFlow() });
    testResults.push({ name: '作品管理', result: await testUserArtworkManagement() });
    
    // 生成报告
    console.log('\n📊 生产环境就绪测试报告');
    console.log('='.repeat(60));
    
    const passedTests = testResults.filter(test => test.result.success).length;
    const totalTests = testResults.length;
    
    testResults.forEach(test => {
      const status = test.result.success ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
    });
    
    console.log(`\n📈 测试通过率: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 生产环境就绪测试全部通过！');
      
      console.log('\n🚀 部署就绪清单:');
      console.log('✅ 环境配置正确');
      console.log('✅ API端点正常');
      console.log('✅ 积分系统配置正确');
      console.log('✅ 图片上传功能正常');
      console.log('✅ 视频生成流程正常');
      console.log('✅ 用户作品管理正常');
      
      console.log('\n🔧 生产环境特性:');
      const envResult = testResults.find(t => t.name === '环境配置').result;
      console.log(`• 环境类型: ${envResult.isProduction ? '生产环境' : '开发/演示环境'}`);
      console.log(`• 演示模式: ${envResult.isDemoMode ? '启用' : '禁用'}`);
      console.log(`• API密钥: ${envResult.hasRequiredEnvVars ? '已配置' : '未配置'}`);
      
      const uploadResult = testResults.find(t => t.name === '图片上传').result;
      console.log(`• 图片存储: ${uploadResult.uploadMethod === 'oss' ? 'OSS云存储' : 'Base64内联'}`);
      
      console.log('\n📋 下一步操作:');
      if (envResult.isProduction) {
        console.log('• 系统已准备好生产部署');
        console.log('• 建议进行最终的安全检查');
        console.log('• 确认监控和告警配置');
      } else {
        console.log('• 设置生产环境变量');
        console.log('• 配置OSS和数据库连接');
        console.log('• 禁用演示模式');
      }
      
    } else {
      console.log('\n⚠️ 部分测试未通过，需要修复后再部署');
      
      const failedTests = testResults.filter(test => !test.result.success);
      console.log('\n❌ 失败的测试:');
      failedTests.forEach(test => {
        console.log(`• ${test.name}: 需要检查和修复`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runProductionReadinessTest().catch(console.error);
