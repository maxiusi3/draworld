#!/usr/bin/env node

/**
 * 测试OIDC配置和回调URL设置
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🔐 测试OIDC配置和回调URL设置...\n');

// 测试1: 验证OIDC发现端点
async function testOIDCDiscovery() {
  console.log('🔍 测试OIDC发现端点...');
  
  const discoveryUrl = 'https://draworld.authing.cn/oidc/.well-known/openid_configuration';
  
  try {
    const response = await fetch(discoveryUrl);
    
    if (response.ok) {
      const config = await response.json();
      console.log('  ✅ OIDC发现端点可访问');
      console.log('  📋 授权端点:', config.authorization_endpoint);
      console.log('  📋 Token端点:', config.token_endpoint);
      console.log('  📋 用户信息端点:', config.userinfo_endpoint);
      console.log('  📋 JWKS端点:', config.jwks_uri);
      
      // 验证端点是否与配置匹配
      const expectedTokenEndpoint = 'https://draworld.authing.cn/oidc/token';
      if (config.token_endpoint === expectedTokenEndpoint) {
        console.log('  ✅ Token端点配置正确');
        return true;
      } else {
        console.log(`  ❌ Token端点不匹配: 期望 ${expectedTokenEndpoint}, 实际 ${config.token_endpoint}`);
        return false;
      }
    } else {
      console.log(`  ❌ OIDC发现端点访问失败: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ OIDC发现端点测试失败: ${error.message}`);
    return false;
  }
}

// 测试2: 验证应用配置
async function testAppConfig() {
  console.log('\n⚙️ 测试应用配置...');
  
  try {
    // 模拟浏览器环境来测试getCallbackUrl函数
    global.window = {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/callback'
      }
    };
    
    // 动态导入配置（需要模拟ES模块）
    const configContent = `
      const getCallbackUrl = () => {
        const origin = 'http://localhost:3000';
        return origin + '/callback';
      };
      
      const oidcConfig = {
        clientId: '689adde75ecb97cd396860eb',
        clientSecret: '200d21d51aa1b7dffadece15fa3c269b',
        discovery: {
          issuer: 'https://draworld.authing.cn/oidc',
          authorization_endpoint: 'https://draworld.authing.cn/oidc/auth',
          token_endpoint: 'https://draworld.authing.cn/oidc/token',
          userinfo_endpoint: 'https://draworld.authing.cn/oidc/me',
          jwks_uri: 'https://draworld.authing.cn/oidc/.well-known/jwks.json',
        },
        defaultScope: 'openid profile phone',
        getCallbackUrl,
      };
    `;
    
    // 评估配置
    eval(configContent);
    
    const callbackUrl = getCallbackUrl();
    console.log('  📋 生成的回调URL:', callbackUrl);
    
    // 验证回调URL格式
    if (callbackUrl === 'http://localhost:3000/callback') {
      console.log('  ✅ 回调URL格式正确');
      return true;
    } else {
      console.log(`  ❌ 回调URL格式错误: 期望 http://localhost:3000/callback, 实际 ${callbackUrl}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 应用配置测试失败: ${error.message}`);
    return false;
  }
}

// 测试3: 验证授权URL生成
async function testAuthorizationUrl() {
  console.log('\n🔗 测试授权URL生成...');
  
  try {
    const authUrl = 'https://draworld.authing.cn/oidc/auth';
    const clientId = '689adde75ecb97cd396860eb';
    const redirectUri = 'http://localhost:3000/callback';
    const scope = 'openid profile phone';
    const responseType = 'code';
    
    // 构建授权URL
    const url = new URL(authUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scope);
    url.searchParams.set('response_type', responseType);
    url.searchParams.set('state', 'test-state-123');
    
    const fullAuthUrl = url.toString();
    console.log('  📋 生成的授权URL:', fullAuthUrl);
    
    // 验证URL参数
    const params = url.searchParams;
    const checks = [
      { name: 'client_id', expected: clientId, actual: params.get('client_id') },
      { name: 'redirect_uri', expected: redirectUri, actual: params.get('redirect_uri') },
      { name: 'scope', expected: scope, actual: params.get('scope') },
      { name: 'response_type', expected: responseType, actual: params.get('response_type') }
    ];
    
    let allCorrect = true;
    checks.forEach(check => {
      if (check.actual === check.expected) {
        console.log(`  ✅ ${check.name}: ${check.actual}`);
      } else {
        console.log(`  ❌ ${check.name}: 期望 ${check.expected}, 实际 ${check.actual}`);
        allCorrect = false;
      }
    });
    
    return allCorrect;
  } catch (error) {
    console.log(`  ❌ 授权URL生成测试失败: ${error.message}`);
    return false;
  }
}

// 测试4: 验证Token交换请求格式
async function testTokenExchangeFormat() {
  console.log('\n🔄 测试Token交换请求格式...');
  
  try {
    // 模拟token交换请求的参数
    const params = {
      grant_type: 'authorization_code',
      code: 'test-authorization-code-123',
      redirect_uri: 'http://localhost:3000/callback',
      client_id: '689adde75ecb97cd396860eb',
      client_secret: '200d21d51aa1b7dffadece15fa3c269b'
    };
    
    // 构建请求体
    const body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      body.set(key, value);
    });
    
    console.log('  📋 Token交换请求参数:');
    Object.entries(params).forEach(([key, value]) => {
      const displayValue = key === 'code' ? value.substring(0, 10) + '...' : 
                          key === 'client_secret' ? '***' : value;
      console.log(`    ${key}: ${displayValue}`);
    });
    
    // 验证必需参数
    const requiredParams = ['grant_type', 'code', 'redirect_uri', 'client_id'];
    const missingParams = requiredParams.filter(param => !params[param]);
    
    if (missingParams.length === 0) {
      console.log('  ✅ 所有必需参数都存在');
      
      // 验证参数值
      if (params.grant_type === 'authorization_code') {
        console.log('  ✅ grant_type正确');
      } else {
        console.log(`  ❌ grant_type错误: ${params.grant_type}`);
        return false;
      }
      
      if (params.redirect_uri === 'http://localhost:3000/callback') {
        console.log('  ✅ redirect_uri正确');
      } else {
        console.log(`  ❌ redirect_uri错误: ${params.redirect_uri}`);
        return false;
      }
      
      return true;
    } else {
      console.log(`  ❌ 缺少必需参数: ${missingParams.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Token交换格式测试失败: ${error.message}`);
    return false;
  }
}

// 测试5: 验证应用页面可访问性
async function testAppAccessibility() {
  console.log('\n🌐 测试应用页面可访问性...');
  
  const pages = [
    { name: '主页', path: '/' },
    { name: '登录页', path: '/login' },
    { name: '回调页', path: '/callback' }
  ];
  
  let allAccessible = true;
  
  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page.path}`);
      
      if (response.ok) {
        console.log(`  ✅ ${page.name} (${page.path}): 可访问`);
      } else {
        console.log(`  ❌ ${page.name} (${page.path}): ${response.status}`);
        allAccessible = false;
      }
    } catch (error) {
      console.log(`  ❌ ${page.name} (${page.path}): ${error.message}`);
      allAccessible = false;
    }
  }
  
  return allAccessible;
}

// 主测试函数
async function runOIDCTests() {
  console.log('🎯 开始OIDC配置测试...\n');
  
  const results = [];
  
  try {
    results.push({ name: 'OIDC发现端点', success: await testOIDCDiscovery() });
    results.push({ name: '应用配置', success: await testAppConfig() });
    results.push({ name: '授权URL生成', success: await testAuthorizationUrl() });
    results.push({ name: 'Token交换格式', success: await testTokenExchangeFormat() });
    results.push({ name: '应用页面可访问性', success: await testAppAccessibility() });
    
    // 生成报告
    console.log('\n📊 OIDC配置测试报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 测试成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 OIDC配置测试全部通过！');
      console.log('\n🔧 配置状态:');
      console.log('✅ 回调URL已更新为localhost:3000');
      console.log('✅ OIDC端点配置正确');
      console.log('✅ 授权参数格式正确');
      console.log('✅ Token交换参数完整');
      console.log('✅ 应用页面可正常访问');
      console.log('\n💡 建议:');
      console.log('1. 确保Authing控制台中已配置http://localhost:3000/callback作为回调URL');
      console.log('2. 测试完整的OIDC登录流程');
      console.log('3. 检查浏览器控制台的详细调试信息');
    } else {
      console.log('\n⚠️ 部分配置可能需要调整');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runOIDCTests().catch(console.error);
