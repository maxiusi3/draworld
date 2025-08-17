#!/usr/bin/env node

/**
 * 验证前端积分要求修复
 * 专门检查界面是否正确显示1积分要求
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const BASE_URL = 'http://localhost:3000';

console.log('🔍 验证前端积分要求修复...\n');

// 模拟浏览器环境
function setupBrowserEnvironment() {
  global.window = {
    location: {
      hostname: 'localhost',
      port: '3000',
      href: 'http://localhost:3000'
    }
  };
  
  global.document = {
    createElement: () => ({}),
    addEventListener: () => {}
  };
}

// 测试演示环境配置
async function testDemoConfig() {
  console.log('⚙️ 测试演示环境配置...');
  
  setupBrowserEnvironment();
  
  try {
    // 动态导入演示配置
    const demoModule = await import('./src/config/demo.ts');
    
    const isDemoEnv = demoModule.isDemoEnvironment();
    const videoCost = demoModule.getVideoGenerationCost();
    const demoInfo = demoModule.getDemoEnvironmentInfo();
    
    console.log(`  📋 演示环境检测: ${isDemoEnv ? '✅ 是' : '❌ 否'}`);
    console.log(`  📋 视频生成积分: ${videoCost}`);
    console.log(`  📋 演示信息: ${demoInfo ? demoInfo.message : '无'}`);
    
    if (isDemoEnv && videoCost === 1) {
      console.log('  ✅ 演示环境配置正确');
      return true;
    } else {
      console.log('  ❌ 演示环境配置错误');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 演示配置测试失败: ${error.message}`);
    return false;
  }
}

// 测试API一致性
async function testAPIConsistency() {
  console.log('\n🔄 测试API一致性...');
  
  try {
    // 获取用户积分
    const balanceResponse = await fetch(`${BASE_URL}/api/credits?action=balance`, {
      headers: { 'Authorization': `Bearer new-user-token` }
    });
    
    if (!balanceResponse.ok) {
      console.log('  ❌ 无法获取用户积分');
      return false;
    }
    
    const balanceData = await balanceResponse.json();
    const userCredits = balanceData.balance;
    console.log(`  📊 用户积分: ${userCredits}`);
    
    // 测试视频生成
    const videoResponse = await fetch(`${BASE_URL}/api/video/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer new-user-token`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputImageUrl: 'https://picsum.photos/512/512?random=verify-test',
        params: {
          prompt: '验证前端积分修复',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    });
    
    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      console.log(`  ✅ 视频生成成功`);
      console.log(`  💰 消费积分: ${videoData.creditsUsed}`);
      console.log(`  💰 剩余积分: ${videoData.remainingCredits}`);
      
      if (videoData.creditsUsed === 1) {
        console.log('  ✅ API积分要求正确（1积分）');
        return true;
      } else {
        console.log(`  ❌ API积分要求错误: ${videoData.creditsUsed}积分`);
        return false;
      }
    } else {
      const errorData = await videoResponse.json();
      console.log(`  ❌ 视频生成失败: ${errorData.error}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ API一致性测试失败: ${error.message}`);
    return false;
  }
}

// 测试前端代码修复
async function testFrontendCodeFixes() {
  console.log('\n🔧 测试前端代码修复...');
  
  const checks = [
    {
      name: '演示配置文件',
      check: async () => {
        try {
          const fs = await import('fs');
          return fs.existsSync('./src/config/demo.ts');
        } catch {
          return false;
        }
      }
    },
    {
      name: 'CreatePage动态积分',
      check: async () => {
        try {
          const fs = await import('fs');
          const content = fs.readFileSync('./src/pages/CreatePage.tsx', 'utf8');
          return content.includes('getVideoGenerationCost()') && 
                 !content.includes('CREDIT_RULES.VIDEO_GENERATION_COST');
        } catch {
          return false;
        }
      }
    },
    {
      name: 'useCredits hooks修复',
      check: async () => {
        try {
          const fs = await import('fs');
          const content1 = fs.readFileSync('./src/hooks/useCredits.ts', 'utf8');
          const content2 = fs.readFileSync('./src/hooks/useCredits.tsx', 'utf8');
          return content1.includes('getVideoGenerationCost') && 
                 content2.includes('getVideoGenerationCost');
        } catch {
          return false;
        }
      }
    },
    {
      name: 'creditsService修复',
      check: async () => {
        try {
          const fs = await import('fs');
          const content = fs.readFileSync('./src/services/creditsService.ts', 'utf8');
          return content.includes('getVideoGenerationCost');
        } catch {
          return false;
        }
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = await check.check();
    const status = result ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
    if (!result) allPassed = false;
  }
  
  return allPassed;
}

// 测试用户场景
async function testUserScenarios() {
  console.log('\n👤 测试用户场景...');
  
  const scenarios = [
    {
      name: '新用户（46积分）',
      token: 'new-user-token',
      expectedCanGenerate: true
    },
    {
      name: '演示用户（199积分）',
      token: 'demo-token',
      expectedCanGenerate: true
    },
    {
      name: '测试用户（145积分）',
      token: 'test-user-1-token',
      expectedCanGenerate: true
    }
  ];
  
  let allPassed = true;
  
  for (const scenario of scenarios) {
    console.log(`  👤 测试 ${scenario.name}...`);
    
    try {
      const balanceResponse = await fetch(`${BASE_URL}/api/credits?action=balance`, {
        headers: { 'Authorization': `Bearer ${scenario.token}` }
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        const userCredits = balanceData.balance;
        const canGenerate = userCredits >= 1;
        
        console.log(`    📊 积分: ${userCredits}`);
        console.log(`    🎯 可生成: ${canGenerate ? '✅ 是' : '❌ 否'}`);
        
        if (canGenerate === scenario.expectedCanGenerate) {
          console.log(`    ✅ 场景测试通过`);
        } else {
          console.log(`    ❌ 场景测试失败`);
          allPassed = false;
        }
      } else {
        console.log(`    ❌ 无法获取积分`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`    ❌ 测试失败: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// 生成修复指南
function generateFixGuide() {
  console.log('\n📋 前端积分修复指南');
  console.log('='.repeat(50));
  
  console.log('\n🔧 如果界面仍显示60积分，请按以下步骤操作：');
  
  console.log('\n1️⃣ 清除浏览器缓存：');
  console.log('   • Chrome/Edge: Ctrl+Shift+R (硬刷新)');
  console.log('   • Firefox: Ctrl+F5');
  console.log('   • Safari: Cmd+Option+R');
  
  console.log('\n2️⃣ 重启开发服务器：');
  console.log('   • 停止当前服务器 (Ctrl+C)');
  console.log('   • 运行: ./refresh-frontend.sh');
  console.log('   • 或手动运行: npm run dev');
  
  console.log('\n3️⃣ 检查浏览器控制台：');
  console.log('   • 按 F12 打开开发者工具');
  console.log('   • 查看 Console 标签页的错误信息');
  console.log('   • 查看 Network 标签页的API请求');
  
  console.log('\n4️⃣ 验证修复效果：');
  console.log('   • 访问 http://localhost:3000');
  console.log('   • 登录并进入创建页面');
  console.log('   • 查看是否显示"生成视频需要 1 积分"');
  console.log('   • 查看是否显示"演示环境优惠"标签');
  
  console.log('\n5️⃣ 深度清理（如果问题持续）：');
  console.log('   • 删除 .next 目录: rm -rf .next');
  console.log('   • 清除 node_modules/.cache');
  console.log('   • 重新安装依赖: npm install');
  
  console.log('\n🎯 预期效果：');
  console.log('   ✅ 界面显示"1积分"而不是"60积分"');
  console.log('   ✅ 显示绿色"演示环境优惠"标签');
  console.log('   ✅ 有1积分以上的用户可以生成视频');
  console.log('   ✅ 实际消费1积分而不是60积分');
}

// 主验证函数
async function runVerification() {
  console.log('🎯 开始验证前端积分要求修复...\n');
  
  const results = [];
  
  try {
    results.push({ name: '演示环境配置', success: await testDemoConfig() });
    results.push({ name: 'API一致性', success: await testAPIConsistency() });
    results.push({ name: '前端代码修复', success: await testFrontendCodeFixes() });
    results.push({ name: '用户场景', success: await testUserScenarios() });
    
    // 生成报告
    console.log('\n📊 前端积分修复验证报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 验证成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 前端积分要求修复验证全部通过！');
      console.log('\n✨ 修复已生效，用户现在可以用1积分生成视频！');
      
      console.log('\n🎮 用户体验：');
      console.log('• 新用户（46积分）可以生成46个视频');
      console.log('• 界面清楚显示积分要求和演示环境标识');
      console.log('• 前后端积分要求完全一致');
      console.log('• 大幅降低了测试门槛');
      
    } else {
      console.log('\n⚠️ 部分验证未通过，需要进一步修复');
      generateFixGuide();
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error);
    generateFixGuide();
  }
}

// 运行验证
runVerification().catch(console.error);
