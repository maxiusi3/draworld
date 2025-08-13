/**
 * 检查通义万相任务状态
 */

import fetch from 'node-fetch';

const API_KEY = 'sk-d6389256b79645c2a8ca5c9a6b13783c';
const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// 从日志中看到的最新任务ID
const TASK_ID = '49362a98-fd83-4791-966c-88ddaa03a799';

async function checkTaskStatus() {
  console.log('🔍 检查任务状态...');
  console.log('任务ID:', TASK_ID);
  
  try {
    const response = await fetch(`${BASE_URL}/tasks/${TASK_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 10000
    });
    
    console.log('响应状态:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('任务详情:', JSON.stringify(result, null, 2));
      
      if (result.output) {
        const { task_status, submit_time, scheduled_time, end_time } = result.output;
        
        console.log('\n📊 任务状态摘要:');
        console.log('状态:', task_status);
        console.log('提交时间:', submit_time);
        console.log('调度时间:', scheduled_time);
        if (end_time) {
          console.log('结束时间:', end_time);
        }
        
        if (task_status === 'SUCCEEDED') {
          console.log('✅ 任务成功完成！');
          if (result.output.results && result.output.results.length > 0) {
            console.log('视频URL:', result.output.results[0].url);
          }
        } else if (task_status === 'FAILED') {
          console.log('❌ 任务失败');
          if (result.output.code) {
            console.log('错误代码:', result.output.code);
          }
          if (result.output.message) {
            console.log('错误信息:', result.output.message);
          }
        } else if (task_status === 'RUNNING') {
          console.log('⏳ 任务仍在运行中...');
          
          // 计算运行时间
          if (submit_time) {
            const submitDate = new Date(submit_time);
            const now = new Date();
            const runningMinutes = Math.floor((now.getTime() - submitDate.getTime()) / (1000 * 60));
            console.log(`运行时间: ${runningMinutes} 分钟`);
          }
        } else {
          console.log('⏸️ 任务状态:', task_status);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ 查询失败:', errorText);
    }
    
  } catch (error) {
    console.log('❌ 请求异常:', error.message);
  }
}

async function runCheck() {
  await checkTaskStatus();
  
  console.log('\n💡 说明:');
  console.log('- PENDING: 任务排队中');
  console.log('- RUNNING: 任务执行中');
  console.log('- SUCCEEDED: 任务成功完成');
  console.log('- FAILED: 任务执行失败');
  console.log('');
  console.log('视频生成通常需要 3-10 分钟，请耐心等待。');
}

runCheck().catch(console.error);
