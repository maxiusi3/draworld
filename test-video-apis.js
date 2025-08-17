#!/usr/bin/env node

/**
 * 测试视频生成相关的 API
 */

const API_BASE = 'https://draworld-11nudjfte-fangzero-3350s-projects.vercel.app';

// 测试视频任务创建 API
async function testVideoStartAPI() {
  console.log('🧪 测试视频任务创建 API...\n');
  
  const startUrl = `${API_BASE}/api/video/start`;
  
  try {
    console.log(`📍 测试 URL: ${startUrl}`);
    
    const requestBody = {
      inputImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
      params: {
        prompt: '测试视频生成：一个美丽的风景',
        aspectRatio: '16:9',
        musicStyle: 'Joyful'
      }
    };
    
    console.log('📤 发送创建任务请求...');
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(startUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-testing'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 响应内容:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('🎉 任务创建成功!');
        console.log('任务 ID:', result.taskId);
        console.log('状态:', result.status);
        console.log('消息:', result.message);
        return result.taskId; // 返回任务ID用于后续测试
      } catch (e) {
        console.log('⚠️  响应不是有效的 JSON');
      }
    } else {
      console.log('❌ 任务创建失败');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
  
  return null;
}

// 测试视频任务状态查询 API
async function testVideoStatusAPI(taskId) {
  console.log('\n🧪 测试视频任务状态查询 API...\n');
  
  if (!taskId) {
    console.log('❌ 没有任务ID，跳过状态查询测试');
    return;
  }
  
  const statusUrl = `${API_BASE}/api/video/status?taskId=${taskId}`;
  
  try {
    console.log(`📍 测试 URL: ${statusUrl}`);
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-for-testing'
      }
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 响应内容:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('🎉 状态查询成功!');
        console.log('任务 ID:', result.taskId);
        console.log('状态:', result.status);
        console.log('进度:', result.progress + '%');
        console.log('视频 URL:', result.resultVideoUrl || '尚未生成');
        console.log('消息:', result.message);
      } catch (e) {
        console.log('⚠️  响应不是有效的 JSON');
      }
    } else {
      console.log('❌ 状态查询失败');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 测试视频列表 API
async function testVideoListAPI() {
  console.log('\n🧪 测试视频列表 API...\n');
  
  const listUrl = `${API_BASE}/api/video/list?limit=5`;
  
  try {
    console.log(`📍 测试 URL: ${listUrl}`);
    
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-for-testing'
      }
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 响应内容:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('🎉 列表查询成功!');
        console.log('任务数量:', result.tasks ? result.tasks.length : 0);
        console.log('消息:', result.message);
      } catch (e) {
        console.log('⚠️  响应不是有效的 JSON');
      }
    } else {
      console.log('❌ 列表查询失败');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 测试图片上传 API
async function testImageUploadAPI() {
  console.log('\n🧪 测试图片上传 API...\n');
  
  const uploadUrl = `${API_BASE}/api/upload/image`;
  
  // 创建一个简单的测试图片 (1x1 像素的 PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  
  try {
    console.log(`📍 测试 URL: ${uploadUrl}`);
    
    const requestBody = {
      imageData: testImageBase64,
      fileName: 'test-image.png',
      contentType: 'image/png'
    };
    
    console.log('📤 发送上传请求...');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-testing'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 响应内容:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('🎉 图片上传成功!');
        console.log('图片 URL 长度:', result.url ? result.url.length : 0);
        console.log('消息:', result.message);
        return result.url; // 返回图片URL用于后续测试
      } catch (e) {
        console.log('⚠️  响应不是有效的 JSON');
      }
    } else {
      console.log('❌ 图片上传失败');
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
  
  return null;
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始测试所有视频生成相关的 API...\n');
  
  // 1. 测试图片上传
  const imageUrl = await testImageUploadAPI();
  
  // 2. 测试视频任务创建
  const taskId = await testVideoStartAPI();
  
  // 3. 测试视频任务状态查询
  await testVideoStatusAPI(taskId);
  
  // 4. 测试视频列表
  await testVideoListAPI();
  
  console.log('\n🏁 所有测试完成!');
  
  // 总结
  console.log('\n📊 测试结果总结:');
  console.log('='.repeat(50));
  console.log('✅ 图片上传 API:', imageUrl ? '成功' : '失败');
  console.log('✅ 视频任务创建 API:', taskId ? '成功' : '失败');
  console.log('✅ 视频任务状态查询 API: 已测试');
  console.log('✅ 视频列表 API: 已测试');
  
  if (imageUrl && taskId) {
    console.log('\n🎉 所有核心 API 都正常工作！');
    console.log('现在可以在主应用中测试完整的视频生成流程。');
  } else {
    console.log('\n⚠️  部分 API 可能需要进一步检查。');
  }
}

// 运行测试
runAllTests();
