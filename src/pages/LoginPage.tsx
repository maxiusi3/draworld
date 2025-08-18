import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const { loginByRedirect } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginByRedirect();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            欢迎回来
          </h2>
          <p className="mt-2 text-gray-600">
            登录您的童画奇旅账户
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              使用手机号验证码快速登录
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
          >
            {loading ? '前往登录中...' : '🔐 手机号验证码登录'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>点击登录按钮将跳转到安全的认证页面</p>
            <p className="mt-1">支持手机号验证码登录</p>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600">
            还没有账户？{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-semibold">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;