import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { videoService, VideoTask } from '../services/videoService';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ArrowPathIcon,
  HomeIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ResultPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<VideoTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!taskId) {
      navigate('/dashboard');
      return;
    }

    // 监听任务状态变化
    const unsubscribe = videoService.subscribeToTask(taskId, (updatedTask) => {
      if (updatedTask) {
        setTask(updatedTask);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
      setLoading(false);

      // 如果任务完成，自动播放视频
      if (updatedTask?.status === 'completed' && updatedTask.videoUrl) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play();
            setVideoPlaying(true);
          }
        }, 1000);
      }
    });

    return unsubscribe;
  }, [taskId, navigate]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  const handleVideoPause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  const handleVideoToggle = () => {
    if (videoPlaying) {
      handleVideoPause();
    } else {
      handleVideoPlay();
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setVideoMuted(videoRef.current.muted);
    }
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
    }
  };

  const handleDownload = async () => {
    if (!task?.videoUrl) return;
    
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

  const handleShare = async () => {
    if (!task) return;
    
    try {
      const shareData = {
        title: '看看我的神奇动画作品！',
        text: `这是用童画奇旅创作的动画视频：${task.prompt}`,
        url: window.location.href
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制到剪贴板');
      }
    } catch (error) {
      console.error('分享失败:', error);
      toast.error('分享失败');
    }
  };

  const handleRegenerate = async () => {
    if (!task || !currentUser) return;
    
    setRegenerating(true);
    try {
      // 重新生成视频
      const newTaskId = await videoService.createVideoTask({
        imageUrl: task.imageUrl,
        prompt: task.prompt,
        musicStyle: task.musicStyle as any,
        aspectRatio: task.aspectRatio as any
      });
      
      navigate(`/result/${newTaskId}`);
      toast.success('已开始重新生成');
    } catch (error) {
      console.error('重新生成失败:', error);
      setRegenerating(false);
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

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {connectionError ? '连接中断' : '作品不存在'}
          </h2>
          <p className="text-gray-600 mb-6">
            {connectionError
              ? '网络连接出现问题，无法获取作品信息'
              : '您要查看的作品不存在或已被删除'
            }
          </p>
          <div className="space-x-4">
            {connectionError && (
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                重新连接
              </button>
            )}
            <Link
              to="/dashboard"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              返回作品列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 面包屑导航 */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors duration-200">
            <HomeIcon className="w-4 h-4" />
          </Link>
          <span>/</span>
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors duration-200">
            我的作品
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">视频结果</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 视频播放区 */}
          <div className="lg:col-span-2">
            <div 
              ref={containerRef}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* 视频内容 */}
              <div className="relative aspect-video bg-gray-900">
                {task.status === 'completed' && task.videoUrl ? (
                  <>
                    {!videoError ? (
                      <video
                        ref={videoRef}
                        src={task.videoUrl}
                        className="w-full h-full object-contain"
                        muted={videoMuted}
                        loop
                        playsInline
                        onPlay={() => setVideoPlaying(true)}
                        onPause={() => setVideoPlaying(false)}
                        onEnded={() => setVideoPlaying(false)}
                        onError={(e) => {
                          console.error('视频加载错误:', e);
                          setVideoError(true);
                        }}
                        onLoadStart={() => setVideoError(false)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                          <h3 className="text-xl font-semibold mb-2">视频暂时无法播放</h3>
                          <p className="text-gray-300 mb-4">视频可能还在处理中，或者网络连接有问题</p>
                          <button
                            onClick={() => {
                              setVideoError(false);
                              if (videoRef.current) {
                                videoRef.current.load();
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            重新加载
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 视频控制按钮 */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleVideoToggle}
                          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                        >
                          {videoPlaying ? (
                            <PauseIcon className="w-6 h-6" />
                          ) : (
                            <PlayIcon className="w-6 h-6" />
                          )}
                        </button>
                        
                        <button
                          onClick={handleMuteToggle}
                          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                        >
                          {videoMuted ? (
                            <SpeakerXMarkIcon className="w-6 h-6" />
                          ) : (
                            <SpeakerWaveIcon className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                      
                      <button
                        onClick={handleFullscreen}
                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                      >
                        <ArrowsPointingOutIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {task.status === 'processing' && (
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <h3 className="text-xl font-semibold mb-2">AI正在生成你的神奇动画...</h3>
                        <p className="text-gray-300">预计还需要 1-2 分钟，请耐心等待</p>
                        <div className="mt-6 space-y-2 text-sm text-gray-400">
                          <p>✨ 正在解析您的绘画作品...</p>
                          <p>✨ 正在生成动画帧...</p>
                          <p>✨ 正在添加美妙的音乐...</p>
                        </div>
                      </div>
                    )}
                    
                    {task.status === 'pending' && (
                      <div className="text-center text-white">
                        <ClockIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                        <h3 className="text-xl font-semibold mb-2">任务排队中...</h3>
                        <p className="text-gray-300">您的作品在队列中，即将开始处理</p>
                      </div>
                    )}
                    
                    {task.status === 'failed' && (
                      <div className="text-center text-white">
                        <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <h3 className="text-xl font-semibold mb-2">生成失败</h3>
                        <p className="text-gray-300 mb-4">
                          {task.error || '生成过程中出现错误，请尝试重新生成'}
                        </p>
                        <button
                          onClick={handleRegenerate}
                          disabled={regenerating}
                          className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {regenerating ? '重新生成中...' : '重新生成'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 操作按钮 */}
            {task.status === 'completed' && task.videoUrl && (
              <div className="mt-6 flex items-center justify-center space-x-4">
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>下载视频</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span>分享</span>
                </button>
                
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>{regenerating ? '生成中...' : '重新生成'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 作品信息区 */}
          <div className="space-y-6">
            {/* 作品详情 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">作品详情</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                  <p className="text-gray-800">{task.prompt || '无描述'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">音乐风格</label>
                    <p className="text-gray-800">{task.musicStyle}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">宽高比</label>
                    <p className="text-gray-800">{task.aspectRatio}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">创建时间</label>
                  <p className="text-gray-800">{formatDate(task.createdAt)}</p>
                </div>
                
                {task.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">完成时间</label>
                    <p className="text-gray-800">{formatDate(task.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 推荐操作 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">接下来做什么？</h3>
              
              <div className="space-y-3">
                <Link
                  to="/create"
                  className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-center"
                >
                  创作新作品
                </Link>
                
                <Link
                  to="/dashboard"
                  className="block w-full border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 text-center"
                >
                  查看所有作品
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;