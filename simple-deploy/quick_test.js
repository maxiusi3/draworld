#!/usr/bin/env node

/**
 * 阿里云通义万相2.2 快速测试脚本
 * 用于验证付费模式开通后的API功能
 */

const fetch = require('node-fetch');

// 配置
const CONFIG = {
  CREATE_VIDEO_URL: 'https://us-central1-draworld-6898f.cloudfunctions.net/createVideoTask',
  GET_RESULT_URL: 'https://us-central1-draworld-6898f.cloudfunctions.net/getVideoTaskResult',
  TEST_IMAGE_URL: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  POLL_INTERVAL: 10000, // 10秒
  MAX_POLL_ATTEMPTS: 30 // 最多轮询5分钟
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试创建视频任务
async function testCreateTask() {
  log('\n🎬 正在创建视频任务...', 'blue');
  
  const payload = {
    imageUrl: CONFIG.TEST_IMAGE_URL,
    prompt: '一个美丽的山景，微风轻拂，阳光洒在山峰上，云朵缓缓飘过',
    aspectRatio: '16:9'
  };

  log(`📋 请求参数:`, 'yellow');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(CONFIG.CREATE_VIDEO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      timeout: 30000
    });

    const result = await response.json();
    
    log(`📥 API响应:`, 'yellow');
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.taskId) {
      log(`✅ 任务创建成功！`, 'green');
      log(`🆔 任务ID: ${result.taskId}`, 'green');
      return result.taskId;
    } else {
      log(`❌ 任务创建失败: ${result.error}`, 'red');
      
      // 检查是否是免费额度问题
      if (result.error && result.error.includes('AllocationQuota.FreeTierOnly')) {
        log('\n💡 解决方案:', 'yellow');
        log('1. 访问: https://bailian.console.aliyun.com/', 'yellow');
        log('2. 进入"模型广场" → 搜索"通义万相"', 'yellow');
        log('3. 关闭"仅使用免费额度"选项', 'yellow');
        log('4. 开通按量付费模式', 'yellow');
        log('\n📖 详细指南: ./enable_paid_mode.md', 'blue');
      }
      
      return null;
    }
  } catch (error) {
    log(`❌ 网络错误: ${error.message}`, 'red');
    return null;
  }
}

// 查询任务结果
async function checkTaskResult(taskId) {
  try {
    const response = await fetch(`${CONFIG.GET_RESULT_URL}?taskId=${taskId}`, {
      timeout: 15000
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        status: result.status,
        videoUrl: result.videoUrl,
        error: result.error
      };
    } else {
      log(`❌ 查询失败: ${result.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ 查询错误: ${error.message}`, 'red');
    return null;
  }
}

// 轮询任务结果
async function pollTaskResult(taskId) {
  log(`\n🔄 开始轮询任务结果...`, 'blue');
  log(`⏱️  轮询间隔: ${CONFIG.POLL_INTERVAL/1000}秒`, 'yellow');
  log(`🔢 最大尝试次数: ${CONFIG.MAX_POLL_ATTEMPTS}`, 'yellow');

  for (let attempt = 1; attempt <= CONFIG.MAX_POLL_ATTEMPTS; attempt++) {
    log(`\n📋 第 ${attempt}/${CONFIG.MAX_POLL_ATTEMPTS} 次查询...`, 'blue');
    
    const result = await checkTaskResult(taskId);
    
    if (!result) {
      log(`⚠️  查询失败，等待重试...`, 'yellow');
      await sleep(CONFIG.POLL_INTERVAL);
      continue;
    }

    log(`📊 任务状态: ${result.status}`, 'yellow');

    switch (result.status) {
      case 'completed':
        log(`🎉 视频生成完成！`, 'green');
        log(`🎬 视频URL: ${result.videoUrl}`, 'green');
        log(`\n💡 您可以复制上述URL在浏览器中查看视频`, 'blue');
        return result;

      case 'failed':
        log(`💥 视频生成失败: ${result.error || '未知错误'}`, 'red');
        return result;

      case 'processing':
        log(`⏳ 视频正在生成中，请耐心等待...`, 'yellow');
        break;

      default:
        log(`❓ 未知状态: ${result.status}`, 'yellow');
    }

    if (attempt < CONFIG.MAX_POLL_ATTEMPTS) {
      log(`⏰ 等待 ${CONFIG.POLL_INTERVAL/1000} 秒后重试...`, 'yellow');
      await sleep(CONFIG.POLL_INTERVAL);
    }
  }

  log(`⏰ 轮询超时，但任务可能仍在处理中`, 'yellow');
  log(`🔍 您可以稍后手动查询任务状态:`, 'blue');
  log(`curl "${CONFIG.GET_RESULT_URL}?taskId=${taskId}"`, 'blue');
  
  return null;
}

// 睡眠函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主测试函数
async function runQuickTest() {
  log(`${colors.bold}🚀 阿里云通义万相2.2 快速测试${colors.reset}`, 'green');
  log(`${colors.bold}======================================${colors.reset}`, 'green');
  
  // 显示测试信息
  log(`\n📋 测试配置:`, 'blue');
  log(`• 创建任务API: ${CONFIG.CREATE_VIDEO_URL}`, 'yellow');
  log(`• 查询结果API: ${CONFIG.GET_RESULT_URL}`, 'yellow');
  log(`• 测试图片: ${CONFIG.TEST_IMAGE_URL}`, 'yellow');
  
  // 步骤1: 创建任务
  const taskId = await testCreateTask();
  if (!taskId) {
    log(`\n❌ 测试失败：无法创建视频任务`, 'red');
    process.exit(1);
  }

  // 等待一下再开始查询
  log(`\n⏱️  等待5秒后开始查询结果...`, 'yellow');
  await sleep(5000);

  // 步骤2: 轮询结果
  const finalResult = await pollTaskResult(taskId);

  // 测试总结
  log(`\n${colors.bold}📊 测试总结${colors.reset}`, 'blue');
  log(`${'='.repeat(40)}`, 'blue');
  
  if (finalResult && finalResult.status === 'completed') {
    log(`✅ 测试完全成功！`, 'green');
    log(`🎬 视频已生成: ${finalResult.videoUrl}`, 'green');
    log(`\n🎉 恭喜！您的阿里云通义万相2.2 API集成工作正常！`, 'green');
  } else if (finalResult && finalResult.status === 'failed') {
    log(`❌ 视频生成失败`, 'red');
    log(`📝 错误信息: ${finalResult.error}`, 'red');
  } else {
    log(`⚠️  测试部分成功，视频可能还在生成中`, 'yellow');
    log(`🔍 请稍后手动查询任务状态`, 'yellow');
  }

  log(`\n📖 更多信息请查看:`, 'blue');
  log(`• README.md - 完整使用文档`, 'blue');
  log(`• ALIYUN_WANXIANG_SETUP_GUIDE.md - 详细设置指南`, 'blue');
  log(`• enable_paid_mode.md - 付费模式开通指南`, 'blue');
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log(`❌ 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runQuickTest().catch(error => {
    log(`❌ 测试过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runQuickTest,
  testCreateTask,
  checkTaskResult,
  pollTaskResult
};
