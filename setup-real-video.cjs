#!/usr/bin/env node

/**
 * 通义万相真实视频生成功能配置脚本
 * 用于设置API密钥并启用真实视频生成功能
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log(colors.bold(colors.cyan('\n🎬 童画奇旅 - 真实视频生成功能配置\n')));
  
  console.log('本脚本将帮助您配置通义万相2.2 API，启用真实的视频生成功能。\n');
  
  // 检查当前配置状态
  console.log(colors.blue('📋 检查当前配置状态...\n'));
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  let currentApiKey = '';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DASHSCOPE_API_KEY=(.+)/);
    if (match && match[1] && !match[1].includes('your-api-key-here')) {
      currentApiKey = match[1];
      console.log(colors.green('✅ 已配置API密钥'));
    } else {
      console.log(colors.yellow('⚠️  未配置API密钥'));
    }
  } else {
    console.log(colors.yellow('⚠️  .env 文件不存在'));
  }
  
  // 获取API密钥配置指南
  console.log(colors.bold('\n📖 API密钥获取指南：'));
  console.log('1. 访问阿里云百炼平台：https://bailian.console.aliyun.com/');
  console.log('2. 登录您的阿里云账号');
  console.log('3. 进入"API-KEY管理"页面');
  console.log('4. 创建新的API-KEY或使用现有的');
  console.log('5. 确保您的账户有足够的余额用于视频生成');
  console.log('6. API密钥格式通常为：sk-xxxxxxxxxxxxxxxxx\n');
  
  // 询问是否要配置API密钥
  const shouldConfigure = await question(colors.cyan('是否要配置通义万相API密钥？(y/N): '));
  
  if (shouldConfigure.toLowerCase() !== 'y' && shouldConfigure.toLowerCase() !== 'yes') {
    console.log(colors.yellow('\n⏭️  跳过API密钥配置'));
    console.log('您可以稍后手动在 .env 文件中添加：');
    console.log('DASHSCOPE_API_KEY=sk-your-api-key-here\n');
    rl.close();
    return;
  }
  
  // 获取API密钥
  let apiKey = '';
  while (!apiKey) {
    apiKey = await question(colors.cyan('\n请输入您的通义万相API密钥: '));
    
    if (!apiKey) {
      console.log(colors.red('❌ API密钥不能为空'));
      continue;
    }
    
    if (!apiKey.startsWith('sk-')) {
      console.log(colors.yellow('⚠️  API密钥格式可能不正确，通常以 "sk-" 开头'));
      const confirm = await question(colors.cyan('确认继续使用此密钥？(y/N): '));
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        apiKey = '';
        continue;
      }
    }
  }
  
  // 创建或更新.env文件
  console.log(colors.blue('\n📝 更新配置文件...'));
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  // 更新或添加API密钥
  if (envContent.includes('DASHSCOPE_API_KEY=')) {
    envContent = envContent.replace(/DASHSCOPE_API_KEY=.+/, `DASHSCOPE_API_KEY=${apiKey}`);
  } else {
    envContent += `\n# 通义万相API配置\nDASHSCOPE_API_KEY=${apiKey}\n`;
  }
  
  // 写入.env文件
  fs.writeFileSync(envPath, envContent);
  
  console.log(colors.green('✅ 配置文件已更新'));
  
  // 测试API连接
  console.log(colors.blue('\n🧪 测试API连接...'));
  
  try {
    const testResult = await testApiConnection(apiKey);
    if (testResult.success) {
      console.log(colors.green('✅ API连接测试成功！'));
      console.log(colors.green('🎉 真实视频生成功能已启用！'));
    } else {
      console.log(colors.red('❌ API连接测试失败：' + testResult.error));
      console.log(colors.yellow('请检查API密钥是否正确，以及账户余额是否充足'));
    }
  } catch (error) {
    console.log(colors.red('❌ API连接测试出错：' + error.message));
  }
  
  // 显示使用说明
  console.log(colors.bold('\n📋 使用说明：'));
  console.log('1. 重启您的开发服务器（npm run dev）');
  console.log('2. 访问应用并登录');
  console.log('3. 上传图片并生成视频');
  console.log('4. 系统将自动调用通义万相API生成真实视频');
  console.log('5. 视频生成通常需要30-60秒');
  
  console.log(colors.bold('\n💰 费用说明：'));
  console.log('- 使用480P分辨率以降低成本');
  console.log('- 每个视频大约消耗0.5-1元人民币');
  console.log('- 请确保账户有足够余额');
  
  console.log(colors.bold('\n🔧 故障排除：'));
  console.log('- 如果视频生成失败，请检查控制台日志');
  console.log('- 确保图片URL可以公开访问');
  console.log('- 检查API密钥权限和余额');
  
  rl.close();
}

// 测试API连接
async function testApiConnection(apiKey) {
  try {
    const fetch = require('node-fetch');
    
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [{ role: 'user', content: 'test' }]
        }
      }),
      timeout: 10000
    });
    
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'API密钥无效或权限不足' };
    } else if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 运行主函数
main().catch(console.error);
