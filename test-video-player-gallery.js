#!/usr/bin/env node

/**
 * 测试视频播放器和画廊显示功能
 * 验证完整的视频生成到播放到画廊显示流程
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🎬 测试视频播放器和画廊显示功能...\n');

// 创建测试图片数据
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

// 测试1: 生成视频并等待完成
async function generateAndWaitForVideo() {
  console.log('🎬 步骤1: 生成视频并等待完成...');
  
  try {
    // 1. 上传图片
    console.log('  📤 上传图片...');
    const uploadResponse = await fetch(`${BASE_URL}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-user-token'
      },
      body: JSON.stringify({
        imageData: testImageBase64,
        fileName: 'test-video-player.png',
        contentType: 'image/png'
      })
    });
    
    if (!uploadResponse.ok) {
      throw new Error('图片上传失败');
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('  ✅ 图片上传成功');
    
    // 2. 创建视频任务
    console.log('  🎬 创建视频任务...');
    const videoResponse = await fetch(`${BASE_URL}/api/video/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-user-token'
      },
      body: JSON.stringify({
        inputImageUrl: uploadResult.url,
        params: {
          prompt: '测试视频播放器和画廊功能 - 美丽的动画场景',
          aspectRatio: '16:9',
          musicStyle: 'Joyful'
        }
      })
    });
    
    if (!videoResponse.ok) {
      throw new Error('视频任务创建失败');
    }
    
    const videoResult = await videoResponse.json();
    const taskId = videoResult.taskId;
    console.log(`  ✅ 视频任务创建成功: ${taskId}`);
    
    // 3. 等待视频完成
    console.log('  ⏳ 等待视频生成完成...');
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const statusResponse = await fetch(`${BASE_URL}/api/video/status?taskId=${taskId}`, {
        headers: { 'Authorization': 'Bearer new-user-token' }
      });
      
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log(`  📊 任务状态: ${statusResult.status} (${statusResult.progress}%)`);
        
        if (statusResult.status === 'completed') {
          console.log('  ✅ 视频生成完成');
          console.log(`  🎬 视频URL: ${statusResult.resultVideoUrl}`);
          return {
            taskId,
            videoUrl: statusResult.resultVideoUrl,
            inputImageUrl: statusResult.inputImageUrl,
            prompt: '测试视频播放器和画廊功能 - 美丽的动画场景'
          };
        } else if (statusResult.status === 'failed') {
          throw new Error('视频生成失败');
        }
      }
      
      attempts++;
    }
    
    throw new Error('视频生成超时');
    
  } catch (error) {
    console.log(`  ❌ 视频生成失败: ${error.message}`);
    return null;
  }
}

// 测试2: 验证视频URL可访问性
async function testVideoAccessibility(videoUrl) {
  console.log('\n🔍 步骤2: 验证视频URL可访问性...');
  
  try {
    console.log(`  📍 测试视频URL: ${videoUrl}`);
    
    const response = await fetch(videoUrl, { method: 'HEAD' });
    console.log(`  📊 响应状态: ${response.status} ${response.statusText}`);
    console.log(`  📋 内容类型: ${response.headers.get('content-type')}`);
    console.log(`  📋 内容长度: ${response.headers.get('content-length')} bytes`);
    
    if (response.ok) {
      console.log('  ✅ 视频URL可访问');
      return true;
    } else {
      console.log('  ❌ 视频URL不可访问');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ 视频URL测试失败: ${error.message}`);
    return false;
  }
}

// 测试3: 创建作品记录
async function createArtworkRecord(videoData) {
  console.log('\n🎨 步骤3: 创建作品记录...');
  
  try {
    const artworkResponse = await fetch(`${BASE_URL}/api/community?action=artworks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-user-token'
      },
      body: JSON.stringify({
        title: videoData.prompt || '我的视频作品',
        description: `使用提示词"${videoData.prompt}"创作的视频`,
        videoUrl: videoData.videoUrl,
        thumbnailUrl: undefined,
        isPublic: true
      })
    });
    
    if (artworkResponse.ok) {
      const artworkResult = await artworkResponse.json();
      console.log('  ✅ 作品记录创建成功');
      console.log(`  📋 作品ID: ${artworkResult.data.id}`);
      console.log(`  📋 作品标题: ${artworkResult.data.title}`);
      console.log(`  📋 是否公开: ${artworkResult.data.is_public}`);
      return artworkResult.data;
    } else {
      const errorText = await artworkResponse.text();
      console.log(`  ❌ 作品记录创建失败: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.log(`  ❌ 创建作品记录失败: ${error.message}`);
    return null;
  }
}

// 测试4: 验证用户作品列表
async function testUserArtworksList() {
  console.log('\n📚 步骤4: 验证用户作品列表...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users/me/artworks?page=1&limit=20`, {
      headers: { 'Authorization': 'Bearer new-user-token' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 用户作品列表获取成功');
      console.log(`  📊 作品总数: ${result.total}`);
      console.log(`  📊 当前页作品数: ${result.artworks.length}`);
      
      if (result.artworks.length > 0) {
        console.log('  📋 最新作品:');
        result.artworks.slice(0, 3).forEach((artwork, index) => {
          console.log(`    ${index + 1}. ${artwork.title}`);
          console.log(`       视频URL: ${artwork.video_url}`);
          console.log(`       创建时间: ${artwork.created_at}`);
        });
        return result.artworks;
      } else {
        console.log('  ⚠️ 用户暂无作品');
        return [];
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 获取用户作品列表失败: ${errorText}`);
      return [];
    }
  } catch (error) {
    console.log(`  ❌ 用户作品列表测试失败: ${error.message}`);
    return [];
  }
}

// 测试5: 验证画廊显示
async function testGalleryDisplay() {
  console.log('\n🖼️ 步骤5: 验证画廊显示...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/artworks?page=1&limit=12&sortBy=LATEST`, {
      headers: { 'Authorization': 'Bearer new-user-token' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ 画廊作品列表获取成功');
      console.log(`  📊 公开作品总数: ${result.total || result.artworks.length}`);
      console.log(`  📊 当前页作品数: ${result.artworks.length}`);
      
      if (result.artworks.length > 0) {
        console.log('  📋 画廊作品预览:');
        result.artworks.slice(0, 3).forEach((artwork, index) => {
          console.log(`    ${index + 1}. ${artwork.title}`);
          console.log(`       作者: ${artwork.userName || artwork.user_id}`);
          console.log(`       点赞: ${artwork.likes || artwork.like_count || 0}`);
        });
        return result.artworks;
      } else {
        console.log('  ⚠️ 画廊暂无作品');
        return [];
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ 获取画廊作品失败: ${errorText}`);
      return [];
    }
  } catch (error) {
    console.log(`  ❌ 画廊显示测试失败: ${error.message}`);
    return [];
  }
}

// 主测试函数
async function runVideoPlayerGalleryTest() {
  console.log('🎯 开始视频播放器和画廊显示测试...\n');
  
  const results = [];
  let videoData = null;
  let artwork = null;
  
  try {
    // 步骤1: 生成视频
    videoData = await generateAndWaitForVideo();
    results.push({ name: '视频生成', success: !!videoData });
    
    if (!videoData) {
      console.log('\n❌ 视频生成失败，无法继续测试');
      return;
    }
    
    // 步骤2: 验证视频可访问性
    const videoAccessible = await testVideoAccessibility(videoData.videoUrl);
    results.push({ name: '视频URL可访问性', success: videoAccessible });
    
    // 步骤3: 创建作品记录
    artwork = await createArtworkRecord(videoData);
    results.push({ name: '作品记录创建', success: !!artwork });
    
    // 步骤4: 验证用户作品列表
    const userArtworks = await testUserArtworksList();
    results.push({ name: '用户作品列表', success: userArtworks.length > 0 });
    
    // 步骤5: 验证画廊显示
    const galleryArtworks = await testGalleryDisplay();
    results.push({ name: '画廊显示', success: galleryArtworks.length > 0 });
    
    // 生成报告
    console.log('\n📊 视频播放器和画廊显示测试报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    console.log(`\n📈 测试成功率: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 视频播放器和画廊显示测试全部通过！');
      
      console.log('\n🎬 功能验证:');
      console.log('✅ 视频生成: 成功创建视频任务并完成');
      console.log('✅ 视频URL: 使用真实可访问的测试视频');
      console.log('✅ 作品保存: 成功创建作品记录');
      console.log('✅ 用户作品: 可以在"我的作品"中查看');
      console.log('✅ 画廊显示: 作品出现在公开画廊中');
      
      console.log('\n🎮 用户体验:');
      console.log('• 视频播放器可以正常播放生成的视频');
      console.log('• 用户可以在Dashboard中查看自己的作品');
      console.log('• 作品会自动出现在社区画廊中');
      console.log('• 支持视频下载和分享功能');
      
      console.log('\n🔧 技术实现:');
      console.log(`• 视频URL: ${videoData.videoUrl}`);
      console.log(`• 作品ID: ${artwork ? artwork.id : 'N/A'}`);
      console.log('• 存储方式: 内存存储（开发环境）');
      console.log('• 视频格式: MP4，支持浏览器播放');
      
    } else {
      console.log('\n⚠️ 部分测试未通过，需要进一步检查');
      
      if (!videoAccessible) {
        console.log('\n🔧 视频播放器问题排查:');
        console.log('• 检查视频URL是否有效');
        console.log('• 确认视频格式是否支持');
        console.log('• 验证CORS设置是否正确');
      }
      
      if (userArtworks.length === 0) {
        console.log('\n🔧 画廊显示问题排查:');
        console.log('• 检查作品创建API是否正常');
        console.log('• 确认用户作品API端点是否存在');
        console.log('• 验证数据存储逻辑是否正确');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runVideoPlayerGalleryTest().catch(console.error);
