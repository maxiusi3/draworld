#!/usr/bin/env node

/**
 * 测试图片上传API修复
 * 验证 /api/upload/image 端点是否正常工作
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🖼️ 测试图片上传API修复...\n');

// 创建一个简单的测试图片 (1x1 像素的 PNG)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

// 测试1: 验证上传API端点
async function testUploadEndpoint() {
  console.log('🔍 测试上传API端点...');
  
  try {
    const uploadUrl = `${BASE_URL}/api/upload/image`;
    console.log(`  📍 测试 URL: ${uploadUrl}`);
    
    const requestBody = {
      imageData: testImageBase64,
      fileName: 'test-image.png',
      contentType: 'image/png'
    };
    
    console.log('  📤 发送上传请求...');
    console.log(`  📋 请求体大小: ${JSON.stringify(requestBody).length} bytes`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-upload'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`  📊 响应状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 上传成功');
      console.log(`  📋 响应消息: ${result.message}`);
      console.log(`  📋 图片URL长度: ${result.url ? result.url.length : 0} 字符`);
      console.log(`  📋 URL前缀: ${result.url ? result.url.substring(0, 50) + '...' : 'N/A'}`);
      
      if (result.success && result.url && result.url.startsWith('data:image/')) {
        console.log('  ✅ 返回格式正确（base64 data URL）');
        return true;
      } else {
        console.log('  ❌ 返回格式错误');
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 上传失败: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 上传测试失败: ${error.message}`);
    return false;
  }
}

// 测试2: 验证认证检查
async function testAuthValidation() {
  console.log('\n🔐 测试认证验证...');
  
  try {
    const uploadUrl = `${BASE_URL}/api/upload/image`;
    
    // 测试无认证头
    console.log('  📋 测试无认证头...');
    const noAuthResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: testImageBase64,
        fileName: 'test.png',
        contentType: 'image/png'
      })
    });
    
    if (noAuthResponse.status === 401) {
      console.log('  ✅ 无认证头正确返回401');
    } else {
      console.log(`  ❌ 无认证头返回状态错误: ${noAuthResponse.status}`);
      return false;
    }
    
    // 测试错误认证头
    console.log('  📋 测试错误认证头...');
    const badAuthResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Invalid token'
      },
      body: JSON.stringify({
        imageData: testImageBase64,
        fileName: 'test.png',
        contentType: 'image/png'
      })
    });
    
    if (badAuthResponse.status === 401) {
      console.log('  ✅ 错误认证头正确返回401');
      return true;
    } else {
      console.log(`  ❌ 错误认证头返回状态错误: ${badAuthResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 认证验证测试失败: ${error.message}`);
    return false;
  }
}

// 测试3: 验证错误处理
async function testErrorHandling() {
  console.log('\n❌ 测试错误处理...');
  
  try {
    const uploadUrl = `${BASE_URL}/api/upload/image`;
    
    // 测试缺少图片数据
    console.log('  📋 测试缺少图片数据...');
    const noDataResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        fileName: 'test.png',
        contentType: 'image/png'
        // 缺少 imageData
      })
    });
    
    if (noDataResponse.status === 400) {
      console.log('  ✅ 缺少图片数据正确返回400');
    } else {
      console.log(`  ❌ 缺少图片数据返回状态错误: ${noDataResponse.status}`);
      return false;
    }
    
    // 测试不支持的方法
    console.log('  📋 测试不支持的方法...');
    const getResponse = await fetch(uploadUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (getResponse.status === 405) {
      console.log('  ✅ 不支持的方法正确返回405');
      return true;
    } else {
      console.log(`  ❌ 不支持的方法返回状态错误: ${getResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 错误处理测试失败: ${error.message}`);
    return false;
  }
}

// 测试4: 验证完整的上传流程
async function testCompleteUploadFlow() {
  console.log('\n🔄 测试完整上传流程...');
  
  try {
    // 模拟更大的图片数据
    const largerImageBase64 = testImageBase64.repeat(10); // 重复10次模拟更大的图片
    
    const uploadUrl = `${BASE_URL}/api/upload/image`;
    console.log(`  📍 上传URL: ${uploadUrl}`);
    
    const requestBody = {
      imageData: largerImageBase64,
      fileName: 'complete-test-image.jpg',
      contentType: 'image/jpeg'
    };
    
    console.log('  📤 发送完整上传请求...');
    console.log(`  📋 文件名: ${requestBody.fileName}`);
    console.log(`  📋 内容类型: ${requestBody.contentType}`);
    console.log(`  📋 数据大小: ${requestBody.imageData.length} 字符`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-user-token'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`  📊 响应状态: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 完整流程上传成功');
      console.log(`  📋 成功标志: ${result.success}`);
      console.log(`  📋 消息: ${result.message}`);
      console.log(`  📋 URL类型: ${result.url ? 'data URL' : '无URL'}`);
      
      // 验证返回的URL是否可用
      if (result.url && result.url.startsWith('data:image/jpeg;base64,')) {
        console.log('  ✅ 返回的data URL格式正确');
        return true;
      } else {
        console.log('  ❌ 返回的data URL格式错误');
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 完整流程上传失败: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 完整流程测试失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runUploadFixTests() {
  console.log('🎯 开始图片上传API修复测试...\n');
  
  const results = [];
  
  try {
    results.push({ name: '上传API端点', success: await testUploadEndpoint() });
    results.push({ name: '认证验证', success: await testAuthValidation() });
    results.push({ name: '错误处理', success: await testErrorHandling() });
    results.push({ name: '完整上传流程', success: await testCompleteUploadFlow() });
    
    // 生成报告
    console.log('\n📊 图片上传API修复测试报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 测试成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 图片上传API修复测试全部通过！');
      
      console.log('\n🔧 修复内容:');
      console.log('✅ 在dev-api-middleware.js中添加/api/upload/image端点');
      console.log('✅ 实现认证验证和错误处理');
      console.log('✅ 支持base64图片数据上传');
      console.log('✅ 返回data URL格式的图片链接');
      
      console.log('\n🎮 现在可以:');
      console.log('• 在创建页面上传图片');
      console.log('• 图片会转换为base64 data URL');
      console.log('• 支持各种图片格式（PNG、JPEG等）');
      console.log('• 完整的错误处理和认证验证');
      
    } else {
      console.log('\n⚠️ 部分测试未通过，可能需要进一步调整');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runUploadFixTests().catch(console.error);
