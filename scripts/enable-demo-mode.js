// 语言: JavaScript
// 说明: 临时脚本，用于在Vercel环境中强制启用演示模式

console.log('=== 强制启用演示模式 ===');
console.log('当前环境变量:');
console.log('DEMO_MODE:', process.env.DEMO_MODE);
console.log('FORCE_DEMO_MODE:', process.env.FORCE_DEMO_MODE);
console.log('TABLESTORE_INSTANCE:', process.env.TABLESTORE_INSTANCE_NAME);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 设置强制演示模式
process.env.FORCE_DEMO_MODE = 'true';

console.log('\n=== 演示模式已启用 ===');
console.log('FORCE_DEMO_MODE:', process.env.FORCE_DEMO_MODE);

// 导出配置
module.exports = {
  isDemoMode: true,
  reason: 'TableStore ACL权限问题，强制启用演示模式'
};
