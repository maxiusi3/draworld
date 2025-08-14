import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginByRedirect } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!agreeToTerms) {
      toast.error('请先同意用户协议和隐私政策');
      return;
    }

    setLoading(true);
    try {
      await loginByRedirect();
    } catch (error) {
      // 错误已在useAuth中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            加入童画奇旅
          </h2>
          <p className="mt-2 text-gray-600">
            创建您的账户，开始神奇之旅
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              使用手机号验证码快速注册
            </p>
          </div>

          <div className="flex items-start space-x-3 mb-6">
            <input
              id="agreeToTerms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-600">
              我已阅读并同意{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                用户协议
              </Link>
              {' '}和{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                隐私政策
              </Link>
            </label>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !agreeToTerms}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
          >
            {loading ? '前往注册中...' : '📱 手机号验证码注册'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>点击注册按钮将跳转到安全的认证页面</p>
            <p className="mt-1">支持手机号验证码注册</p>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600">
            已有账户？{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-semibold">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;