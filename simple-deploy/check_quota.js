#!/usr/bin/env node

/**
 * 阿里云通义万相2.2 额度检查脚本
 * 用于检查当前API的额度状态和使用情况
 */

const fetch = require('node-fetch');

// 配置
const CONFIG = {
  API_KEY: process.env.DASHSCOPE_API_KEY,
  BASE_URL: 'https://dashscope.aliyuncs.com/api/v1',
  MODEL: 'wan2.2-i2v-plus'
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

// 检查API Key
function checkApiKey() {
  if (!CONFIG.API_KEY) {
    log('❌ 未设置 DASHSCOPE_API_KEY 环境变量', 'red');
    log('请设置环境变量或在 .env 文件中配置', 'yellow');
    process.exit(1);
  }
  
  log(`✅ API Key 已设置 (长度: ${CONFIG.API_KEY.length})`, 'green');
}

// 尝试创建一个最小的测试任务来检查额度
async function checkQuotaByTest() {
  log('\n🧪 通过测试请求检查额度状态...', 'blue');
  
  const testPayload = {
    model: CONFIG.MODEL,
    input: {
      prompt: '测试',
      img_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
    },
    parameters: {
      resolution: '480P',
      duration: 5,
      prompt_extend: false,
      watermark: false
    }
  };

  try {
    const response = await fetch(`${CONFIG.BASE_URL}/services/aigc/video-generation/video-synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(testPayload),
      timeout: 15000
    });

    const responseText = await response.text();
    
    log(`📊 响应状态: ${response.status}`, 'yellow');
    log(`📄 响应内容:`, 'yellow');
    console.log(JSON.stringify(JSON.parse(responseText), null, 2));

    if (response.status === 403) {
      const result = JSON.parse(responseText);
      if (result.code === 'AllocationQuota.FreeTierOnly') {
        log('\n❌ 免费额度已用完！', 'red');
        log('需要开通付费模式才能继续使用', 'yellow');
        return 'quota_exhausted';
      }
    } else if (response.status === 200) {
      log('\n✅ 额度正常，可以创建任务', 'green');
      return 'quota_available';
    } else {
      log(`\n⚠️  未知状态: ${response.status}`, 'yellow');
      return 'unknown';
    }

  } catch (error) {
    log(`❌ 请求失败: ${error.message}`, 'red');
    return 'error';
  }
}

// 检查模型可用性
async function checkModelAvailability() {
  log('\n🔍 检查模型可用性...', 'blue');
  
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      timeout: 10000
    });

    if (response.ok) {
      const models = await response.json();
      log('✅ 模型列表获取成功', 'green');
      
      // 查找通义万相相关模型
      if (models.data) {
        const videoModels = models.data.filter(model => 
          model.id && (model.id.includes('wan') || model.id.includes('video'))
        );
        
        if (videoModels.length > 0) {
          log('\n📋 可用的视频生成模型:', 'blue');
          videoModels.forEach(model => {
            log(`  • ${model.id}`, 'yellow');
          });
        } else {
          log('⚠️  未找到视频生成相关模型', 'yellow');
        }
      }
    } else {
      log(`⚠️  模型列表获取失败: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ 检查模型可用性失败: ${error.message}`, 'red');
  }
}

// 显示解决方案
function showSolutions(quotaStatus) {
  log('\n💡 解决方案:', 'blue');
  log('=' .repeat(50), 'blue');
  
  if (quotaStatus === 'quota_exhausted') {
    log('\n🔧 开通付费模式步骤:', 'yellow');
    log('1. 访问: https://bailian.console.aliyun.com/', 'green');
    log('2. 进入"模型广场" → 搜索"通义万相"', 'green');
    log('3. 点击"万相2.2图生视频"模型', 'green');
    log('4. 在管理页面关闭"仅使用免费额度"选项', 'green');
    log('5. 确认开通按量付费模式', 'green');
    
    log('\n💰 费用说明:', 'yellow');
    log('• 480P视频: 0.14元/秒 × 5秒 = 0.7元/视频', 'green');
    log('• 1080P视频: 0.70元/秒 × 5秒 = 3.5元/视频', 'green');
    log('• 建议使用480P，成本更低且质量足够', 'green');
    
  } else if (quotaStatus === 'quota_available') {
    log('\n✅ 额度正常，可以直接使用!', 'green');
    log('运行测试: npm run quick-test', 'blue');
    
  } else {
    log('\n🔍 请检查以下项目:', 'yellow');
    log('1. API Key是否正确', 'green');
    log('2. 网络连接是否正常', 'green');
    log('3. 阿里云账户状态', 'green');
  }
  
  log('\n📖 详细指南:', 'blue');
  log('• enable_paid_mode.md - 付费模式开通指南', 'green');
  log('• README.md - 完整使用文档', 'green');
}

// 主函数
async function main() {
  log(`${colors.bold}🔍 阿里云通义万相2.2 额度检查${colors.reset}`, 'green');
  log('=' .repeat(50), 'green');
  
  // 检查API Key
  checkApiKey();
  
  // 检查模型可用性
  await checkModelAvailability();
  
  // 通过测试请求检查额度
  const quotaStatus = await checkQuotaByTest();
  
  // 显示解决方案
  showSolutions(quotaStatus);
  
  log('\n🎯 检查完成!', 'green');
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log(`❌ 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
});

// 运行检查
if (require.main === module) {
  main().catch(error => {
    log(`❌ 检查过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, checkQuotaByTest };
