// 语言: TypeScript
// 说明: 认证测试页面，用于验证用户信息解析是否正确

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthContext';
import { parseJWTPayload } from '../utils/jwtUtils';
import { creditsService } from '../services/creditsService';

export default function AuthTestPage() {
  const { currentUser, session } = useAuth();
  const [jwtPayload, setJwtPayload] = useState<any>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.tokens?.id_token) {
      const payload = parseJWTPayload(session.tokens.id_token);
      setJwtPayload(payload);
    }
  }, [session]);

  const testCreditBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const balance = await creditsService.getCreditBalance();
      setCreditBalance(balance.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取积分余额失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">认证测试页面</h1>
      
      {/* 用户信息显示 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">当前用户信息</h2>
        {currentUser ? (
          <div className="space-y-2">
            <p><strong>用户ID:</strong> {currentUser.uid}</p>
            <p><strong>显示名称:</strong> {currentUser.displayName}</p>
            <p><strong>邮箱:</strong> {currentUser.email}</p>
            <p><strong>手机号:</strong> {currentUser.phone || '未设置'}</p>
            <p><strong>头像:</strong> {currentUser.photoURL || '未设置'}</p>
            <p><strong>创建时间:</strong> {currentUser.metadata?.creationTime}</p>
            <p><strong>最后登录:</strong> {currentUser.metadata?.lastSignInTime}</p>
          </div>
        ) : (
          <p className="text-gray-500">用户未登录</p>
        )}
      </div>

      {/* JWT Token 信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">JWT Token 信息</h2>
        {jwtPayload ? (
          <div className="space-y-2">
            <p><strong>Subject (sub):</strong> {jwtPayload.sub}</p>
            <p><strong>Issuer (iss):</strong> {jwtPayload.iss}</p>
            <p><strong>Audience (aud):</strong> {jwtPayload.aud}</p>
            <p><strong>邮箱:</strong> {jwtPayload.email || '未设置'}</p>
            <p><strong>手机号:</strong> {jwtPayload.phone_number || '未设置'}</p>
            <p><strong>姓名:</strong> {jwtPayload.name || '未设置'}</p>
            <p><strong>昵称:</strong> {jwtPayload.nickname || '未设置'}</p>
            <p><strong>签发时间:</strong> {new Date(jwtPayload.iat * 1000).toLocaleString()}</p>
            <p><strong>过期时间:</strong> {new Date(jwtPayload.exp * 1000).toLocaleString()}</p>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">完整 Payload</summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(jwtPayload, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p className="text-gray-500">无JWT Token信息</p>
        )}
      </div>

      {/* 积分测试 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">积分系统测试</h2>
        <div className="space-y-4">
          <button
            onClick={testCreditBalance}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {loading ? '获取中...' : '获取积分余额'}
          </button>
          
          {creditBalance !== null && (
            <p className="text-green-600">
              <strong>当前积分余额:</strong> {creditBalance}
            </p>
          )}
          
          {error && (
            <p className="text-red-600">
              <strong>错误:</strong> {error}
            </p>
          )}
        </div>
      </div>

      {/* Session 信息 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Session 信息</h2>
        {session ? (
          <div className="space-y-2">
            <p><strong>Token 类型:</strong> {session.tokens?.token_type}</p>
            <p><strong>过期时间:</strong> {session.expiresAt ? new Date(session.expiresAt).toLocaleString() : '未设置'}</p>
            <p><strong>有 ID Token:</strong> {session.tokens?.id_token ? '是' : '否'}</p>
            <p><strong>有 Access Token:</strong> {session.tokens?.access_token ? '是' : '否'}</p>
            <p><strong>有 Refresh Token:</strong> {session.tokens?.refresh_token ? '是' : '否'}</p>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">完整 Session</summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify({
                  ...session,
                  tokens: {
                    ...session.tokens,
                    id_token: session.tokens?.id_token ? '[HIDDEN]' : undefined,
                    access_token: session.tokens?.access_token ? '[HIDDEN]' : undefined,
                    refresh_token: session.tokens?.refresh_token ? '[HIDDEN]' : undefined,
                  }
                }, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <p className="text-gray-500">无Session信息</p>
        )}
      </div>
    </div>
  );
}
