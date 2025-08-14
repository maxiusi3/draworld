#!/usr/bin/env node

/**
 * TableStore表结构初始化脚本
 * 用于创建积分系统所需的表结构
 */

const TableStore = require('tablestore');

// 配置信息
const config = {
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: `https://${process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q'}.cn-hangzhou.ots.aliyuncs.com`,
  instancename: process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q',
};

if (!config.accessKeyId || !config.secretAccessKey) {
  console.error('请设置环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET');
  process.exit(1);
}

const client = new TableStore.Client(config);

// 表结构定义
const tables = [
  {
    tableName: 'user_credits',
    tableMeta: {
      tableName: 'user_credits',
      primaryKey: [
        {
          name: 'userId',
          type: 'STRING'
        }
      ]
    },
    reservedThroughput: {
      capacityUnit: {
        read: 0,
        write: 0
      }
    },
    tableOptions: {
      timeToLive: -1, // 数据永不过期
      maxVersions: 1
    }
  },
  {
    tableName: 'credit_transactions',
    tableMeta: {
      tableName: 'credit_transactions',
      primaryKey: [
        {
          name: 'userId',
          type: 'STRING'
        },
        {
          name: 'transactionId',
          type: 'STRING'
        }
      ]
    },
    reservedThroughput: {
      capacityUnit: {
        read: 0,
        write: 0
      }
    },
    tableOptions: {
      timeToLive: -1, // 数据永不过期
      maxVersions: 1
    }
  },
  {
    tableName: 'invite_codes',
    tableMeta: {
      tableName: 'invite_codes',
      primaryKey: [
        {
          name: 'code',
          type: 'STRING'
        }
      ]
    },
    reservedThroughput: {
      capacityUnit: {
        read: 0,
        write: 0
      }
    },
    tableOptions: {
      timeToLive: -1, // 数据永不过期
      maxVersions: 1
    }
  }
];

// 创建表的函数
async function createTable(tableConfig) {
  try {
    console.log(`正在创建表: ${tableConfig.tableName}`);
    await client.createTable(tableConfig);
    console.log(`✅ 表 ${tableConfig.tableName} 创建成功`);
  } catch (error) {
    if (error.code === 'OTSObjectAlreadyExist') {
      console.log(`⚠️  表 ${tableConfig.tableName} 已存在，跳过创建`);
    } else {
      console.error(`❌ 创建表 ${tableConfig.tableName} 失败:`, error.message);
      throw error;
    }
  }
}

// 等待表就绪的函数
async function waitForTableReady(tableName, maxWaitTime = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await client.describeTable({ tableName });
      if (result.tableStatus === 'ACTIVE') {
        console.log(`✅ 表 ${tableName} 已就绪`);
        return true;
      }
      console.log(`⏳ 等待表 ${tableName} 就绪... (状态: ${result.tableStatus})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`检查表状态失败:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error(`表 ${tableName} 在 ${maxWaitTime}ms 内未就绪`);
}

// 主函数
async function main() {
  console.log('🚀 开始初始化 TableStore 表结构...\n');
  
  try {
    // 创建所有表
    for (const tableConfig of tables) {
      await createTable(tableConfig);
      await waitForTableReady(tableConfig.tableName);
      console.log('');
    }
    
    console.log('🎉 所有表创建完成！');
    console.log('\n📋 已创建的表:');
    tables.forEach(table => {
      console.log(`  - ${table.tableName}`);
    });
    
    console.log('\n💡 提示:');
    console.log('  - user_credits: 用户积分账户表');
    console.log('  - credit_transactions: 积分交易记录表');
    console.log('  - invite_codes: 邀请码表');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, createTable, waitForTableReady };
