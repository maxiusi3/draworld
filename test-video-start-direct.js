#!/usr/bin/env node

/**
 * 直接测试 /api/video/start 端点
 */

const API_BASE = 'https://draworld-opal.vercel.app';

async function testVideoStartDirect() {
  console.log('🧪 直接测试 /api/video/start 端点...\n');
  
  const startUrl = `${API_BASE}/api/video/start`;
  
  try {
    console.log(`📍 测试 URL: ${startUrl}`);
    
    const requestBody = {
      inputImageUrl: 'https://storage.googleapis.com/draworld-6898f.appspot.com/users/anonymous/images/1754796515595_WechatIMG3794.jpg',
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
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2OGEzMTI4OWU2MmE4NjZkZmFhODc1OTgiLCJhdWQiOiI2ODlhZGRlNzVlY2I5N2NkMzk2ODYwZWIiLCJpc3MiOiJodHRwczovL2RyYXdvcmxkLmF1dGhpbmcuY24vb2lkYyIsImV4cCI6MTc1Njc5NTgyOSwiaWF0IjoxNzU1NTg2MjI5LCJqdGkiOiJhZGJhNzNhNi1hNzNhLTQ5YzEtOTNhNy1hNzNhNjQ5YzEzYTciLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIHBob25lIGFkZHJlc3MifQ.test'
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
        return result.taskId;
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

// 运行测试
testVideoStartDirect().then(taskId => {
  if (taskId) {
    console.log(`\n✅ 测试完成，获得任务ID: ${taskId}`);
  } else {
    console.log('\n❌ 测试失败');
  }
});
