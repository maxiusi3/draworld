import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { moderationService, ModerationItem, ModerationFilters } from '../services/moderationService';

const AdminModerationPage: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // 加载审核数据
  useEffect(() => {
    loadModerationItems();
  }, [filter, searchQuery]);

  const loadModerationItems = async () => {
    setLoading(true);
    try {
      const filters: ModerationFilters = {
        status: filter === 'all' ? undefined : filter,
        search: searchQuery || undefined,
        limit: 50,
        offset: 0,
      };

      const result = await moderationService.getModerationItems(filters);

      if (result.success) {
        setItems(result.items);
      } else {
        toast.error('加载失败，请稍后重试');
      }
    } catch (error) {
      console.error('加载审核项目失败:', error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (itemId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessing(itemId);
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        toast.error('找不到该内容');
        return;
      }

      let result;
      if (action === 'approve') {
        result = await moderationService.approveContent(itemId, item.type);
      } else {
        result = await moderationService.rejectContent(itemId, item.type, reason);
      }

      if (result.success) {
        // 更新本地状态
        setItems(prev => prev.map(i =>
          i.id === itemId
            ? { ...i, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : i
        ));

        toast.success(action === 'approve' ? '内容已通过审核' : '内容已被拒绝');
        setSelectedItem(null);
      } else {
        toast.error(result.message || '操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('审核操作失败:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '待审核';
      case 'APPROVED': return '已通过';
      case 'REJECTED': return '已拒绝';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">内容审核管理</h1>
            <p className="mt-2 text-gray-600">管理用户提交的内容和举报</p>
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 状态筛选 */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标题、内容或作者..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 内容列表 */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>没有找到相关内容</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* 缩略图 */}
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}

                    {/* 内容信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.type === 'artwork' ? '作品' : '评论'}
                        </span>
                        {item.reportCount && item.reportCount > 0 && (
                          <span className="flex items-center text-xs text-red-600">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            {item.reportCount} 次举报
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 mb-2 line-clamp-2">{item.content}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>作者: {item.author}</span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>

                      {item.reportReasons && item.reportReasons.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-red-600">举报原因: </span>
                          <span className="text-sm text-gray-600">
                            {item.reportReasons.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="查看详情"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>

                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleModeration(item.id, 'approve')}
                            disabled={processing === item.id}
                            className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50"
                            title="通过审核"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleModeration(item.id, 'reject')}
                            disabled={processing === item.id}
                            className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            title="拒绝审核"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 详情模态框 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">内容详情</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <p className="text-gray-900">{selectedItem.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedItem.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                    <p className="text-gray-900">{selectedItem.author}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <p className="text-gray-900">{selectedItem.type === 'artwork' ? '作品' : '评论'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                  <p className="text-gray-900">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                </div>

                {selectedItem.reportReasons && selectedItem.reportReasons.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">举报原因</label>
                    <div className="space-y-1">
                      {selectedItem.reportReasons.map((reason, index) => (
                        <span key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.thumbnailUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">预览</label>
                    <img
                      src={selectedItem.thumbnailUrl}
                      alt={selectedItem.title}
                      className="w-full max-w-md rounded-lg"
                    />
                  </div>
                )}
              </div>

              {selectedItem.status === 'PENDING' && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => handleModeration(selectedItem.id, 'reject')}
                    disabled={processing === selectedItem.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => handleModeration(selectedItem.id, 'approve')}
                    disabled={processing === selectedItem.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    通过
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModerationPage;
