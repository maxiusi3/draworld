const fetch = require('node-fetch');

// Cloud Function URLs
const CREATE_VIDEO_URL = 'https://us-central1-draworld-6898f.cloudfunctions.net/createVideoTask';
const GET_RESULT_URL = 'https://us-central1-draworld-6898f.cloudfunctions.net/getVideoTaskResult';

// 测试用的图片URL（使用一个公开的测试图片）
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';

async function testCreateVideoTask() {
  console.log('🎬 测试创建视频任务...');
  
  try {
    const response = await fetch(CREATE_VIDEO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: TEST_IMAGE_URL,
        prompt: '一个美丽的山景，微风轻拂，阳光洒在山峰上',
        aspectRatio: '16:9'
      })
    });

    const result = await response.json();
    console.log('创建任务响应:', result);

    if (result.success && result.taskId) {
      console.log('✅ 任务创建成功！任务ID:', result.taskId);
      return result.taskId;
    } else {
      console.log('❌ 任务创建失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建任务时发生错误:', error);
    return null;
  }
}

async function testGetVideoTaskResult(taskId) {
  console.log('📋 测试获取任务结果...');
  
  try {
    const response = await fetch(`${GET_RESULT_URL}?taskId=${taskId}`);
    const result = await response.json();
    
    console.log('获取结果响应:', result);

    if (result.success) {
      console.log('✅ 获取结果成功！');
      console.log('任务状态:', result.status);
      if (result.videoUrl) {
        console.log('视频URL:', result.videoUrl);
      }
      return result;
    } else {
      console.log('❌ 获取结果失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取结果时发生错误:', error);
    return null;
  }
}

async function pollTaskResult(taskId, maxAttempts = 30) {
  console.log('🔄 开始轮询任务结果...');
  
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`第 ${i + 1} 次查询...`);
    
    const result = await testGetVideoTaskResult(taskId);
    
    if (result && result.status === 'completed') {
      console.log('🎉 视频生成完成！');
      console.log('视频URL:', result.videoUrl);
      return result;
    } else if (result && result.status === 'failed') {
      console.log('💥 视频生成失败:', result.error);
      return result;
    } else if (result && result.status === 'processing') {
      console.log('⏳ 视频正在生成中，等待10秒后重试...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('❓ 未知状态，等待5秒后重试...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('⏰ 轮询超时，请手动检查任务状态');
  return null;
}

async function runFullTest() {
  console.log('🚀 开始完整的API测试...\n');
  
  // 1. 创建视频任务
  const taskId = await testCreateVideoTask();
  if (!taskId) {
    console.log('❌ 测试失败：无法创建任务');
    return;
  }
  
  console.log('\n⏱️  等待5秒后开始查询结果...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 2. 轮询任务结果
  const finalResult = await pollTaskResult(taskId);
  
  if (finalResult && finalResult.status === 'completed') {
    console.log('\n🎊 测试完全成功！');
    console.log('最终视频URL:', finalResult.videoUrl);
  } else {
    console.log('\n⚠️  测试部分成功，但视频可能还在生成中');
    console.log('您可以稍后使用以下命令手动查询：');
    console.log(`node -e "
      const fetch = require('node-fetch');
      fetch('${GET_RESULT_URL}?taskId=${taskId}')
        .then(r => r.json())
        .then(console.log);
    "`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runFullTest().catch(console.error);
}

module.exports = {
  testCreateVideoTask,
  testGetVideoTaskResult,
  pollTaskResult,
  runFullTest
};
