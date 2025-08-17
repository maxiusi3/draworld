#!/usr/bin/env node

/**
 * 测试关键问题修复
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🔧 测试关键问题修复...\n');

async function apiCall(endpoint, options = {}, token = 'demo-token') {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试1: Gallery页面数据结构
async function testGalleryData() {
  console.log('🎨 测试Gallery页面数据结构...');
  
  const result = await apiCall('/api/artworks');
  
  if (result.success) {
    const artworks = result.data.artworks;
    console.log(`  ✅ 获取到 ${artworks.length} 个作品`);
    
    if (artworks.length > 0) {
      const artwork = artworks[0];
      
      // 检查必需的字段
      const requiredFields = ['id', 'title', 'imageUrl', 'userId', 'userName', 'createdAt'];
      const missingFields = requiredFields.filter(field => !artwork[field]);
      
      if (missingFields.length === 0) {
        console.log('  ✅ 作品数据结构完整');
        
        // 检查views和comments字段
        const hasViews = artwork.views !== undefined;
        const hasComments = artwork.comments !== undefined;
        
        console.log(`  📊 Views字段: ${hasViews ? '✅' : '❌'} (${artwork.views || 'undefined'})`);
        console.log(`  💬 Comments字段: ${hasComments ? '✅' : '❌'} (${artwork.comments || 'undefined'})`);
        
        return hasViews && hasComments;
      } else {
        console.log(`  ❌ 缺少字段: ${missingFields.join(', ')}`);
        return false;
      }
    } else {
      console.log('  ❌ 没有作品数据');
      return false;
    }
  } else {
    console.log('  ❌ 无法获取作品数据');
    return false;
  }
}

// 测试2: 订单创建和获取
async function testOrderManagement() {
  console.log('\n💳 测试订单创建和获取...');
  
  // 创建订单
  const createResult = await apiCall('/api/orders?action=create', {
    method: 'POST',
    body: JSON.stringify({
      packageId: 'basic',
      paymentMethod: 'ALIPAY'
    })
  });
  
  if (!createResult.success) {
    console.log(`  ❌ 订单创建失败: ${createResult.data?.error || '未知错误'}`);
    return false;
  }
  
  const orderId = createResult.data.order.id;
  console.log(`  ✅ 订单创建成功: ${orderId}`);
  
  // 等待一下让订单保存
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 获取订单列表
  const listResult = await apiCall('/api/orders?action=list&limit=10&offset=0');
  
  if (listResult.success) {
    const orders = listResult.data.orders;
    console.log(`  ✅ 获取到 ${orders.length} 个订单`);
    
    // 检查刚创建的订单是否在列表中
    const createdOrder = orders.find(order => order.id === orderId);
    if (createdOrder) {
      console.log(`  ✅ 新创建的订单在列表中找到`);
      console.log(`  📋 订单状态: ${createdOrder.status}`);
      console.log(`  💰 订单金额: ¥${createdOrder.priceYuan}`);
      return true;
    } else {
      console.log(`  ❌ 新创建的订单未在列表中找到`);
      console.log(`  📋 现有订单IDs: ${orders.map(o => o.id).join(', ')}`);
      return false;
    }
  } else {
    console.log(`  ❌ 获取订单列表失败: ${listResult.data?.error || '未知错误'}`);
    return false;
  }
}

// 测试3: 多用户订单隔离
async function testMultiUserOrders() {
  console.log('\n👥 测试多用户订单隔离...');
  
  const users = [
    { token: 'demo-token', name: '演示用户' },
    { token: 'new-user-token', name: '新用户' }
  ];
  
  const userOrders = {};
  
  for (const user of users) {
    // 为每个用户创建订单
    const createResult = await apiCall('/api/orders?action=create', {
      method: 'POST',
      body: JSON.stringify({
        packageId: 'premium',
        paymentMethod: 'ALIPAY'
      })
    }, user.token);
    
    if (createResult.success) {
      console.log(`  ✅ ${user.name} 订单创建成功: ${createResult.data.order.id}`);
      
      // 获取该用户的订单列表
      const listResult = await apiCall('/api/orders?action=list', {}, user.token);
      
      if (listResult.success) {
        userOrders[user.name] = listResult.data.orders;
        console.log(`  📋 ${user.name} 有 ${listResult.data.orders.length} 个订单`);
      }
    } else {
      console.log(`  ❌ ${user.name} 订单创建失败`);
    }
  }
  
  // 检查订单隔离
  const demoOrders = userOrders['演示用户'] || [];
  const newUserOrders = userOrders['新用户'] || [];
  
  if (demoOrders.length > 0 && newUserOrders.length > 0) {
    // 检查是否有重复的订单ID
    const demoOrderIds = demoOrders.map(o => o.id);
    const newUserOrderIds = newUserOrders.map(o => o.id);
    const overlap = demoOrderIds.filter(id => newUserOrderIds.includes(id));
    
    if (overlap.length === 0) {
      console.log('  ✅ 用户订单正确隔离，无重复订单');
      return true;
    } else {
      console.log(`  ❌ 发现重复订单: ${overlap.join(', ')}`);
      return false;
    }
  } else {
    console.log('  ⚠️ 无法完全测试订单隔离（某些用户没有订单）');
    return false;
  }
}

// 测试4: 积分购买完整流程
async function testCreditPurchaseFlow() {
  console.log('\n💰 测试积分购买完整流程...');
  
  // 获取初始积分
  const initialBalance = await apiCall('/api/credits?action=balance');
  if (!initialBalance.success) {
    console.log('  ❌ 无法获取初始积分');
    return false;
  }
  
  console.log(`  📊 初始积分: ${initialBalance.data.balance}`);
  
  // 创建订单
  const orderResult = await apiCall('/api/orders?action=create', {
    method: 'POST',
    body: JSON.stringify({
      packageId: 'basic',
      paymentMethod: 'ALIPAY'
    })
  });
  
  if (!orderResult.success) {
    console.log('  ❌ 订单创建失败');
    return false;
  }
  
  console.log(`  ✅ 订单创建成功: ${orderResult.data.order.id}`);
  
  // 等待支付完成
  console.log('  ⏳ 等待模拟支付完成...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // 检查积分是否增加
  const finalBalance = await apiCall('/api/credits?action=balance');
  if (finalBalance.success) {
    const increase = finalBalance.data.balance - initialBalance.data.balance;
    console.log(`  💰 积分变化: +${increase}`);
    
    if (increase > 0) {
      console.log('  ✅ 积分购买流程正常');
      
      // 检查订单状态是否更新
      const orderList = await apiCall('/api/orders?action=list');
      if (orderList.success) {
        const order = orderList.data.orders.find(o => o.id === orderResult.data.order.id);
        if (order) {
          console.log(`  📋 订单状态: ${order.status}`);
          return order.status === 'PAID';
        }
      }
    } else {
      console.log('  ❌ 积分未增加');
      return false;
    }
  }
  
  return false;
}

// 主测试函数
async function runCriticalTests() {
  console.log('🎯 开始关键问题修复测试...\n');
  
  const results = [];
  
  try {
    results.push({ name: 'Gallery数据结构', success: await testGalleryData() });
    results.push({ name: '订单创建和获取', success: await testOrderManagement() });
    results.push({ name: '多用户订单隔离', success: await testMultiUserOrders() });
    results.push({ name: '积分购买完整流程', success: await testCreditPurchaseFlow() });
    
    // 生成报告
    console.log('\n📊 关键问题修复测试报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 修复成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 所有关键问题都已修复！');
      console.log('\n🔧 修复内容:');
      console.log('✅ UserSwitcher组件 - 修复session管理');
      console.log('✅ GalleryPage - 修复数据字段访问');
      console.log('✅ 订单管理 - 修复API返回格式');
      console.log('✅ 多用户支持 - 完善数据隔离');
    } else {
      console.log('\n⚠️ 部分问题仍需进一步调试');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runCriticalTests().catch(console.error);
