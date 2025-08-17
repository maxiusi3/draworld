/**
 * 开发环境API中间件
 * 为Vite开发服务器提供API模拟
 */

// 模拟数据存储
const mockData = {
  users: new Map(),
  orders: new Map(),
  videos: new Map(),
  credits: new Map(),
  invitations: new Map(),
  community: new Map()
};

// 生成模拟用户ID
function getUserId(token) {
  if (token.includes('demo-token')) return 'demo-user';
  if (token.includes('new-user-token')) return 'new-user';
  if (token.includes('admin-token')) return 'admin-user';
  if (token.includes('test-user-1')) return 'test-user-1';
  if (token.includes('test-user-2')) return 'test-user-2';
  return `user-${token.slice(-8)}`;
}

// 初始化用户数据
function initUserData(userId) {
  if (!mockData.credits.has(userId)) {
    // 根据用户类型设置初始积分
    let initialCredits = 150; // 默认积分
    if (userId === 'demo-user') initialCredits = 200;
    if (userId === 'new-user') initialCredits = 50;
    if (userId === 'admin-user') initialCredits = 1000;

    mockData.credits.set(userId, {
      balance: initialCredits,
      transactions: [
        {
          id: `tx-init-${userId}`,
          type: 'EARN',
          amount: initialCredits,
          description: '初始积分',
          createdAt: Date.now() - 86400000
        }
      ]
    });
  }

  if (!mockData.users.has(userId)) {
    mockData.users.set(userId, {
      id: userId,
      name: userId === 'demo-user' ? '演示用户' :
            userId === 'new-user' ? '新用户' :
            userId === 'admin-user' ? '管理员' : userId,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      createdAt: Date.now() - 86400000,
      lastSignin: null
    });
  }
}

// API处理函数
const apiHandlers = {
  // 视频相关API
  '/api/video/list': (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);
    const limit = parseInt(req.query.limit) || 20;

    // 初始化用户数据
    initUserData(userId);

    // 获取用户的视频任务
    const userTasks = Array.from(mockData.videos.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt) // 按创建时间倒序
      .slice(0, limit)
      .map(task => ({
        id: task.taskId, // 添加id字段用于React key
        taskId: task.taskId,
        status: task.status,
        progress: task.progress || 0,
        resultVideoUrl: task.resultVideoUrl || null,
        inputImageUrl: task.inputImageUrl,
        prompt: task.params?.prompt || '无描述',
        musicStyle: task.params?.musicStyle || 'Joyful',
        aspectRatio: task.params?.aspectRatio || '16:9',
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt || null
      }));

    res.statusCode = 200;
    res.end(JSON.stringify({ tasks: userTasks }));
  },

  '/api/video/start': (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);

    // 初始化用户数据
    initUserData(userId);

    const { inputImageUrl, params } = req.body || {};

    if (!inputImageUrl) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Input image URL is required' }));
      return;
    }

    // 检查用户积分
    const userCredits = mockData.credits.get(userId);
    const requiredCredits = 1; // 演示环境：降低积分要求到1积分，便于测试

    if (userCredits.balance < requiredCredits) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        error: 'Insufficient credits',
        required: requiredCredits,
        current: userCredits.balance,
        message: `需要 ${requiredCredits} 积分，当前余额 ${userCredits.balance} 积分`
      }));
      return;
    }

    // 扣除积分
    userCredits.balance -= requiredCredits;
    userCredits.transactions.push({
      id: `tx-video-${Date.now()}`,
      type: 'SPEND',
      amount: requiredCredits,
      description: '视频生成消费',
      createdAt: Date.now()
    });

    const taskId = `task-${Date.now()}`;

    // 存储视频任务
    mockData.videos.set(taskId, {
      taskId,
      userId,
      inputImageUrl,
      params: params || {},
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // 模拟视频生成进度
    setTimeout(() => {
      const task = mockData.videos.get(taskId);
      if (task) {
        task.status = 'processing';
        task.progress = 25;
        task.updatedAt = Date.now();
      }
    }, 2000);

    setTimeout(() => {
      const task = mockData.videos.get(taskId);
      if (task) {
        task.status = 'processing';
        task.progress = 75;
        task.updatedAt = Date.now();
      }
    }, 8000);

    setTimeout(() => {
      const task = mockData.videos.get(taskId);
      if (task) {
        task.status = 'completed';
        task.progress = 100;
        // 使用真实可访问的测试视频URL
        task.resultVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
        task.completedAt = Date.now();
        task.updatedAt = Date.now();
      }
    }, 15000);

    res.statusCode = 200;
    res.end(JSON.stringify({
      taskId,
      status: 'pending',
      message: '视频生成任务已创建',
      creditsUsed: requiredCredits,
      remainingCredits: userCredits.balance
    }));
  },

  '/api/video/status': (req, res) => {
    const taskId = req.query.taskId || 'unknown';
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);

    const task = mockData.videos.get(taskId);

    if (!task) {
      res.statusCode = 404;
      res.end(JSON.stringify({
        error: 'Task not found',
        taskId
      }));
      return;
    }

    if (task.userId !== userId) {
      res.statusCode = 403;
      res.end(JSON.stringify({
        error: 'Access denied',
        taskId
      }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      message: task.status === 'pending' ? '任务排队中...' :
               task.status === 'processing' ? '视频生成中...' :
               task.status === 'completed' ? '视频生成完成' :
               task.status === 'failed' ? '视频生成失败' : '未知状态',
      resultVideoUrl: task.resultVideoUrl || null,
      inputImageUrl: task.inputImageUrl,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt || null
    }));
  },

  // 订单相关API
  '/api/orders': (req, res) => {
    const action = req.query.action;
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);

    // 初始化用户数据
    initUserData(userId);

    if (action === 'packages') {
      res.statusCode = 200;
      res.end(JSON.stringify({
        packages: [
          {
            id: 'basic',
            name: '基础套餐',
            credits: 100,
            priceYuan: 10,
            description: '适合轻度使用'
          },
          {
            id: 'premium',
            name: '高级套餐',
            credits: 500,
            priceYuan: 45,
            description: '适合重度使用'
          },
          {
            id: 'pro',
            name: '专业套餐',
            credits: 1000,
            priceYuan: 80,
            description: '适合专业用户'
          }
        ]
      }));
    } else if (action === 'list') {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const allUserOrders = Array.from(mockData.orders.values())
        .filter(order => order.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt); // 按创建时间倒序

      const paginatedOrders = allUserOrders.slice(offset, offset + limit);

      res.statusCode = 200;
      res.end(JSON.stringify({
        orders: paginatedOrders,
        total: allUserOrders.length,
        hasMore: offset + limit < allUserOrders.length
      }));
    } else if (action === 'create') {
      const { packageId, paymentMethod } = req.body || {};

      if (!packageId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Package ID is required' }));
        return;
      }

      // 获取套餐信息
      const packages = {
        'basic': { credits: 100, priceYuan: 10, name: '基础套餐' },
        'premium': { credits: 500, priceYuan: 45, name: '高级套餐' },
        'pro': { credits: 1000, priceYuan: 80, name: '专业套餐' }
      };

      const selectedPackage = packages[packageId];
      if (!selectedPackage) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid package ID' }));
        return;
      }

      const orderId = `order-${Date.now()}`;
      const order = {
        id: orderId,
        userId: userId,
        packageId: packageId,
        packageName: selectedPackage.name,
        credits: selectedPackage.credits,
        priceYuan: selectedPackage.priceYuan,
        paymentMethod: paymentMethod || 'ALIPAY',
        status: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockData.orders.set(orderId, order);

      // 模拟支付成功（演示模式）
      setTimeout(() => {
        order.status = 'PAID';
        order.paidAt = Date.now();
        order.updatedAt = Date.now();

        // 添加积分到用户账户
        const userCredits = mockData.credits.get(userId);
        userCredits.balance += selectedPackage.credits;
        userCredits.transactions.push({
          id: `tx-purchase-${orderId}`,
          type: 'EARN',
          amount: selectedPackage.credits,
          description: `购买${selectedPackage.name}`,
          createdAt: Date.now(),
          orderId: orderId
        });

        console.log(`[DEV API] 模拟支付完成，用户 ${userId} 获得 ${selectedPackage.credits} 积分`);
      }, 3000); // 3秒后模拟支付成功

      res.statusCode = 200;
      res.end(JSON.stringify({
        order: order,
        message: '订单创建成功，正在处理支付...'
      }));
    } else {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid action' }));
    }
  },

  // 积分相关API
  '/api/credits': (req, res) => {
    const action = req.query.action;
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);

    // 初始化用户数据
    initUserData(userId);

    if (action === 'balance') {
      const userCredits = mockData.credits.get(userId);
      res.statusCode = 200;
      res.end(JSON.stringify({ balance: userCredits.balance }));
    } else if (action === 'history') {
      const userCredits = mockData.credits.get(userId);
      res.statusCode = 200;
      res.end(JSON.stringify({
        transactions: userCredits.transactions || []
      }));
    } else if (action === 'daily-signin') {
      const userCredits = mockData.credits.get(userId);
      const user = mockData.users.get(userId);
      const today = new Date().toDateString();
      const lastSignin = user.lastSignin ? new Date(user.lastSignin).toDateString() : null;

      if (lastSignin === today) {
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          creditsEarned: 0,
          alreadySignedToday: true
        }));
      } else {
        const earnedCredits = 10;
        userCredits.balance += earnedCredits;
        userCredits.transactions.push({
          id: `tx-signin-${Date.now()}`,
          type: 'EARN',
          amount: earnedCredits,
          description: '每日签到',
          createdAt: Date.now()
        });
        user.lastSignin = Date.now();

        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          creditsEarned: earnedCredits,
          alreadySignedToday: false
        }));
      }
    } else {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid action' }));
    }
  },

  // 邀请相关API
  '/api/invitations': (req, res) => {
    const action = req.query.action;
    
    if (action === 'my-code') {
      res.statusCode = 200;
    res.end(JSON.stringify({ invitation_code: 'DEMO123456' }));
    } else if (action === 'register-with-code') {
      res.statusCode = 200;
    res.end(JSON.stringify({
        success: true,
        rewards: {
          credits: 50,
          description: '邀请注册奖励'
        }
      }));
    } else if (action === 'trigger-video-reward') {
      res.statusCode = 200;
    res.end(JSON.stringify({
        success: true,
        reward: {
          credits: 30,
          description: '首次视频生成奖励'
        }
      }));
    } else {
      res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid action' }));
    }
  },

  // 社区相关API
  '/api/community': (req, res) => {
    const action = req.query.action;
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);

    // 初始化用户数据
    initUserData(userId);

    if (action === 'list') {
      // 创建更丰富的社区作品数据
      const artworks = [
        {
          id: 'artwork-1',
          title: '梦幻森林',
          description: '一个充满魔法的森林场景',
          imageUrl: 'https://picsum.photos/400/300?random=1',
          videoUrl: 'https://example.com/video1.mp4',
          likes: 25,
          comments: 8,
          userId: 'demo-user',
          userName: '演示用户',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user',
          createdAt: Date.now() - 86400000,
          tags: ['森林', '魔法', '梦幻']
        },
        {
          id: 'artwork-2',
          title: '城市夜景',
          description: '繁华都市的霓虹夜晚',
          imageUrl: 'https://picsum.photos/400/300?random=2',
          videoUrl: 'https://example.com/video2.mp4',
          likes: 42,
          comments: 15,
          userId: 'test-user-1',
          userName: '创作者一号',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-1',
          createdAt: Date.now() - 172800000,
          tags: ['城市', '夜景', '霓虹']
        },
        {
          id: 'artwork-3',
          title: '海底世界',
          description: '神秘的深海生物聚会',
          imageUrl: 'https://picsum.photos/400/300?random=3',
          videoUrl: 'https://example.com/video3.mp4',
          likes: 18,
          comments: 5,
          userId: 'test-user-2',
          userName: '海洋探索者',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-2',
          createdAt: Date.now() - 259200000,
          tags: ['海洋', '深海', '生物']
        },
        {
          id: 'artwork-4',
          title: '太空漫步',
          description: '宇航员在星际间的冒险',
          imageUrl: 'https://picsum.photos/400/300?random=4',
          videoUrl: 'https://example.com/video4.mp4',
          likes: 67,
          comments: 22,
          userId: 'new-user',
          userName: '新用户',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=new-user',
          createdAt: Date.now() - 345600000,
          tags: ['太空', '宇航员', '星际']
        },
        {
          id: 'artwork-5',
          title: '古代遗迹',
          description: '失落文明的神秘建筑',
          imageUrl: 'https://picsum.photos/400/300?random=5',
          videoUrl: 'https://example.com/video5.mp4',
          likes: 33,
          comments: 12,
          userId: 'admin-user',
          userName: '管理员',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin-user',
          createdAt: Date.now() - 432000000,
          tags: ['古代', '遗迹', '文明']
        }
      ];

      res.statusCode = 200;
      res.end(JSON.stringify({ artworks }));
    } else if (action === 'like') {
      const { artworkId } = req.body || {};

      if (!artworkId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Artwork ID is required' }));
        return;
      }

      // 给用户添加点赞奖励
      const userCredits = mockData.credits.get(userId);
      const rewardCredits = 2;
      userCredits.balance += rewardCredits;
      userCredits.transactions.push({
        id: `tx-like-${Date.now()}`,
        type: 'EARN',
        amount: rewardCredits,
        description: `点赞作品奖励`,
        createdAt: Date.now(),
        artworkId: artworkId
      });

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        rewards: {
          credits: rewardCredits,
          description: '点赞奖励'
        },
        newBalance: userCredits.balance
      }));
    } else if (action === 'comment') {
      const { artworkId, content } = req.body || {};

      if (!artworkId || !content) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Artwork ID and content are required' }));
        return;
      }

      // 给用户添加评论奖励
      const userCredits = mockData.credits.get(userId);
      const rewardCredits = 5;
      userCredits.balance += rewardCredits;
      userCredits.transactions.push({
        id: `tx-comment-${Date.now()}`,
        type: 'EARN',
        amount: rewardCredits,
        description: `评论作品奖励`,
        createdAt: Date.now(),
        artworkId: artworkId
      });

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        rewards: {
          credits: rewardCredits,
          description: '评论奖励'
        },
        newBalance: userCredits.balance
      }));
    } else if (action === 'artworks' && req.method === 'POST') {
      const { title, description, videoUrl, thumbnailUrl, isPublic = true } = req.body || {};

      if (!title || !videoUrl) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Title and video URL are required' }));
        return;
      }

      // 创建作品记录
      const artworkId = `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const artwork = {
        id: artworkId,
        user_id: userId,
        title,
        description: description || '',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        is_public: isPublic,
        like_count: 0,
        comment_count: 0,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 保存到用户的社区数据中
      if (!mockData.community.has(userId)) {
        mockData.community.set(userId, { artworks: [], likes: [], comments: [] });
      }

      const userCommunityData = mockData.community.get(userId);
      userCommunityData.artworks.push(artwork);

      console.log(`[DEV API] 用户 ${userId} 创建作品: ${title}`);
      console.log(`[DEV API] 作品ID: ${artworkId}`);
      console.log(`[DEV API] 视频URL: ${videoUrl}`);

      res.statusCode = 201;
      res.end(JSON.stringify({
        success: true,
        data: artwork
      }));
    } else {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid action' }));
    }
  },

  // 作品API（Gallery页面使用）
  '/api/artworks': (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sortBy = req.query.sortBy || 'LATEST';
    const tags = req.query.tags || '';

    // 创建丰富的作品数据
    const allArtworks = [
      {
        id: 'artwork-1',
        title: '梦幻森林',
        description: '一个充满魔法的森林场景，古老的树木在月光下闪闪发光',
        imageUrl: 'https://picsum.photos/400/300?random=1',
        videoUrl: 'https://example.com/video1.mp4',
        likes: 25,
        comments: 8,
        views: 156,
        userId: 'demo-user',
        userName: '演示用户',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user',
        createdAt: Date.now() - 86400000,
        tags: ['森林', '魔法', '梦幻', '自然'],
        isPublic: true
      },
      {
        id: 'artwork-2',
        title: '城市夜景',
        description: '繁华都市的霓虹夜晚，车水马龙的街道充满生机',
        imageUrl: 'https://picsum.photos/400/300?random=2',
        videoUrl: 'https://example.com/video2.mp4',
        likes: 42,
        comments: 15,
        views: 289,
        userId: 'test-user-1',
        userName: '创作者一号',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-1',
        createdAt: Date.now() - 172800000,
        tags: ['城市', '夜景', '霓虹', '现代'],
        isPublic: true
      },
      {
        id: 'artwork-3',
        title: '海底世界',
        description: '神秘的深海生物聚会，珊瑚礁中游弋着奇异的鱼类',
        imageUrl: 'https://picsum.photos/400/300?random=3',
        videoUrl: 'https://example.com/video3.mp4',
        likes: 18,
        comments: 5,
        views: 134,
        userId: 'test-user-2',
        userName: '海洋探索者',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-2',
        createdAt: Date.now() - 259200000,
        tags: ['海洋', '深海', '生物', '神秘'],
        isPublic: true
      },
      {
        id: 'artwork-4',
        title: '太空漫步',
        description: '宇航员在星际间的冒险，浩瀚宇宙中的孤独身影',
        imageUrl: 'https://picsum.photos/400/300?random=4',
        videoUrl: 'https://example.com/video4.mp4',
        likes: 67,
        comments: 22,
        views: 445,
        userId: 'new-user',
        userName: '新用户',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=new-user',
        createdAt: Date.now() - 345600000,
        tags: ['太空', '宇航员', '星际', '科幻'],
        isPublic: true
      },
      {
        id: 'artwork-5',
        title: '古代遗迹',
        description: '失落文明的神秘建筑，时间在这里留下了深深的印记',
        imageUrl: 'https://picsum.photos/400/300?random=5',
        videoUrl: 'https://example.com/video5.mp4',
        likes: 33,
        comments: 12,
        views: 198,
        userId: 'admin-user',
        userName: '管理员',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin-user',
        createdAt: Date.now() - 432000000,
        tags: ['古代', '遗迹', '文明', '历史'],
        isPublic: true
      },
      {
        id: 'artwork-6',
        title: '樱花飞舞',
        description: '春日里的樱花盛开，粉色花瓣在微风中翩翩起舞',
        imageUrl: 'https://picsum.photos/400/300?random=6',
        videoUrl: 'https://example.com/video6.mp4',
        likes: 89,
        comments: 31,
        views: 567,
        userId: 'demo-user',
        userName: '演示用户',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo-user',
        createdAt: Date.now() - 518400000,
        tags: ['樱花', '春天', '浪漫', '自然'],
        isPublic: true
      },
      {
        id: 'artwork-7',
        title: '机械朋克',
        description: '蒸汽朋克风格的机械装置，齿轮与蒸汽的完美结合',
        imageUrl: 'https://picsum.photos/400/300?random=7',
        videoUrl: 'https://example.com/video7.mp4',
        likes: 54,
        comments: 18,
        views: 312,
        userId: 'test-user-1',
        userName: '创作者一号',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-1',
        createdAt: Date.now() - 604800000,
        tags: ['机械', '朋克', '蒸汽', '复古'],
        isPublic: true
      },
      {
        id: 'artwork-8',
        title: '极光之夜',
        description: '北极上空的绚烂极光，绿色光带在夜空中舞动',
        imageUrl: 'https://picsum.photos/400/300?random=8',
        videoUrl: 'https://example.com/video8.mp4',
        likes: 76,
        comments: 25,
        views: 423,
        userId: 'test-user-2',
        userName: '海洋探索者',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-2',
        createdAt: Date.now() - 691200000,
        tags: ['极光', '夜空', '自然', '奇观'],
        isPublic: true
      }
    ];

    // 根据排序方式排序
    let sortedArtworks = [...allArtworks];
    if (sortBy === 'LATEST') {
      sortedArtworks.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'POPULAR') {
      sortedArtworks.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'VIEWS') {
      sortedArtworks.sort((a, b) => b.views - a.views);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArtworks = sortedArtworks.slice(startIndex, endIndex);

    res.statusCode = 200;
    res.end(JSON.stringify({
      artworks: paginatedArtworks,
      pagination: {
        page,
        limit,
        total: allArtworks.length,
        totalPages: Math.ceil(allArtworks.length / limit),
        hasNext: endIndex < allArtworks.length,
        hasPrev: page > 1
      }
    }));
  },

  // 管理相关API
  '/api/admin/moderation': (req, res) => {
    const action = req.query.action;

    if (action === 'list') {
      res.statusCode = 200;
    res.end(JSON.stringify({ items: [] }));
    } else if (action === 'approve') {
      res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    } else {
      res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid action' }));
    }
  },

  // 用户作品API
  '/api/users/me/artworks': (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 'demo-token';
    const userId = getUserId(token);

    // 初始化用户数据
    initUserData(userId);

    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // 获取用户的作品（从社区作品中筛选）
    const userArtworks = [];

    // 从mockData.community中获取用户作品
    if (mockData.community.has(userId)) {
      const userCommunityData = mockData.community.get(userId);
      if (userCommunityData.artworks) {
        userArtworks.push(...userCommunityData.artworks);
      }
    }

    // 按创建时间排序
    userArtworks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArtworks = userArtworks.slice(startIndex, endIndex);

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      artworks: paginatedArtworks,
      total: userArtworks.length,
      page,
      limit,
      hasMore: endIndex < userArtworks.length
    }));
  },

  // 图片上传API
  '/api/upload/image': (req, res) => {
    console.log('[DEV API] 图片上传请求开始');
    console.log('[DEV API] Method:', req.method);

    if (req.method !== 'POST') {
      console.log('[DEV API] 错误：不支持的方法', req.method);
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[DEV API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[DEV API] 错误：缺少或无效的 Authorization 头');
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // 解析请求体
    const { imageData, fileName, contentType } = req.body || {};

    if (!imageData) {
      console.log('[DEV API] 错误：缺少图片数据');
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing image data' }));
      return;
    }

    console.log('[DEV API] 开始处理图片上传...');
    console.log('[DEV API] 文件名:', fileName || 'image.jpg');
    console.log('[DEV API] 内容类型:', contentType || 'image/jpeg');
    console.log('[DEV API] 数据大小:', imageData.length, 'bytes');

    try {
      // 使用 base64 内联图片（适合演示环境）
      const dataUrl = `data:${contentType || 'image/jpeg'};base64,${imageData}`;

      console.log('[DEV API] 使用 base64 内联图片');
      console.log('[DEV API] 数据 URL 长度:', dataUrl.length);

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        url: dataUrl,
        message: '图片上传成功（使用 base64 内联）'
      }));

    } catch (error) {
      console.error('[DEV API] 上传失败:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({
        error: 'Upload failed',
        message: error.message
      }));
    }
  }
};

// 中间件函数
export function devApiMiddleware() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api', (req, res, next) => {
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // 解析URL
        const url = new URL(req.url, `http://${req.headers.host}`);
        let pathname = url.pathname;

        // 确保路径以/api开头
        if (!pathname.startsWith('/api')) {
          pathname = '/api' + pathname;
        }

        console.log(`[DEV API] ${req.method} ${pathname}${url.search}`);

        // 查找匹配的处理函数
        const handler = apiHandlers[pathname];
        if (handler) {
          try {
            // 添加query参数到req对象
            req.query = Object.fromEntries(url.searchParams);
            
            // 处理POST请求的body
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  req.body = JSON.parse(body);
                } catch (e) {
                  req.body = {};
                }
                handler(req, res);
              });
            } else {
              handler(req, res);
            }
          } catch (error) {
            console.error('[DEV API] 处理错误:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } else {
          console.log(`[DEV API] 未找到处理函数: ${pathname}`);
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'API endpoint not found' }));
        }
      });
    }
  };
}
