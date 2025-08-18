import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAdapter } from '../lib/adapters/authAdapter';
import { useAuth } from '../hooks/useAuth';
import { oidcConfig } from '../lib/adapters/config';
import { invitationService } from '../services/invitationService';
import toast from 'react-hot-toast';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // 防止重复处理
    if (processed) return;
    setProcessed(true);

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

        console.log('[CALLBACK] 开始处理授权码:', code.substring(0, 10) + '...');
        const callbackUrl = oidcConfig.getCallbackUrl();
        console.log('[CALLBACK] 使用回调URL:', callbackUrl);

        // 验证回调URL是否正确
        const currentUrl = window.location.origin + window.location.pathname;
        console.log('[CALLBACK] 当前页面URL:', currentUrl);
        console.log('[CALLBACK] 回调URL匹配:', callbackUrl === currentUrl);

        if (callbackUrl !== currentUrl) {
          console.warn('[CALLBACK] 警告：回调URL不匹配，这可能导致token交换失败');
          console.warn('[CALLBACK] 期望:', callbackUrl);
          console.warn('[CALLBACK] 实际:', currentUrl);
        }

        // 立即清理URL，防止重复处理
        window.history.replaceState({}, document.title, window.location.pathname);

        // 交换授权码获取token
        console.log('[CALLBACK] 开始交换授权码...');
        try {
          await authAdapter.exchangeCode({
            code,
            redirectUri: callbackUrl
          });
          console.log('[CALLBACK] 授权码交换完成');
        } catch (exchangeError) {
          console.error('[CALLBACK] 授权码交换失败:', exchangeError);

          // 如果是redirect_uri不匹配的错误，提供更有用的错误信息
          if (exchangeError instanceof Error && exchangeError.message.includes('invalid_grant')) {
            throw new Error(`授权码交换失败：可能是回调URL不匹配。期望: ${callbackUrl}, 当前: ${currentUrl}`);
          }

          throw exchangeError;
        }

        console.log('[CALLBACK] 获取会话信息...');
        const sess = authAdapter.getSession();
        console.log('[CALLBACK] 会话信息:', sess);

        if (sess) {
          console.log('[CALLBACK] 设置用户会话...');
          setSession(sess);
          console.log('[CALLBACK] 会话设置完成，显示成功消息...');
          toast.success('登录成功！');

          // 处理邀请码（如果有）
          const pendingInviteCode = localStorage.getItem('pending_invite_code');
          if (pendingInviteCode) {
            console.log('[CALLBACK] 处理邀请码:', pendingInviteCode);
            try {
              await invitationService.registerWithInvitationCode(pendingInviteCode);
              localStorage.removeItem('pending_invite_code');
              console.log('[CALLBACK] 邀请码处理成功');
            } catch (error) {
              console.error('[CALLBACK] 邀请码处理失败:', error);
              // 不影响登录流程，只是记录错误
            }
          }

          console.log('[CALLBACK] 准备跳转到dashboard...');

          // 使用setTimeout确保状态更新完成后再跳转
          setTimeout(() => {
            console.log('[CALLBACK] 执行页面跳转...');
            navigate('/dashboard', { replace: true });
            console.log('[CALLBACK] 跳转命令已发送');
          }, 100);
        } else {
          console.error('[CALLBACK] 会话信息为空，登录失败');
          throw new Error('获取会话信息失败');
        }
      } catch (error) {
        console.error('处理登录回调失败:', error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';

        // 生产环境：不允许演示模式回退，直接显示错误
        console.error('[CALLBACK] 认证失败，生产环境不支持演示模式回退');

        setError(`登录失败: ${errorMessage}`);
        toast.error(`登录失败: ${errorMessage}`);

        // 添加更详细的错误信息
        if (errorMessage.includes('回调URL不匹配')) {
          toast.error('请确保Authing控制台中配置了正确的回调URL: http://localhost:3000/callback', {
            duration: 8000
          });
        }

        setTimeout(() => navigate('/login'), 5000); // 延长等待时间让用户看到错误信息
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [location, navigate, setSession, processed]);

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