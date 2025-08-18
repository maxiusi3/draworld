import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuthContext';
import { PaintBrushIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CreditBalance } from '../CreditBalance';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('登出错误:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl group-hover:scale-105 transition-transform duration-200">
              <PaintBrushIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              童画奇旅
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {currentUser ? (
              <>
                <Link
                  to="/community"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  创意广场
                </Link>
                <Link
                  to="/credits"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  积分商店
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  个人中心
                </Link>
                <Link
                  to="/"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  创作新视频
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  注册
                </Link>
              </>
            )}
          </nav>

          {/* Credits and User Menu */}
          {currentUser && (
            <div className="flex items-center space-x-4">
              {/* Credit Balance */}
              <CreditBalance
                showSigninButton={true}
                className="mr-2"
              />

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="用户头像"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-600" />
                  )}
                  <span className="hidden md:block text-gray-700 font-medium">
                    {currentUser.displayName || '用户'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                  >
                    账户设置
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;