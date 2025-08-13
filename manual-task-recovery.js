/**
 * 手动检查任务状态
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

async function checkTaskStatus(aliyunTaskId) {
  console.log(`🔍 检查阿里云任务: ${aliyunTaskId}`);

  try {
    // 查询通义万相任务状态
    const response = await fetch(`${BASE_URL}/tasks/${aliyunTaskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const result = await response.json();
    console.log('任务状态:', result.output.task_status);

    if (result.output.task_status === 'SUCCEEDED') {
      console.log('✅ 任务成功完成！');

      if (result.output.results && result.output.results.length > 0) {
        const videoUrl = result.output.results[0].url;
        console.log('🎬 视频URL:', videoUrl);
        console.log('\n📋 请手动更新 Firestore 中的任务状态为 completed，并添加 videoUrl');
        return true;
      }

    } else if (result.output.task_status === 'FAILED') {
      console.log('❌ 任务失败');
      console.log('错误信息:', result.output.message || '未知错误');
      console.log('\n📋 请手动更新 Firestore 中的任务状态为 failed');
      return true;

    } else if (result.output.task_status === 'RUNNING') {
      console.log('⏳ 任务仍在运行中...');

      // 计算运行时间
      if (result.output.submit_time) {
        const submitDate = new Date(result.output.submit_time);
        const now = new Date();
        const runningMinutes = Math.floor((now.getTime() - submitDate.getTime()) / (1000 * 60));
        console.log(`运行时间: ${runningMinutes} 分钟`);

        if (runningMinutes > 15) {
          console.log('⚠️ 任务运行时间过长，可能需要手动检查');
        }
      }

      return false; // 仍在运行
    }

  } catch (error) {
    console.log('❌ 检查任务失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始检查任务状态...');

  // 检查特定任务（如果提供了参数）
  const args = process.argv.slice(2);
  if (args.length >= 1) {
    const aliyunTaskId = args[0];
    console.log('检查指定任务...');
    await checkTaskStatus(aliyunTaskId);
  } else {
    // 检查默认任务
    const defaultTaskId = '49362a98-fd83-4791-966c-88ddaa03a799';
    console.log('检查默认任务...');
    await checkTaskStatus(defaultTaskId);
  }

  console.log('\n✅ 检查完成');
  process.exit(0);
}

main().catch(console.error);
