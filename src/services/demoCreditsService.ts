// 演示模式积分服务 - 前端状态管理
// 解决 Vercel 无服务器环境中 API 函数不共享内存的问题

interface DemoUserCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
  daily_like_given: number;
  last_daily_reset: string;
  created_at: string;
  updated_at: string;
}

interface DemoTransaction {
  id: string;
  user_id: string;
  transaction_type: 'EARN' | 'SPEND';
  amount: number;
  balance_after: number;
  reason: string;
  reference_id?: string;
  description?: string;
  created_at: string;
  reasonDescription?: string;
  displayAmount?: string;
}

interface DemoSigninRecord {
  date: string;
  reward: number;
  transaction_id: string;
}

interface DemoUserData {
  credits: DemoUserCredits;
  transactions: DemoTransaction[];
  signinRecords: DemoSigninRecord[];
}

class DemoCreditsService {
  private storageKey = 'demo_credits_data';
  
  private getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('读取演示积分数据失败:', error);
      return null;
    }
  }
  
  private setStorageData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // 触发积分更新事件，通知其他组件
      window.dispatchEvent(new CustomEvent('creditsUpdated'));
    } catch (error) {
      console.error('保存演示积分数据失败:', error);
    }
  }
  
  private initializeUser(userId: string) {
    const data = this.getStorageData() || {};
    
    if (!data[userId]) {
      const now = new Date().toISOString();
      const registrationTransaction: DemoTransaction = {
        id: `demo-tx-registration-${Date.now()}`,
        user_id: userId,
        transaction_type: 'EARN',
        amount: 150,
        balance_after: 150,
        reason: 'REGISTRATION_BONUS',
        description: '新用户注册奖励',
        created_at: now,
      };
      
      data[userId] = {
        credits: {
          balance: 150,
          total_earned: 150,
          total_spent: 0,
          daily_like_given: 0,
          last_daily_reset: new Date().toISOString().split('T')[0],
          created_at: now,
          updated_at: now,
        },
        transactions: [registrationTransaction],
        signinRecords: [],
      };
      
      this.setStorageData(data);
    }
    
    return data[userId];
  }
  
  getUserCredits(userId: string): DemoUserCredits {
    const userData = this.initializeUser(userId);
    return userData.credits;
  }

  // 获取用户完整数据（供其他服务使用）
  getUserData(userId: string): DemoUserData {
    return this.initializeUser(userId);
  }

  // 设置用户数据（供其他服务使用）
  setUserData(userId: string, userData: DemoUserData): void {
    const data = this.getStorageData() || {};
    data[userId] = userData;
    this.setStorageData(data);
  }
  
  createTransaction(
    userId: string,
    transactionType: 'EARN' | 'SPEND',
    amount: number,
    reason: string,
    referenceId?: string,
    description?: string
  ): { success: boolean; newBalance: number; transactionId: string; transaction: DemoTransaction } {
    const data = this.getStorageData() || {};
    const userData = this.initializeUser(userId);
    
    const currentBalance = userData.credits.balance;
    
    // 处理负数金额（负数表示增加积分）
    let actualAmount = amount;
    let actualTransactionType = transactionType;

    if (amount < 0) {
      actualAmount = Math.abs(amount);
      actualTransactionType = 'EARN';
    }

    // 检查余额是否充足（消费时）
    if (actualTransactionType === 'SPEND' && currentBalance < actualAmount) {
      throw new Error('Insufficient balance');
    }

    // 计算新余额
    const newBalance = actualTransactionType === 'EARN'
      ? currentBalance + actualAmount
      : currentBalance - actualAmount;
    
    // 创建交易记录
    const transaction: DemoTransaction = {
      id: `demo-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      transaction_type: actualTransactionType,
      amount: actualAmount,
      balance_after: newBalance,
      reason,
      reference_id: referenceId,
      description,
      created_at: new Date().toISOString(),
    };
    
    // 更新用户积分状态
    userData.credits.balance = newBalance;
    userData.credits.total_earned = actualTransactionType === 'EARN'
      ? userData.credits.total_earned + actualAmount
      : userData.credits.total_earned;
    userData.credits.total_spent = actualTransactionType === 'SPEND'
      ? userData.credits.total_spent + actualAmount
      : userData.credits.total_spent;
    userData.credits.updated_at = new Date().toISOString();
    
    // 添加交易记录
    userData.transactions.push(transaction);
    
    // 保存数据
    data[userId] = userData;
    this.setStorageData(data);
    
    return {
      success: true,
      newBalance,
      transactionId: transaction.id,
      transaction,
    };
  }
  
  getTransactionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    type?: 'EARN' | 'SPEND',
    reason?: string
  ) {
    const userData = this.initializeUser(userId);
    let transactions = [...userData.transactions];
    
    // 过滤
    if (type) {
      transactions = transactions.filter(t => t.transaction_type === type);
    }
    if (reason) {
      transactions = transactions.filter(t => t.reason === reason);
    }
    
    // 排序（最新的在前）
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // 添加显示格式
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      reasonDescription: this.getReasonDescription(transaction.reason),
      displayAmount: transaction.transaction_type === 'EARN' 
        ? `+${transaction.amount}` 
        : `-${transaction.amount}`,
    }));
    
    // 分页
    const paginatedTransactions = formattedTransactions.slice(offset, offset + limit);
    
    return {
      transactions: paginatedTransactions,
      pagination: {
        limit,
        offset,
        total: formattedTransactions.length,
        hasMore: (offset + limit) < formattedTransactions.length,
      },
      filters: {
        type: type || null,
        reason: reason || null,
      },
    };
  }
  
  dailySignin(userId: string): { success: boolean; reward?: number; message: string; newBalance?: number; transactionId?: string } {
    const today = new Date().toISOString().split('T')[0];
    const userData = this.initializeUser(userId);
    
    // 检查今天是否已经签到
    const hasSignedToday = userData.signinRecords.some((record: DemoSigninRecord) => record.date === today);
    
    if (hasSignedToday) {
      return {
        success: false,
        message: '今天已经签到过了',
      };
    }
    
    // 执行签到
    const reward = 15;
    const result = this.createTransaction(userId, 'EARN', reward, 'DAILY_SIGNIN', null, '每日签到奖励');
    
    // 记录签到
    userData.signinRecords.push({
      date: today,
      reward,
      transaction_id: result.transactionId,
    });
    
    // 保存数据
    const data = this.getStorageData() || {};
    data[userId] = userData;
    this.setStorageData(data);
    
    return {
      success: true,
      reward,
      message: `签到成功！获得${reward}积分`,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    };
  }
  
  private getReasonDescription(reason: string): string {
    const reasonMap: Record<string, string> = {
      'REGISTRATION_BONUS': '新用户注册奖励',
      'DAILY_SIGNIN': '每日签到奖励',
      'VIDEO_GENERATION': '视频生成消费',
      'MANUAL_ADJUSTMENT': '手动调整',
      'INVITATION_REWARD': '邀请新用户奖励',
      'INVITATION_BONUS': '邀请码注册奖励',
      'INVITATION_VIDEO_REWARD': '被邀请用户首次视频奖励',
      'SOCIAL_REWARD': '社交奖励',
    };
    return reasonMap[reason] || reason;
  }
  
  // 清除演示数据（用于测试）
  clearDemoData() {
    localStorage.removeItem(this.storageKey);
  }
}

export const demoCreditsService = new DemoCreditsService();
