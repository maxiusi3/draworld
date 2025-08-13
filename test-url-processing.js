/**
 * 测试图片 URL 处理逻辑
 */

const testUrl = 'https://firebasestorage.googleapis.com/v0/b/draworld-6898f.firebasestorage.app/o/users%2FewtqQvbLz9Vh7LMz320t2x2GgyN2%2Fimages%2F1754825641092_WechatIMG3794.jpg?alt=media&token=708f530f-e94f-4187-ad48-44caea34b2c9';

console.log('测试 URL:', testUrl);
console.log('包含 firebasestorage.googleapis.com:', testUrl.includes('firebasestorage.googleapis.com'));
console.log('包含 firebasestorage.app:', testUrl.includes('firebasestorage.app'));

// 测试条件
if (testUrl.includes('firebasestorage.googleapis.com') || testUrl.includes('firebasestorage.app')) {
  console.log('✅ URL 检测成功 - 应该进入处理逻辑');
} else {
  console.log('❌ URL 检测失败 - 不会进入处理逻辑');
}

// 测试 URL 访问
import fetch from 'node-fetch';

async function testUrlAccess() {
  try {
    console.log('\n测试 URL 访问...');
    const response = await fetch(testUrl, { method: 'HEAD', timeout: 10000 });
    console.log('URL 访问状态:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    if (response.ok) {
      console.log('✅ URL 可以正常访问');
    } else {
      console.log('❌ URL 访问失败');
    }
  } catch (error) {
    console.log('❌ URL 访问错误:', error.message);
  }
}

testUrlAccess();
