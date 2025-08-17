import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { creditsService } from '../services/creditsService';
import { toast } from 'react-hot-toast';

interface Transaction {
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

interface CreditHistoryResponse {
  transactions: Transaction[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

const CreditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  useEffect(() => {
    loadCreditHistory();
    loadCurrentBalance();
  }, []);

  const loadCurrentBalance = async () => {
    try {
      const balance = await creditsService.getCreditBalance();
      setCurrentBalance(balance.balance);
    } catch (error) {
      console.error('获取积分余额失败:', error);
    }
  };

  const loadCreditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: CreditHistoryResponse = await creditsService.getHistory({
        limit: 50,
        offset: 0,
      });
      
      setTransactions(response.transactions || []);
    } catch (error: any) {
      console.error('获取积分历史失败:', error);
      setError(error.message || '获取积分历史失败');
      toast.error('获取积分历史失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonDescription = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'REGISTRATION_BONUS': '新用户注册奖励',
      'DAILY_SIGNIN': '每日签到奖励',
      'VIDEO_GENERATION': '视频生成消费',
      'MANUAL_ADJUSTMENT': '手动调整',
      'INVITATION_REWARD': '邀请奖励',
      'SOCIAL_REWARD': '社交奖励',
    };
    return reasonMap[reason] || reason;
  };

  const getTransactionIcon = (type: 'EARN' | 'SPEND') => {
    return type === 'EARN' ? (
      <TrendingUp className="w-5 h-5 text-green-500" />
    ) : (
      <TrendingDown className="w-5 h-5 text-red-500" />
    );
  };

  const getAmountColor = (type: 'EARN' | 'SPEND') => {
    return type === 'EARN' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载积分历史...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回首页</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">积分历史</h1>
            </div>
            
            {/* 当前余额显示 */}
            {currentBalance !== null && (
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <div className="text-sm text-blue-600">当前余额</div>
                <div className="text-lg font-semibold text-blue-900">
                  {currentBalance.toLocaleString()} 积分
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadCreditHistory}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无积分记录</h3>
            <p className="text-gray-500">您还没有任何积分交易记录</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                积分交易记录 ({transactions.length} 条)
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.reasonDescription || getReasonDescription(transaction.reason)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getAmountColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'EARN' ? '+' : '-'}{transaction.amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        余额: {transaction.balance_after.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditHistoryPage;
