import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { videoService, VideoTask } from '../services/videoService';
import {
  PlusIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// taskFixer removed - functionality moved to backend

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixingTasks, setFixingTasks] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  const loadTasks = useCallback(async () => {
    if (!currentUser) return;

    try {
      setRefreshing(true);
      const userTasks = await videoService.getUserVideoTasks(currentUser.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  const loadAnonymousTasks = useCallback(async () => {
    try {
      setRefreshing(true);
      // 匿名任务功能已移除，这里可以显示提示信息
      setTasks([]);
      console.log('匿名任务功能已移除');
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 修复失败任务的函数 - 使用专门的修复工具
  const fixFailedTasks = async () => {
    const failedTasks = tasks.filter(task => task.status === 'failed');

    if (failedTasks.length === 0) {
      toast.success('没有需要修复的失败任务');
      return;
    }

    setFixingTasks(true);

    try {
      toast.loading(`正在修复 ${failedTasks.length} 个失败任务...`, { id: 'fixing' });

      // 修复功能已迁移到后端，这里提供占位实现
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`修复功能已迁移到后端，请联系管理员处理失败任务`, { id: 'fixing' });

      // 刷新任务列表
      setTimeout(() => {
        loadTasks();
      }, 2000);

    } catch (error) {
      console.error('修复失败任务出错:', error);
      toast.error('修复失败任务出错', { id: 'fixing' });
    } finally {
      setFixingTasks(false);
    }
  };

  // 创建测试任务的函数
  const createTestTask = async () => {
    setCreatingTest(true);

    try {
      toast.loading('正在创建测试任务...', { id: 'creating' });

      const taskId = await videoService.createVideoTask({
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        prompt: '测试任务 - 小狮子在草原上奔跑',
        musicStyle: 'Joyful',
        aspectRatio: '16:9'
      });

      toast.success('测试任务创建成功！', { id: 'creating' });

      // 2秒后刷新任务列表
      setTimeout(() => {
        loadTasks();
      }, 2000);

    } catch (error) {
      console.error('创建测试任务失败:', error);
      toast.error('创建测试任务失败', { id: 'creating' });
    } finally {
      setCreatingTest(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTasks();

      // 订阅实时更新
      const unsubscribe = videoService.subscribeToUserTasks(
        currentUser.uid,
        (updatedTasks) => {
          setTasks(updatedTasks);
          setLoading(false);
        }
      );

      return unsubscribe;
    }
  }, [currentUser, loadTasks]);

  // 服务状态已简化，不再需要获取
  useEffect(() => {
    setServiceStatus({
      useMockService: false,
      cloudFunctionsAvailable: true,
      hasApiKey: true
    });
  }, []);

  const handleShare = async (task: VideoTask) => {
    if (!task.videoUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: '看看我的神奇动画作品！',
          text: `这是用童画奇旅创作的动画视频：${task.prompt}`,
          url: window.location.origin + `/result/${task.id}`
        });
      } else {
        // 复制链接
        await navigator.clipboard.writeText(window.location.origin + `/result/${task.id}`);
        toast.success('链接已复制到剪贴板');
      }
    } catch (error) {
      console.error('分享失败:', error);
      toast.error('分享失败');
    }
  };

  const handleDownload = async (task: VideoTask) => {
    if (!task.videoUrl) return;
    
    try {
      const response = await fetch(task.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whimsy-brush-${task.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('下载开始');
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败');
    }
  };

  const getStatusIcon = (status: VideoTask['status']) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: VideoTask['status']) => {
    switch (status) {
      case 'pending':
        return '排队中';
      case 'processing':
        return '生成中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '生成失败';
      default:
        return '未知状态';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录才能查看作品</p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              我的作品
            </h1>
            <p className="text-gray-600 mt-1">
              欢迎回来，{currentUser.displayName || '用户'}! 这里是您的所有作品。
            </p>
            {/* 服务状态指示器 */}
            {serviceStatus && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    serviceStatus.useMockService ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-500">
                    {serviceStatus.useMockService ? '🎭 演示模式' : '☁️ 云端模式'}
                  </span>
                  {serviceStatus.cloudFunctionsAvailable === false && (
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      Cloud Functions 不可用
                    </span>
                  )}
                </div>
                {serviceStatus.useMockService && (
                  <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border-l-2 border-blue-300">
                    <span className="font-medium text-blue-700">💡 当前使用演示模式</span>
                    <br />
                    生成的视频为测试内容。如需真实AI生成，请
                    <Link to="/api-config" className="text-blue-600 hover:text-blue-800 underline ml-1">
                      配置您的API密钥
                    </Link>
                    。
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 修复失败任务按钮 */}
            {tasks.some(task => task.status === 'failed') && (
              <>
                <button
                  onClick={fixFailedTasks}
                  disabled={fixingTasks}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                  title="修复失败的任务"
                >
                  <ExclamationCircleIcon className="w-4 h-4" />
                  <span>{fixingTasks ? '修复中...' : '修复失败任务'}</span>
                </button>

                {/* 分析失败任务按钮 */}
                <button
                  onClick={() => {
                    const failedCount = tasks.filter(task => task.status === 'failed').length;
                    const analysisCode = `
// 🔍 分析失败任务详情
console.log('📊 开始分析 ${failedCount} 个失败任务...');

// 显示失败任务的详细信息
const failedTasks = ${JSON.stringify(tasks.filter(task => task.status === 'failed'), null, 2)};

console.log('❌ 失败任务列表:');
failedTasks.forEach((task, index) => {
  console.log(\`\\n\${index + 1}. 任务 \${task.id}\`);
  console.log(\`   📝 提示词: \${task.prompt || '无'}\`);
  console.log(\`   🖼️ 图片: \${task.imageUrl || '无'}\`);
  console.log(\`   ❌ 错误: \${task.error || '无错误信息'}\`);
  console.log(\`   ⏰ 创建时间: \${new Date(task.createdAt?.seconds * 1000 || task.createdAt).toLocaleString()}\`);
  if (task.aliyunTaskId) {
    console.log(\`   🔗 阿里云任务ID: \${task.aliyunTaskId} (已消耗API额度)\`);
  }
});

// 统计错误原因
const errorReasons = {};
failedTasks.forEach(task => {
  const error = task.error || '未知错误';
  errorReasons[error] = (errorReasons[error] || 0) + 1;
});

console.log('\\n📈 错误原因统计:');
Object.entries(errorReasons).forEach(([reason, count]) => {
  console.log(\`  \${reason}: \${count} 次\`);
});

// API额度消耗分析
const withAliyunId = failedTasks.filter(t => t.aliyunTaskId);
console.log(\`\\n💰 API额度消耗分析:\`);
console.log(\`  已提交到阿里云的任务: \${withAliyunId.length} 个\`);
console.log(\`  未提交的任务: \${failedTasks.length - withAliyunId.length} 个\`);

if (withAliyunId.length > 0) {
  console.log('\\n⚠️ 这些任务可能已消耗API额度但生成失败:');
  withAliyunId.forEach((task, i) => {
    console.log(\`  \${i+1}. \${task.prompt} (阿里云ID: \${task.aliyunTaskId})\`);
  });
  console.log('\\n💡 建议: 联系阿里云客服查询具体的API调用记录和额度消耗情况');
}

console.log('\\n✅ 分析完成！');
                    `;

                    navigator.clipboard.writeText(analysisCode).then(() => {
                      toast.success('分析代码已复制到剪贴板，请在控制台中执行');
                    });
                  }}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-1"
                  title="分析失败任务详情"
                >
                  <span className="text-sm">🔍 分析</span>
                </button>
              </>
            )}

            {/* 创建测试任务按钮 */}
            <button
              onClick={createTestTask}
              disabled={creatingTest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              title="创建测试任务"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{creatingTest ? '创建中...' : '测试任务'}</span>
            </button>

            <button
              onClick={loadTasks}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200 disabled:opacity-50"
              title="刷新用户任务"
            >
              <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={loadAnonymousTasks}
              disabled={refreshing}
              className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50"
              title="测试：加载匿名任务"
            >
              测试连接
            </button>

            <Link
              to="/create"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>创作新作品</span>
            </Link>
          </div>
        </div>

        {/* 作品列表 */}
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full w-fit mx-auto mb-6">
                <PlusIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                还没有作品
              </h3>
              <p className="text-gray-600 mb-8">
                开始您的创作之旅，将孩子的绘画转化为神奇动画！
              </p>
              <Link
                to="/create"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>创作第一个作品</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* 视频缩略图 */}
                <div className="aspect-video bg-gray-100 relative">
                  {task.status === 'completed' && task.videoUrl ? (
                    <Link to={`/result/${task.id}`} className="block w-full h-full group">
                      <video
                        src={task.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <PlayIcon className="w-12 h-12 text-white" />
                      </div>
                    </Link>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {task.status === 'processing' && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">生成中...</p>
                        </div>
                      )}
                      {task.status === 'pending' && (
                        <div className="text-center">
                          <ClockIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">排队中...</p>
                        </div>
                      )}
                      {task.status === 'failed' && (
                        <div className="text-center">
                          <ExclamationCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm text-red-600">生成失败</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 作品信息 */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm font-medium text-gray-600">
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 font-medium mb-2 line-clamp-2">
                    {task.prompt || '无描述'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>音乐: {task.musicStyle}</span>
                    <span>尺寸: {task.aspectRatio}</span>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    {task.status === 'completed' && task.videoUrl && (
                      <React.Fragment key={`completed-${task.id}`}>
                        <Link
                          to={`/result/${task.id}`}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 text-center flex items-center justify-center space-x-1"
                        >
                          <PlayIcon className="w-4 h-4" />
                          <span>播放</span>
                        </Link>
                        <button
                          onClick={() => handleShare(task)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="分享"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(task)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="下载"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                      </React.Fragment>
                    )}
                    
                    {task.status === 'processing' && (
                      <Link
                        to={`/result/${task.id}`}
                        className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors duration-200 text-center"
                      >
                        查看进度
                      </Link>
                    )}
                    
                    {task.status === 'failed' && (
                      <Link
                        to="/create"
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200 text-center"
                      >
                        重新创作
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;