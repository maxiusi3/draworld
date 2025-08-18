#!/usr/bin/env node

/**
 * 验证 API 修正结果
 * 检查是否还有 Supabase 残留引用
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证 API 修正结果...\n');

// 需要检查的 API 文件
const apiFiles = [
  'api/orders/index.js',
  'api/artworks/index.js', 
  'api/credits/index.js',
  'api/community/index.js',
  'api/invitations/index.js',
  'api/admin/index.js',
  'api/payment/index.js',
  'api/users/me/artworks.js'
];

let totalIssues = 0;
let fixedFiles = 0;

console.log('📋 检查清单:\n');

for (const filePath of apiFiles) {
  console.log(`🔍 检查: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ 文件不存在`);
    totalIssues++;
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 检查 Supabase 引用
  if (content.includes('createClient') && content.includes('@supabase/supabase-js')) {
    issues.push('仍在导入 Supabase createClient');
  }
  
  if (content.includes('supabase.from(')) {
    issues.push('仍在使用 Supabase 查询');
  }
  
  if (content.includes('supabase.rpc(')) {
    issues.push('仍在使用 Supabase RPC');
  }
  
  if (content.includes('SUPABASE_URL') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    issues.push('仍在检查 Supabase 环境变量');
  }
  
  // 检查 TableStore 配置
  const hasTableStoreConfig = content.includes('TABLESTORE_INSTANCE') && 
                             content.includes('ALIBABA_CLOUD_ACCESS_KEY_ID') &&
                             content.includes('ALIBABA_CLOUD_ACCESS_KEY_SECRET');
  
  const hasTableStoreImport = content.includes('serverless/src/') && 
                             (content.includes('Repository') || content.includes('Service'));
  
  if (issues.length === 0) {
    if (hasTableStoreConfig && hasTableStoreImport) {
      console.log(`  ✅ 已修正 - 使用 TableStore`);
      fixedFiles++;
    } else if (hasTableStoreConfig) {
      console.log(`  ⚠️  部分修正 - 有 TableStore 配置但缺少导入`);
      totalIssues++;
    } else {
      console.log(`  ⚠️  需要检查 - 无明显 Supabase 引用但也无 TableStore 配置`);
      totalIssues++;
    }
  } else {
    console.log(`  ❌ 需要修正:`);
    issues.forEach(issue => console.log(`     - ${issue}`));
    totalIssues += issues.length;
  }
  
  console.log('');
}

// 总结报告
console.log('📊 修正总结:');
console.log(`总文件数: ${apiFiles.length}`);
console.log(`已修正: ${fixedFiles}`);
console.log(`待修正: ${apiFiles.length - fixedFiles}`);
console.log(`发现问题: ${totalIssues}`);
console.log('');

if (totalIssues === 0) {
  console.log('🎉 所有 API 已成功修正为使用 TableStore！');
} else {
  console.log('⚠️  仍有 API 需要修正，请检查上述问题。');
}

// 检查环境变量配置文件
console.log('🔧 检查环境变量配置:');

const envFiles = ['.env.example', 'vercel.json', 'README.md'];
let envIssues = 0;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    console.log(`📄 ${envFile}:`);
    
    if (content.includes('SUPABASE_URL') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log(`  ⚠️  仍包含 Supabase 环境变量配置`);
      envIssues++;
    }
    
    if (content.includes('TABLESTORE_INSTANCE')) {
      console.log(`  ✅ 包含 TableStore 配置`);
    } else {
      console.log(`  ❌ 缺少 TableStore 配置`);
      envIssues++;
    }
  }
}

console.log('');

if (envIssues === 0) {
  console.log('✅ 环境变量配置正确');
} else {
  console.log('⚠️  环境变量配置需要更新');
}

// 下一步建议
console.log('\n🎯 下一步操作:');

if (totalIssues > 0) {
  console.log('1. 修正上述发现的 API 问题');
  console.log('2. 确保所有 API 都使用 TableStore Repository/Service');
  console.log('3. 移除所有 Supabase 相关代码');
} else {
  console.log('1. ✅ API 修正完成');
}

if (envIssues > 0) {
  console.log('4. 更新环境变量配置文件');
  console.log('5. 确保 Vercel 环境变量正确设置');
} else {
  console.log('2. ✅ 环境变量配置正确');
}

console.log('3. 运行构建测试: npm run build');
console.log('4. 部署到 Vercel 并测试');

process.exit(totalIssues > 0 ? 1 : 0);
