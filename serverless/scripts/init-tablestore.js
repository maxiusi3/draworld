#!/usr/bin/env node

/**
 * TableStore表结构初始化脚本
 * 用于创建积分系统所需的表结构
 */

const TableStore = require('tablestore');

// 配置信息
const config = {
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: `https://${process.env.TABLESTORE_INSTANCE || 'i01wvvv53p0q'}.cn-hangzhou.ots.aliyuncs.com`,
  instancename: process.env.TABLESTORE_INSTANCE || 'i01wvvv53p0q',
};

if (!config.accessKeyId || !config.accessKeySecret) {
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
        { name: 'tenantId', type: 'STRING' },       // 多租户预留（主键第一位）
        { name: 'code', type: 'STRING' }            // 邀请码（唯一）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
    // 字段说明：
    // - userId: STRING (邀请码创建者)
    // - isActive: BOOLEAN (是否有效)
    // - createdAt: INTEGER (创建时间戳)
    // - usedAt: INTEGER (使用时间戳，可选)
    // - usedByUserId: STRING (使用者ID，可选)
  },
  {
    tableName: 'invitations',
    tableMeta: {
      tableName: 'invitations',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户预留（主键第一位）
        { name: 'invitationId', type: 'STRING' }    // 关系ID（UUID）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
    // 字段说明：
    // - inviterUserId: STRING (邀请者ID)
    // - inviteeUserId: STRING (被邀请者ID)
    // - invitationCode: STRING (使用的邀请码)
    // - registrationRewardGiven: BOOLEAN (注册奖励是否已发放)
    // - firstVideoRewardGiven: BOOLEAN (首次视频奖励是否已发放)
    // - totalRewardsGiven: INTEGER (已发放的总奖励金额)
    // - createdAt: INTEGER (创建时间戳)
    // - updatedAt: INTEGER (更新时间戳)
  },
  {
    tableName: 'artworks',
    tableMeta: {
      tableName: 'artworks',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'artworkId', type: 'STRING' }       // 作品ID（UUID）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
    // 字段说明：
    // - userId: STRING (创作者ID)
    // - title: STRING (作品标题)
    // - description: STRING (作品描述)
    // - videoUrl: STRING (视频URL)
    // - thumbnailUrl: STRING (缩略图URL)
    // - isPublic: BOOLEAN (是否公开)
    // - likeCount: INTEGER (点赞数)
    // - commentCount: INTEGER (评论数)
    // - viewCount: INTEGER (观看数)
    // - tags: STRING (标签，JSON数组字符串)
    // - moderationStatus: STRING (审核状态: PENDING/APPROVED/REJECTED)
    // - createdAt: INTEGER (创建时间戳)
    // - updatedAt: INTEGER (更新时间戳)
  },
  {
    tableName: 'likes',
    tableMeta: {
      tableName: 'likes',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'likeId', type: 'STRING' }          // 点赞ID（userId_artworkId）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
    // 字段说明：
    // - userId: STRING (点赞用户ID)
    // - artworkId: STRING (作品ID)
    // - authorId: STRING (作品作者ID)
    // - createdAt: INTEGER (点赞时间戳)
  },
  {
    tableName: 'comments',
    tableMeta: {
      tableName: 'comments',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'commentId', type: 'STRING' }       // 评论ID（UUID）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
    // 字段说明：
    // - userId: STRING (评论用户ID)
    // - artworkId: STRING (作品ID)
    // - authorId: STRING (作品作者ID)
    // - content: STRING (评论内容)
    // - parentCommentId: STRING (父评论ID，可选)
    // - moderationStatus: STRING (审核状态: PENDING/APPROVED/REJECTED)
    // - moderatedAt: INTEGER (审核时间戳，可选)
    // - moderatorId: STRING (审核员ID，可选)
    // - moderationReason: STRING (审核原因/备注，可选)
    // - reportCount: INTEGER (举报次数，默认0)
    // - lastReportedAt: INTEGER (最后举报时间，可选)
    // - autoModerated: BOOLEAN (是否自动审核，默认false)
    // - sensitiveScore: DOUBLE (敏感内容评分，0-1，可选)
    // - createdAt: INTEGER (创建时间戳)
    // - updatedAt: INTEGER (更新时间戳)
  },
  {
    tableName: 'moderation_records',
    tableMeta: {
      tableName: 'moderation_records',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'recordId', type: 'STRING' }        // 审核记录ID（timestamp_uuid）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: 7776000, maxVersions: 1 }, // 90天TTL
    // 字段说明：
    // - contentType: STRING (内容类型: ARTWORK/COMMENT)
    // - contentId: STRING (内容ID)
    // - contentTitle: STRING (内容标题)
    // - contentBody: STRING (内容正文，截取前500字符)
    // - authorId: STRING (内容作者ID)
    // - authorName: STRING (内容作者名称)
    // - moderatorId: STRING (审核员ID)
    // - moderatorName: STRING (审核员名称)
    // - action: STRING (审核动作: APPROVE/REJECT/PENDING)
    // - previousStatus: STRING (之前状态)
    // - newStatus: STRING (新状态)
    // - reason: STRING (审核原因/备注)
    // - reportCount: INTEGER (举报次数)
    // - reportReasons: STRING (举报原因JSON数组)
    // - autoModerated: BOOLEAN (是否自动审核)
    // - processingTime: INTEGER (处理时间，毫秒)
    // - ipAddress: STRING (操作IP)
    // - userAgent: STRING (用户代理)
    // - createdAt: INTEGER (创建时间戳)
  },
  {
    tableName: 'content_reports',
    tableMeta: {
      tableName: 'content_reports',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'reportId', type: 'STRING' }        // 举报ID（timestamp_uuid）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: 2592000, maxVersions: 1 }, // 30天TTL
    // 字段说明：
    // - contentType: STRING (内容类型: ARTWORK/COMMENT)
    // - contentId: STRING (被举报内容ID)
    // - reporterId: STRING (举报人ID)
    // - reporterName: STRING (举报人名称)
    // - reason: STRING (举报原因: SPAM/INAPPROPRIATE/COPYRIGHT/HARASSMENT/OTHER)
    // - description: STRING (详细描述)
    // - status: STRING (处理状态: PENDING/REVIEWED/RESOLVED/DISMISSED)
    // - reviewerId: STRING (处理人ID，可选)
    // - reviewerName: STRING (处理人名称，可选)
    // - reviewNote: STRING (处理备注，可选)
    // - ipAddress: STRING (举报IP)
    // - userAgent: STRING (用户代理)
    // - createdAt: INTEGER (创建时间戳)
    // - reviewedAt: INTEGER (处理时间戳，可选)
  },
  {
    tableName: 'orders',
    tableMeta: {
      tableName: 'orders',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'orderId', type: 'STRING' }         // 订单ID（order_timestamp_random）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: -1, maxVersions: 1 },
    // 字段说明：
    // - userId: STRING (用户ID)
    // - packageId: STRING (套餐ID)
    // - packageName: STRING (套餐名称)
    // - credits: INTEGER (基础积分数)
    // - bonusCredits: INTEGER (赠送积分数)
    // - totalCredits: INTEGER (总积分数 = credits + bonusCredits)
    // - priceYuan: DOUBLE (价格，单位：元)
    // - currency: STRING (货币类型，默认CNY)
    // - status: STRING (订单状态: PENDING/PAID/FAILED/CANCELLED/REFUNDED)
    // - paymentMethod: STRING (支付方式: ALIPAY/WECHAT/BANK_CARD)
    // - paymentId: STRING (第三方支付ID)
    // - paymentUrl: STRING (支付链接，可选)
    // - idempotencyKey: STRING (幂等键，防重复提交)
    // - failureReason: STRING (失败原因，可选)
    // - refundReason: STRING (退款原因，可选)
    // - refundAmount: DOUBLE (退款金额，可选)
    // - creditsGranted: BOOLEAN (积分是否已发放)
    // - notificationSent: BOOLEAN (通知是否已发送)
    // - createdAt: INTEGER (创建时间戳)
    // - updatedAt: INTEGER (更新时间戳)
    // - paidAt: INTEGER (支付时间戳，可选)
    // - expiredAt: INTEGER (过期时间戳，可选)
  },
  {
    tableName: 'payment_logs',
    tableMeta: {
      tableName: 'payment_logs',
      primaryKey: [
        { name: 'tenantId', type: 'STRING' },       // 多租户ID（预留）
        { name: 'logId', type: 'STRING' }           // 日志ID（timestamp_uuid）
      ]
    },
    reservedThroughput: { capacityUnit: { read: 0, write: 0 } },
    tableOptions: { timeToLive: 2592000, maxVersions: 1 }, // 30天TTL
    // 字段说明：
    // - orderId: STRING (关联订单ID)
    // - userId: STRING (用户ID)
    // - action: STRING (操作类型: CREATE/NOTIFY/QUERY/REFUND)
    // - paymentMethod: STRING (支付方式)
    // - paymentId: STRING (第三方支付ID)
    // - requestData: STRING (请求数据JSON)
    // - responseData: STRING (响应数据JSON)
    // - status: STRING (操作状态: SUCCESS/FAILED/PENDING)
    // - errorCode: STRING (错误码，可选)
    // - errorMessage: STRING (错误信息，可选)
    // - processingTime: INTEGER (处理时间，毫秒)
    // - ipAddress: STRING (客户端IP)
    // - userAgent: STRING (用户代理)
    // - createdAt: INTEGER (创建时间戳)
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
    console.log('  - invite_codes: 邀请码表（按 tenantId + code 主键）');
    console.log('  - invitations: 邀请关系表（按 tenantId + invitationId 主键）');

    console.log('\n🔍 查询模式设计:');
    console.log('  📋 invite_codes 查询路径:');
    console.log('    - 按邀请码查找: GetRow(tenantId, code)');
    console.log('    - 按用户查找邀请码: GetRange(tenantId) + 过滤 userId');
    console.log('  📋 invitations 查询路径:');
    console.log('    - 按关系ID查找: GetRow(tenantId, invitationId)');
    console.log('    - 按邀请者查找: GetRange(tenantId) + 过滤 inviterUserId');
    console.log('    - 按被邀请者查找: GetRange(tenantId) + 过滤 inviteeUserId');

    console.log('\n⚡ 性能预估:');
    console.log('  - 预估 QPS: 读 < 100, 写 < 50');
    console.log('  - 主要瓶颈: 按用户查询需要扫描，建议缓存常用查询');
    console.log('  - 优化建议: 考虑为高频查询添加全局二级索引（GSI）');
    
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
