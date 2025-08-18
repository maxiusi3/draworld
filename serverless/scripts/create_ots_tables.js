// 语言: JavaScript
// 作用: 创建 Tablestore 表：videos 与 videos_by_user
// 运行: 在 serverless 目录执行 `node scripts/create_ots_tables.js`

const TableStore = require('tablestore');

const REGION = process.env.OTS_REGION || process.env.OSS_REGION || 'cn-hangzhou';
const INSTANCE = process.env.TABLESTORE_INSTANCE || process.env.OTS_INSTANCE || 'i01wvvv53p0q';

function client() {
  return new TableStore.Client({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    endpoint: `https://${INSTANCE}.${REGION}.ots.aliyuncs.com`,
    instancename: INSTANCE,
  });
}

async function createVideosTable(cli) {
  const params = {
    tableMeta: {
      tableName: 'videos',
      primaryKey: [
        { name: 'tenantId', type: TableStore.PrimaryKeyType.STRING },
        { name: 'videoId', type: TableStore.PrimaryKeyType.STRING },
      ],
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
  };
  try {
    await cli.createTable(params);
    console.log('[OK] Created table videos');
  } catch (e) {
    if (String(e).includes('OTSObjectAlreadyExist')) {
      console.log('[SKIP] Table videos already exists');
    } else {
      throw e;
    }
  }
}

async function createVideosByUserTable(cli) {
  const params = {
    tableMeta: {
      tableName: 'videos_by_user',
      primaryKey: [
        { name: 'tenantId', type: TableStore.PrimaryKeyType.STRING },
        { name: 'userId', type: TableStore.PrimaryKeyType.STRING },
        { name: 'createdAt', type: TableStore.PrimaryKeyType.INTEGER },
        { name: 'videoId', type: TableStore.PrimaryKeyType.STRING },
      ],
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
  };
  try {
    await cli.createTable(params);
    console.log('[OK] Created table videos_by_user');
  } catch (e) {
    if (String(e).includes('OTSObjectAlreadyExist')) {
      console.log('[SKIP] Table videos_by_user already exists');
    } else {
      throw e;
    }
  }
}

async function main() {
  if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || !process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET) {
    console.error('Missing AK/SK env: ALIBABA_CLOUD_ACCESS_KEY_ID / ALIBABA_CLOUD_ACCESS_KEY_SECRET');
    process.exit(1);
  }

  try {
    const cli = client();
    await createVideosTable(cli);
    await createVideosByUserTable(cli);
    console.log('[DONE] Tablestore tables ensured');
  } catch (error) {
    console.warn('[WARNING] Tablestore table creation failed, but continuing deployment...');
    console.warn('Error details:', error.message);
    console.warn('Please create tables manually in Tablestore console later.');
    console.log('[SKIP] Continuing with FC deployment...');
    // 不退出进程，让部署继续
  }
}

main().catch((e) => {
  console.error('[ERROR] Unexpected error in table creation script:', e);
  console.log('[CONTINUE] Proceeding with deployment despite table creation issues...');
  // 即使出现意外错误也不中断部署
  process.exit(0); // 改为成功退出
});

