import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/solid';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              童画奇旅
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              将孩子的绘画转化为生动的动画视频，记录珍贵的童年创意时光。
              让每一幅作品都成为独特的艰术珍藏。
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>由</span>
              <HeartIcon className="h-4 w-4 text-red-500 mx-1" />
              <span>制作</span>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  首页
                </Link>
              </li>
              <li>
                <Link
                  to="/create"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  开始创作
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  我的作品
                </Link>
              </li>
            </ul>
          </div>

          {/* 法律信息 */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">法律信息</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  用户协议
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  隐私政策
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="border-t border-blue-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} 童画奇旅 (WhimsyBrush). 版权所有。
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;