import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAdapter } from '../lib/adapters/authAdapter';
import { useAuth } from '../hooks/useAuth';
import { oidcConfig } from '../lib/adapters/config';
import toast from 'react-hot-toast';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // 检查是否有错误参数
        if (error) {
          console.error('OAuth错误:', error, errorDescription);
          setError(`认证失败: ${errorDescription || error}`);
          toast.error(`登录失败: ${errorDescription || error}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          console.error('回调URL中未找到授权码');
          setError('未找到授权码');
          toast.error('登录失败：未找到授权码');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('开始处理授权码:', code);
        const callbackUrl = oidcConfig.getCallbackUrl();
        console.log('使用回调URL:', callbackUrl);

        // 交换授权码获取token
        await authAdapter.exchangeCode({
          code,
          redirectUri: callbackUrl
        });

        const sess = authAdapter.getSession();
        if (sess) {
          setSession(sess);
          toast.success('登录成功！');
          navigate('/dashboard');
        } else {
          throw new Error('获取会话信息失败');
        }
      } catch (error) {
        console.error('处理登录回调失败:', error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setError(`登录失败: ${errorMessage}`);
        toast.error(`登录失败: ${errorMessage}`);
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [location, navigate, setSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在处理登录回调，请稍候...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">登录失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">3秒后自动跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default CallbackPage;