import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BugAntIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface SecurityStats {
  failedCallbacks: {
    total: number;
    pending: number;
    abandoned: number;
  };
  security: {
    ipWhitelistChecks: { total: number; blocked: number; allowed: number };
    rateLimitChecks: { total: number; blocked: number; allowed: number };
    signatureVerifications: { total: number; failed: number; passed: number };
  };
  notifications: {
    total: number;
    processed: number;
    failed: number;
    retried: number;
    abandoned: number;
  };
  performance: {
    avgProcessingTime: number;
    maxProcessingTime: number;
    minProcessingTime: number;
  };
  alerts: Array<{
    id: string;
    type: 'WARNING' | 'ERROR' | 'INFO';
    message: string;
    count: number;
    lastOccurred: string;
  }>;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  details: any;
}

const AdminPaymentMonitorPage: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState('all');

  useEffect(() => {
    loadStats();
    loadLogs();
    
    // 定时刷新
    const interval = setInterval(() => {
      loadStats();
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedLogType]);

  const loadStats = async () => {
    try {
      // 从sessionStorage获取认证会话
      const authSession = localStorage.getItem('auth_session');
      let token = null;

      if (authSession) {
        try {
          const session = JSON.parse(authSession);
          token = session.tokens?.access_token;
        } catch (error) {
          console.error('解析认证会话失败:', error);
        }
      }

      if (!token) {
        throw new Error('用户未登录，请先登录');
      }

      const response = await fetch('/api/admin/payment-monitor?action=stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setStats(result.stats);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      toast.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      // 从sessionStorage获取认证会话
      const authSession = localStorage.getItem('auth_session');
      let token = null;

      if (authSession) {
        try {
          const session = JSON.parse(authSession);
          token = session.tokens?.access_token;
        } catch (error) {
          console.error('解析认证会话失败:', error);
        }
      }

      if (!token) {
        throw new Error('用户未登录，请先登录');
      }

      const response = await fetch(`/api/admin/payment-monitor?action=logs&type=${selectedLogType}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setLogs(result.logs);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('加载安全日志失败:', error);
      toast.error('加载安全日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetryFailedCallbacks = async () => {
    try {
      setRetryLoading(true);
      const token = localStorage.getItem('auth_token') || 'demo-token';
      const response = await fetch('/api/admin/payment-monitor?action=retry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('重试任务已执行');
        loadStats(); // 刷新统计
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('重试失败:', error);
      toast.error('重试失败');
    } finally {
      setRetryLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setCleanupLoading(true);
      const token = localStorage.getItem('auth_token') || 'demo-token';
      const response = await fetch('/api/admin/payment-monitor?action=cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('数据清理完成');
        loadStats(); // 刷新统计
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('数据清理失败:', error);
      toast.error('数据清理失败');
    } finally {
      setCleanupLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'ERROR': return 'border-red-200 bg-red-50';
      case 'WARNING': return 'border-yellow-200 bg-yellow-50';
      case 'INFO': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载监控数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">支付安全监控</h1>
                <p className="mt-2 text-gray-600">监控支付回调安全和系统状态</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRetryFailedCallbacks}
                  disabled={retryLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${retryLoading ? 'animate-spin' : ''}`} />
                  <span>{retryLoading ? '重试中...' : '重试失败回调'}</span>
                </button>
                <button
                  onClick={handleCleanup}
                  disabled={cleanupLoading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>{cleanupLoading ? '清理中...' : '清理数据'}</span>
                </button>
                <button
                  onClick={loadStats}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>刷新</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 失败回调 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BugAntIcon className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">失败回调</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.failedCallbacks.total}</p>
                  <p className="text-xs text-gray-500">待重试: {stats.failedCallbacks.pending}</p>
                </div>
              </div>
            </div>

            {/* 安全检查 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">安全检查</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.security.ipWhitelistChecks.blocked + stats.security.rateLimitChecks.blocked}
                  </p>
                  <p className="text-xs text-gray-500">已阻止威胁</p>
                </div>
              </div>
            </div>

            {/* 通知处理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">通知处理</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.notifications.processed}</p>
                  <p className="text-xs text-gray-500">成功率: {((stats.notifications.processed / stats.notifications.total) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* 平均处理时间 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均处理时间</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.performance.avgProcessingTime}ms</p>
                  <p className="text-xs text-gray-500">最大: {stats.performance.maxProcessingTime}ms</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 告警信息 */}
        {stats && stats.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">系统告警</h2>
            <div className="space-y-3">
              {stats.alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm opacity-75">发生次数: {alert.count}</p>
                      </div>
                    </div>
                    <div className="text-sm opacity-75">
                      {new Date(alert.lastOccurred).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 安全日志 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">安全日志</h2>
              <select
                value={selectedLogType}
                onChange={(e) => setSelectedLogType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">全部类型</option>
                <option value="IP_BLOCKED">IP阻止</option>
                <option value="RATE_LIMIT">频率限制</option>
                <option value="SIGNATURE_FAILED">签名失败</option>
                <option value="CALLBACK_RETRY">回调重试</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {logsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">加载日志中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>暂无安全日志</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                        <span className="text-sm text-gray-500">{log.type}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{log.message}</p>
                      {log.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer">详细信息</summary>
                          <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentMonitorPage;
