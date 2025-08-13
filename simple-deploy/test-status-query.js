#!/usr/bin/env node

/**
 * 测试阿里云通义万相2.2任务状态查询
 * 验证修复后的查询API是否正常工作
 */

const fetch = require('node-fetch');

// 配置
const FUNCTION_URL = 'https://us-central1-draworld-6898f.cloudfunctions.net/createVideoTask';

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

async function testCreateAndQuery() {
  log(`${colors.bold}🧪 测试创建任务和状态查询${colors.reset}`, 'green');
  log('=' .repeat(50), 'green');
  
  // 测试数据 - Firebase Functions 格式
  const testData = {
    data: {
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      prompt: '测试状态查询修复',
      musicStyle: 'Joyful',
      aspectRatio: '16:9'
    }
  };
  
  log('\n📋 测试数据:', 'blue');
  console.log(JSON.stringify(testData, null, 2));
  
  log('\n🚀 创建视频任务...', 'blue');
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData),
      timeout: 30000
    });

    log(`📊 响应状态: ${response.status}`, 'yellow');
    
    const responseText = await response.text();
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('📄 响应内容:');
      console.log(JSON.stringify(responseJson, null, 2));
      
      if (response.ok && responseJson.result && responseJson.result.taskId) {
        log('\n✅ 任务创建成功!', 'green');
        log(`🎯 任务ID: ${responseJson.result.taskId}`, 'green');
        
        // 等待一段时间让轮询开始
        log('\n⏳ 等待10秒让轮询开始...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        log('\n📊 检查日志以验证状态查询是否正常...', 'blue');
        return true;
        
      } else {
        log('\n❌ 任务创建失败', 'red');
        return false;
      }
    } catch (parseError) {
      log('\n📄 原始响应内容:', 'yellow');
      console.log(responseText);
      throw new Error(`响应解析失败: ${parseError.message}`);
    }

  } catch (error) {
    log(`❌ 请求失败: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log(`${colors.bold}🔍 状态查询修复验证测试${colors.reset}`, 'green');
  log('=' .repeat(60), 'green');
  
  const success = await testCreateAndQuery();
  
  if (success) {
    log('\n🎉 测试完成！请检查日志确认状态查询是否正常工作', 'green');
    log('运行以下命令查看日志:', 'blue');
    log('npm run logs:create', 'yellow');
  } else {
    log('\n⚠️  测试失败，需要进一步调试', 'yellow');
  }
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log(`❌ 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  main().catch(error => {
    log(`❌ 测试过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  });
}
