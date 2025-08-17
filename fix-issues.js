#!/usr/bin/env node

/**
 * 修复脚本 - 自动修复代码验证中发现的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复代码质量问题...\n');

// 修复问题1: TableStore表初始化脚本中的环境变量名拼写错误
function fixTableStoreInitScript() {
  console.log('修复问题1: TableStore初始化脚本环境变量名...');
  
  const filePath = 'serverless/scripts/init-tablestore.js';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复环境变量名拼写错误
  content = content.replace(/TABESTORE_INSTANCE/g, 'TABLESTORE_INSTANCE');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 已修复 init-tablestore.js 中的环境变量名');
}

// 修复问题2: CreditsService中的环境变量验证
function fixCreditsServiceValidation() {
  console.log('修复问题2: CreditsService环境变量验证...');
  
  const filePath = 'serverless/src/creditsService.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加环境变量验证
  const constructorFix = `  constructor(instanceName: string) {
    this.instanceName = instanceName;
    
    // 验证必要的环境变量
    if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID) {
      throw new Error('Missing required environment variable: ALIBABA_CLOUD_ACCESS_KEY_ID');
    }
    if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET) {
      throw new Error('Missing required environment variable: ALIBABA_CLOUD_ACCESS_KEY_SECRET');
    }
    
    this.client = new TableStore.Client({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      endpoint: \`https://\${instanceName}.cn-hangzhou.ots.aliyuncs.com\`,
      instancename: instanceName,
    });
  }`;
  
  // 替换构造函数
  content = content.replace(
    /constructor\(instanceName: string\) \{[\s\S]*?\n  \}/,
    constructorFix
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 已修复 CreditsService 环境变量验证');
}

// 修复问题3: CreditsService中的日期类型不一致
function fixCreditsServiceDateTypes() {
  console.log('修复问题3: CreditsService日期类型一致性...');
  
  const filePath = 'serverless/src/creditsService.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复 updateDailyLikeCount 方法中的日期处理
  const dateFixPattern = /let lastDailyReset = userCredits\.lastDailyReset \|\| now;[\s\S]*?lastDailyReset = now;/;
  const dateFixReplacement = `let lastDailyReset = userCredits.lastDailyReset || new Date().toISOString().split('T')[0];

      // 检查是否需要重置每日数据
      const today = new Date().toISOString().split('T')[0];
      if (lastDailyReset !== today) {
        dailyLikeGiven = 0;
        lastDailyReset = today;
      }`;
  
  content = content.replace(dateFixPattern, dateFixReplacement);
  
  // 修复 updateRow 参数中的日期格式
  content = content.replace(
    /{ 'lastDailyReset': lastDailyReset }/,
    "{ 'lastDailyReset': lastDailyReset }"
  );
  
  // 修复 updatedAt 字段
  content = content.replace(
    /{ 'updatedAt': now }/,
    "{ 'updatedAt': new Date().toISOString() }"
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 已修复 CreditsService 日期类型一致性');
}

// 修复问题4: 邀请API中的环境变量名
function fixInvitationApiEnvVar() {
  console.log('修复问题4: 邀请API环境变量名...');
  
  const filePath = 'api/invitations/index.js';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复环境变量名拼写错误
  content = content.replace(/TABESTORE_INSTANCE/g, 'TABLESTORE_INSTANCE');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 已修复 invitations API 中的环境变量名');
}

// 修复问题5: serverless配置中的环境变量名
function fixServerlessConfig() {
  console.log('修复问题5: serverless配置环境变量名...');
  
  const filePath = 'serverless/s.yaml';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复环境变量名拼写错误
  content = content.replace(/TABESTORE_INSTANCE/g, 'TABLESTORE_INSTANCE');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 已修复 serverless 配置中的环境变量名');
}

// 创建环境变量模板文件
function createEnvTemplate() {
  console.log('创建环境变量模板文件...');
  
  const envTemplate = `# 阿里云配置
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
TABLESTORE_INSTANCE=your_tablestore_instance

# Authing.cn 配置
AUTHING_OIDC_ISSUER=https://your-domain.authing.cn/oidc
AUTHING_OIDC_AUDIENCE=your_app_id

# OSS 配置
OSS_REGION=cn-hangzhou
OSS_BUCKET_UPLOAD=your_upload_bucket
OSS_BUCKET_STATIC=your_static_bucket

# 通义千问 API
TONGYI_API_KEY=your_tongyi_api_key

# Supabase 配置（演示模式）
SUPABASE_URL=https://demo-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=demo-service-key

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do

# 部署环境
NODE_ENV=development
`;
  
  fs.writeFileSync('.env.template', envTemplate);
  console.log('✅ 已创建环境变量模板文件 .env.template');
}

// 创建部署前检查脚本
function createPreDeployCheck() {
  console.log('创建部署前检查脚本...');
  
  const checkScript = `#!/usr/bin/env node

/**
 * 部署前检查脚本
 */

const fs = require('fs');

console.log('🔍 执行部署前检查...');

const requiredEnvVars = [
  'ALIBABA_CLOUD_ACCESS_KEY_ID',
  'ALIBABA_CLOUD_ACCESS_KEY_SECRET',
  'TABLESTORE_INSTANCE',
  'AUTHING_OIDC_ISSUER',
  'AUTHING_OIDC_AUDIENCE'
];

let hasErrors = false;

// 检查环境变量
console.log('\\n📋 检查环境变量...');
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(\`❌ 缺少环境变量: \${varName}\`);
    hasErrors = true;
  } else {
    console.log(\`✅ \${varName}: 已设置\`);
  }
});

// 检查关键文件
console.log('\\n📁 检查关键文件...');
const requiredFiles = [
  'serverless/src/creditsService.ts',
  'serverless/src/alipayService.ts',
  'serverless/scripts/init-tablestore.js',
  'api/invitations/index.js',
  'api/payment/index.js',
  'api/orders/index.js',
  'api/community/index.js'
];

requiredFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(\`✅ \${filePath}: 存在\`);
  } else {
    console.log(\`❌ \${filePath}: 不存在\`);
    hasErrors = true;
  }
});

// 检查package.json依赖
console.log('\\n📦 检查关键依赖...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['jose', 'react', 'react-dom', '@supabase/supabase-js'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(\`✅ \${dep}: \${packageJson.dependencies[dep]}\`);
  } else {
    console.log(\`❌ \${dep}: 未安装\`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.log('\\n❌ 发现问题，请修复后再部署');
  process.exit(1);
} else {
  console.log('\\n✅ 所有检查通过，可以部署');
}
`;
  
  fs.writeFileSync('pre-deploy-check.js', checkScript);
  fs.chmodSync('pre-deploy-check.js', '755');
  console.log('✅ 已创建部署前检查脚本 pre-deploy-check.js');
}

// 更新package.json脚本
function updatePackageJsonScripts() {
  console.log('更新package.json脚本...');
  
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // 添加新的脚本
  packageJson.scripts = {
    ...packageJson.scripts,
    'fix-issues': 'node fix-issues.js',
    'pre-deploy': 'node pre-deploy-check.js',
    'test:integration': 'node test-integration.js',
    'init-tablestore': 'node serverless/scripts/init-tablestore.js'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ 已更新 package.json 脚本');
}

// 主函数
function main() {
  try {
    fixTableStoreInitScript();
    fixCreditsServiceValidation();
    fixCreditsServiceDateTypes();
    fixInvitationApiEnvVar();
    fixServerlessConfig();
    createEnvTemplate();
    createPreDeployCheck();
    updatePackageJsonScripts();
    
    console.log('\\n🎉 所有问题修复完成！');
    console.log('\\n📋 修复总结:');
    console.log('  1. ✅ 修复了环境变量名拼写错误 (TABESTORE -> TABLESTORE)');
    console.log('  2. ✅ 添加了环境变量验证');
    console.log('  3. ✅ 修复了日期类型不一致问题');
    console.log('  4. ✅ 创建了环境变量模板文件');
    console.log('  5. ✅ 创建了部署前检查脚本');
    console.log('  6. ✅ 更新了package.json脚本');
    
    console.log('\\n🚀 下一步操作:');
    console.log('  1. 复制 .env.template 为 .env 并填写实际配置');
    console.log('  2. 运行 npm run pre-deploy 检查部署准备');
    console.log('  3. 运行 npm run test:integration 执行集成测试');
    console.log('  4. 运行 npm run init-tablestore 初始化数据库表');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行修复
if (require.main === module) {
  main();
}

module.exports = { main };
