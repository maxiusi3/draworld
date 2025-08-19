// TableStore表结构初始化脚本
// 用于创建积分商店所需的数据表

const TableStore = require('tablestore');

// 环境变量配置
const instanceName = process.env.TABLESTORE_INSTANCE;
const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

if (!instanceName || !accessKeyId || !accessKeySecret) {
  console.error('缺少必要的环境变量:');
  console.error('- TABLESTORE_INSTANCE:', instanceName);
  console.error('- ALIBABA_CLOUD_ACCESS_KEY_ID:', accessKeyId ? '已设置' : '未设置');
  console.error('- ALIBABA_CLOUD_ACCESS_KEY_SECRET:', accessKeySecret ? '已设置' : '未设置');
  process.exit(1);
}

// 创建TableStore客户端
const client = new TableStore.Client({
  accessKeyId,
  accessKeySecret,
  endpoint: `https://${instanceName}.cn-hangzhou.ots.aliyuncs.com`,
  instancename: instanceName,
});

// 创建orders表
async function createOrdersTable() {
  const tableMeta = {
    tableName: 'orders',
    primaryKey: [
      {
        name: 'tenantId',
        type: 'STRING'
      },
      {
        name: 'orderId',
        type: 'STRING'
      }
    ]
  };

  const reservedThroughput = {
    capacityUnit: {
      read: 0,
      write: 0
    }
  };

  const tableOptions = {
    timeToLive: -1, // 数据永不过期
    maxVersions: 1  // 只保留一个版本
  };

  const params = {
    tableMeta,
    reservedThroughput,
    tableOptions
  };

  try {
    console.log('正在创建orders表...');
    const result = await client.createTable(params);
    console.log('orders表创建成功:', result);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('orders表已存在，跳过创建');
      return true;
    }
    console.error('创建orders表失败:', error);
    return false;
  }
}

// 创建credits表
async function createCreditsTable() {
  const tableMeta = {
    tableName: 'credits',
    primaryKey: [
      {
        name: 'tenantId',
        type: 'STRING'
      },
      {
        name: 'userId',
        type: 'STRING'
      }
    ]
  };

  const reservedThroughput = {
    capacityUnit: {
      read: 0,
      write: 0
    }
  };

  const tableOptions = {
    timeToLive: -1, // 数据永不过期
    maxVersions: 1  // 只保留一个版本
  };

  const params = {
    tableMeta,
    reservedThroughput,
    tableOptions
  };

  try {
    console.log('正在创建credits表...');
    const result = await client.createTable(params);
    console.log('credits表创建成功:', result);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('credits表已存在，跳过创建');
      return true;
    }
    console.error('创建credits表失败:', error);
    return false;
  }
}

// 主函数
async function main() {
  console.log('=== TableStore表结构初始化 ===');
  console.log('实例名:', instanceName);
  console.log('区域: cn-hangzhou');
  console.log('');

  try {
    // 创建orders表
    const ordersSuccess = await createOrdersTable();
    
    // 创建credits表
    const creditsSuccess = await createCreditsTable();

    if (ordersSuccess && creditsSuccess) {
      console.log('\n✅ 所有表创建成功！');
      console.log('现在可以正常使用积分商店功能了。');
    } else {
      console.log('\n❌ 部分表创建失败，请检查错误信息。');
      process.exit(1);
    }
  } catch (error) {
    console.error('初始化过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createOrdersTable,
  createCreditsTable
};
