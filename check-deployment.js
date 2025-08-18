#!/usr/bin/env node

/**
 * 简化的部署状态检查脚本
 */

import https from 'https';

const PRODUCTION_URL = 'https://draworld-opal.vercel.app';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

async function checkDeployment() {
    console.log('🔍 检查Vercel部署状态...');
    console.log(`📍 检查地址: ${PRODUCTION_URL}`);
    
    try {
        const response = await makeRequest(PRODUCTION_URL);
        
        if (response.statusCode === 200) {
            console.log('✅ 网站访问正常');
            
            if (response.body.includes('<!DOCTYPE html>')) {
                console.log('✅ HTML页面加载正常');
                
                if (response.body.includes('root')) {
                    console.log('✅ React应用容器存在');
                    return true;
                } else {
                    console.log('⚠️  React应用容器未找到');
                    return false;
                }
            } else {
                console.log('❌ 响应不是有效的HTML页面');
                return false;
            }
        } else {
            console.log(`❌ 网站访问失败，状态码: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ 请求失败: ${error.message}`);
        return false;
    }
}

// 运行检查
checkDeployment()
    .then(success => {
        if (success) {
            console.log('\n🎉 部署检查成功！');
            console.log('🌐 访问地址: ' + PRODUCTION_URL);
        } else {
            console.log('\n⚠️  部署检查发现问题');
            console.log('💡 请检查GitHub Actions和Vercel Dashboard');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.log(`❌ 检查过程出错: ${error.message}`);
        process.exit(1);
    });
