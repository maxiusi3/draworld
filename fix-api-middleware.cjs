#!/usr/bin/env node

/**
 * 修复API中间件中的res.json调用
 */

const fs = require('fs');

console.log('🔧 修复API中间件...');

let content = fs.readFileSync('dev-api-middleware.js', 'utf8');

// 替换所有的res.json调用
content = content.replace(/res\.json\(([^)]+)\)/g, (match, jsonContent) => {
  return `res.statusCode = 200;\n    res.end(JSON.stringify(${jsonContent}))`;
});

// 替换res.status().json()调用
content = content.replace(/res\.status\((\d+)\)\.json\(([^)]+)\)/g, (match, status, jsonContent) => {
  return `res.statusCode = ${status};\n    res.end(JSON.stringify(${jsonContent}))`;
});

fs.writeFileSync('dev-api-middleware.js', content);

console.log('✅ API中间件修复完成');
