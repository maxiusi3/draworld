#!/usr/bin/env node

/**
 * 测试前端页面是否正常加载
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🧪 测试前端页面加载...\n');

async function testPageLoading() {
  try {
    console.log(`📍 测试地址: ${BASE_URL}`);
    
    const response = await fetch(BASE_URL);
    const html = await response.text();
    
    if (response.ok) {
      console.log(`✅ 页面响应正常: ${response.status}`);
      
      // 检查HTML内容
      const checks = [
        { name: 'HTML结构', test: html.includes('<html') },
        { name: 'React根元素', test: html.includes('id="root"') },
        { name: 'Vite脚本', test: html.includes('/src/main.tsx') },
        { name: '页面标题', test: html.includes('Whimsy Brush') }
      ];
      
      console.log('\n📋 页面内容检查:');
      checks.forEach(check => {
        const status = check.test ? '✅' : '❌';
        console.log(`  ${status} ${check.name}`);
      });
      
      const allPassed = checks.every(check => check.test);
      
      if (allPassed) {
        console.log('\n🎉 前端页面加载正常！');
        console.log('🌐 可以访问: http://localhost:3000');
        console.log('\n🎯 下一步测试:');
        console.log('1. 在浏览器中打开 http://localhost:3000');
        console.log('2. 检查是否有React/Vite错误');
        console.log('3. 验证应用是否正常显示');
        return true;
      } else {
        console.log('\n⚠️ 页面内容检查发现问题');
        return false;
      }
    } else {
      console.log(`❌ 页面响应异常: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 连接失败: ${error.message}`);
    console.log('\n💡 可能的原因:');
    console.log('1. 开发服务器未启动');
    console.log('2. 端口3000被占用');
    console.log('3. 网络连接问题');
    return false;
  }
}

// 运行测试
testPageLoading().then(success => {
  if (success) {
    console.log('\n🎊 前端修复成功！');
  } else {
    console.log('\n🔧 需要进一步调试');
  }
}).catch(console.error);
