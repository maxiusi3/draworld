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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (session?.tokens?.id_token) {
      const payload = parseJWTPayload(session.tokens.id_token);
      setJwtPayload(payload);
    }
  }, [session]);

  const runComprehensiveAuthTest = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    const debug: any = {
      timestamp: new Date().toISOString(),
      steps: []
    };

    try {
      // Step 1: Check localStorage
      debug.steps.push('1. 检查localStorage存储');
      const authSession = localStorage.getItem('auth_session');
      debug.localStorage = {
        exists: !!authSession,
        raw: authSession ? authSession.substring(0, 100) + '...' : null
      };

      if (authSession) {
        try {
          const session = JSON.parse(authSession);
          debug.session = {
            hasTokens: !!session.tokens,
            hasIdToken: !!session.tokens?.id_token,
            hasAccessToken: !!session.tokens?.access_token,
            hasRefreshToken: !!session.tokens?.refresh_token,
            tokenType: session.tokens?.token_type,
            expiresAt: session.expiresAt,
            idTokenPreview: session.tokens?.id_token?.substring(0, 30) + '...',
            accessTokenPreview: session.tokens?.access_token?.substring(0, 30) + '...'
          };

          // Step 2: Parse JWT token
          if (session.tokens?.id_token) {
            debug.steps.push('2. 解析JWT token');
            try {
              const parts = session.tokens.id_token.split('.');
              if (parts.length === 3) {
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));

                debug.jwt = {
                  header,
                  payload: {
                    iss: payload.iss,
                    aud: payload.aud,
                    sub: payload.sub,
                    exp: payload.exp,
                    iat: payload.iat,
                    phone_number: payload.phone_number,
                    email: payload.email,
                    name: payload.name
                  },
                  isExpired: Date.now() > payload.exp * 1000,
                  expiresAt: new Date(payload.exp * 1000).toISOString()
                };
              }
            } catch (jwtError) {
              debug.jwt = { error: jwtError.message };
            }
          }

          // Step 3: Test API call with detailed logging
          debug.steps.push('3. 测试积分API调用');

          // Manual API call to trace the exact request
          const token = session.tokens?.id_token || session.tokens?.access_token;
          const apiUrl = '/api/credits?action=balance';

          debug.apiRequest = {
            url: apiUrl,
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 30) + '...' : null,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? 'Bearer [HIDDEN]' : 'missing'
            }
          };

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          debug.apiResponse = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          };

          if (response.ok) {
            const data = await response.json();
            debug.apiResponse.data = data;
            setCreditBalance(data.balance);
            debug.steps.push('4. ✅ API调用成功');
          } else {
            const errorText = await response.text();
            debug.apiResponse.error = errorText;
            debug.steps.push('4. ❌ API调用失败');
            throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
          }

        } catch (parseError) {
          debug.sessionParseError = parseError.message;
          throw new Error(`解析session失败: ${parseError.message}`);
        }
      } else {
        debug.steps.push('❌ localStorage中没有auth_session');
        throw new Error('localStorage中没有认证信息');
      }

      debug.steps.push('✅ 所有测试通过');

    } catch (err) {
      console.error('[AUTH TEST] Comprehensive test error:', err);
      debug.error = err instanceof Error ? err.message : '未知错误';
      debug.steps.push(`❌ 测试失败: ${debug.error}`);
      setError(debug.error);
    } finally {
      setDebugInfo(debug);
      setLoading(false);
    }
  };

  const testCreditBalance = runComprehensiveAuthTest;

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
            {loading ? '测试中...' : '🔍 运行综合认证测试'}
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

      {/* 综合调试信息 */}
      {debugInfo && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 综合调试信息</h2>

          {/* 测试步骤 */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">测试步骤:</h3>
            <ul className="space-y-1">
              {debugInfo.steps.map((step: string, index: number) => (
                <li key={index} className="text-sm">
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* localStorage信息 */}
          {debugInfo.localStorage && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">localStorage:</h3>
              <div className="text-sm space-y-1">
                <p><strong>存在:</strong> {debugInfo.localStorage.exists ? '✅ 是' : '❌ 否'}</p>
                {debugInfo.localStorage.raw && (
                  <p><strong>内容预览:</strong> <code className="bg-gray-100 px-1 rounded">{debugInfo.localStorage.raw}</code></p>
                )}
              </div>
            </div>
          )}

          {/* Session信息 */}
          {debugInfo.session && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Session解析:</h3>
              <div className="text-sm space-y-1">
                <p><strong>有tokens:</strong> {debugInfo.session.hasTokens ? '✅ 是' : '❌ 否'}</p>
                <p><strong>有ID Token:</strong> {debugInfo.session.hasIdToken ? '✅ 是' : '❌ 否'}</p>
                <p><strong>有Access Token:</strong> {debugInfo.session.hasAccessToken ? '✅ 是' : '❌ 否'}</p>
                <p><strong>Token类型:</strong> {debugInfo.session.tokenType}</p>
                <p><strong>过期时间:</strong> {debugInfo.session.expiresAt}</p>
              </div>
            </div>
          )}

          {/* JWT信息 */}
          {debugInfo.jwt && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">JWT Token:</h3>
              {debugInfo.jwt.error ? (
                <p className="text-red-600">❌ 解析失败: {debugInfo.jwt.error}</p>
              ) : (
                <div className="text-sm space-y-1">
                  <p><strong>签发者:</strong> {debugInfo.jwt.payload?.iss}</p>
                  <p><strong>受众:</strong> {debugInfo.jwt.payload?.aud}</p>
                  <p><strong>用户ID:</strong> {debugInfo.jwt.payload?.sub}</p>
                  <p><strong>手机号:</strong> {debugInfo.jwt.payload?.phone_number || '未设置'}</p>
                  <p><strong>邮箱:</strong> {debugInfo.jwt.payload?.email || '未设置'}</p>
                  <p><strong>是否过期:</strong> {debugInfo.jwt.isExpired ? '❌ 已过期' : '✅ 有效'}</p>
                  <p><strong>过期时间:</strong> {debugInfo.jwt.expiresAt}</p>
                </div>
              )}
            </div>
          )}

          {/* API请求信息 */}
          {debugInfo.apiRequest && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">API请求:</h3>
              <div className="text-sm space-y-1">
                <p><strong>URL:</strong> {debugInfo.apiRequest.url}</p>
                <p><strong>有Token:</strong> {debugInfo.apiRequest.hasToken ? '✅ 是' : '❌ 否'}</p>
                <p><strong>Token预览:</strong> <code className="bg-gray-100 px-1 rounded">{debugInfo.apiRequest.tokenPreview || 'null'}</code></p>
              </div>
            </div>
          )}

          {/* API响应信息 */}
          {debugInfo.apiResponse && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">API响应:</h3>
              <div className="text-sm space-y-1">
                <p><strong>状态码:</strong> <span className={debugInfo.apiResponse.status === 200 ? 'text-green-600' : 'text-red-600'}>{debugInfo.apiResponse.status} {debugInfo.apiResponse.statusText}</span></p>
                <p><strong>成功:</strong> {debugInfo.apiResponse.ok ? '✅ 是' : '❌ 否'}</p>
                {debugInfo.apiResponse.data && (
                  <p><strong>数据:</strong> <code className="bg-gray-100 px-1 rounded">{JSON.stringify(debugInfo.apiResponse.data)}</code></p>
                )}
                {debugInfo.apiResponse.error && (
                  <p><strong>错误:</strong> <span className="text-red-600">{debugInfo.apiResponse.error}</span></p>
                )}
              </div>
            </div>
          )}

          {/* 完整调试数据 */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">完整调试数据</summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}

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
