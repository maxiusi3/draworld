import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';
import {
  SparklesIcon,
  PlayIcon,
  ShareIcon,
  CloudArrowUpIcon,
  PaintBrushIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: CloudArrowUpIcon,
      title: '简单上传',
      description: '支持相册选择和实时拍照，兼容JPG、PNG、HEIC格式'
    },
    {
      icon: PaintBrushIcon,
      title: '智能编辑',
      description: '内置编辑器支持裁切、旋转，轻松调整作品展示效果'
    },
    {
      icon: SparklesIcon,
      title: 'AI魔法生成',
      description: '即梦AI技术驱动，5秒高清动画，多种音乐情绪选择'
    },
    {
      icon: PlayIcon,
      title: '即时播放',
      description: '生成完成后立即观看，支持全屏播放和视频控制'
    },
    {
      icon: ShareIcon,
      title: '便捷分享',
      description: '一键下载MP4文件，轻松分享到社交媒体和亲朋好友'
    },
    {
      icon: HeartIcon,
      title: '珍藏回忆',
      description: '永久保存孩子的创意作品，记录每个美好童年时光'
    }
  ];

  const steps = [
    {
      step: '1',
      title: '上传画作',
      description: '选择孩子的绘画作品，支持多种格式'
    },
    {
      step: '2',
      title: '编辑调整',
      description: '简单裁切和旋转，让作品展示更完美'
    },
    {
      step: '3',
      title: '设置参数',
      description: '添加文字描述，选择音乐风格'
    },
    {
      step: '4',
      title: '生成视频',
      description: 'AI智能生成，等待约1-2分钟'
    },
    {
      step: '5',
      title: '下载分享',
      description: '获得成品视频，分享给家人朋友'
    }
  ];

  return (
    <div className="bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  童画奇旅
                </span>
                <br />
                <span className="text-gray-800">
                  让画作活起来
                </span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                将孩子的绘画转化为生动的动画视频，<br />
                记录珍贵的童年创意时光。
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {currentUser ? (
                  <>
                    <Link
                      to="/create"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      <span>开始创作</span>
                    </Link>
                    <Link
                      to="/dashboard"
                      className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all duration-200"
                    >
                      我的作品
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      <span>免费开始</span>
                    </Link>
                    <Link
                      to="/login"
                      className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all duration-200"
                    >
                      登录账户
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/images/hero-child-drawing.jpg"
                  alt="孩子绘画场景"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-full h-full bg-gradient-to-r from-pink-400 to-yellow-400 rounded-2xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              为什么选择童画奇旅？
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我们为家庭提供专业、简单、高质量的AI动画生成服务
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl w-fit mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              使用流程
            </h2>
            <p className="text-xl text-gray-600">
              仅需几分钟，轻松将画作变成动画
            </p>
          </div>
          
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white p-6 rounded-2xl shadow-lg text-center relative z-10">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            准备好将孩子的画作变成神奇动画了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            加入我们，开始一段充满创意的旅程。让每一幅作品都成为珍贵的家庭记忆。
          </p>
          {!currentUser && (
            <Link
              to="/register"
              className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>立即免费开始</span>
            </Link>
          )}
        </div>
      </section>

      {/* Footer with deployment info */}
      <footer className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>🚀 通过GitHub Actions自动部署 | 最后更新: {new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;