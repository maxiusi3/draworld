import React, { useState, useEffect } from 'react';
import { oidcConfig } from '../lib/adapters/config';
import { authAdapter } from '../lib/adapters/authAdapter';

const OIDCDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // 收集调试信息
    const info = {
      currentUrl: window.location.href,
      origin: window.location.origin,
      callbackUrl: oidcConfig.getCallbackUrl(),
      clientId: oidcConfig.clientId,
      hasClientSecret: !!oidcConfig.clientSecret,
      tokenEndpoint: oidcConfig.discovery.token_endpoint,
      authEndpoint: oidcConfig.discovery.authorization_endpoint,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    
    // 运行基本测试
    runBasicTests();
  }, []);

  const runBasicTests = async () => {
    const results: any = {};
    
    // 测试1: 回调URL格式
    try {
      const callbackUrl = oidcConfig.getCallbackUrl();
      const isValidFormat = callbackUrl.startsWith('http') && callbackUrl.includes('/callback');
      results.callbackUrlFormat = {
        success: isValidFormat,
        value: callbackUrl,
        message: isValidFormat ? '回调URL格式正确' : '回调URL格式错误'
      };
    } catch (error) {
      results.callbackUrlFormat = {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
    
    // 测试2: OIDC端点可访问性
    try {
      const response = await fetch(oidcConfig.discovery.authorization_endpoint, { method: 'HEAD' });
      results.authEndpointAccess = {
        success: response.ok,
        status: response.status,
        message: response.ok ? '授权端点可访问' : `授权端点访问失败: ${response.status}`
      };
    } catch (error) {
      results.authEndpointAccess = {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
    
    // 测试3: 授权URL生成
    try {
      const authUrl = await authAdapter.buildAuthUrl({
        redirectUri: oidcConfig.getCallbackUrl(),
        state: 'test-state'
      });

      const url = new URL(authUrl);
      const hasRequiredParams = url.searchParams.has('client_id') &&
                               url.searchParams.has('redirect_uri') &&
                               url.searchParams.has('response_type');

      results.authUrlGeneration = {
        success: hasRequiredParams,
        url: authUrl,
        message: hasRequiredParams ? '授权URL生成正确' : '授权URL缺少必需参数'
      };
    } catch (error) {
      results.authUrlGeneration = {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
    
    setTestResults(results);
  };

  const testTokenExchange = async () => {
    const testCode = 'test-code-123';
    const callbackUrl = oidcConfig.getCallbackUrl();
    
    try {
      console.log('[OIDC DEBUG] 测试Token交换...');
      await authAdapter.exchangeCode({
        code: testCode,
        redirectUri: callbackUrl
      });
    } catch (error) {
      console.log('[OIDC DEBUG] Token交换测试完成（预期会失败）:', error);
      alert(`Token交换测试完成。错误信息: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const generateAuthUrl = async () => {
    try {
      const authUrl = await authAdapter.buildAuthUrl({
        redirectUri: oidcConfig.getCallbackUrl(),
        state: 'debug-test-' + Date.now()
      });

      window.open(authUrl, '_blank');
    } catch (error) {
      alert(`生成授权URL失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">OIDC调试工具</h1>
          
          {/* 调试信息 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">系统信息</h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>当前URL:</strong> {debugInfo.currentUrl}
                </div>
                <div>
                  <strong>Origin:</strong> {debugInfo.origin}
                </div>
                <div>
                  <strong>回调URL:</strong> {debugInfo.callbackUrl}
                </div>
                <div>
                  <strong>Client ID:</strong> {debugInfo.clientId}
                </div>
                <div>
                  <strong>有Client Secret:</strong> {debugInfo.hasClientSecret ? '是' : '否'}
                </div>
                <div>
                  <strong>Token端点:</strong> {debugInfo.tokenEndpoint}
                </div>
              </div>
            </div>
          </div>
          
          {/* 测试结果 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">自动测试结果</h2>
            <div className="space-y-4">
              {Object.entries(testResults).map(([key, result]: [string, any]) => (
                <div key={key} className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span className="font-medium">{key}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {result.message || result.error}
                  </div>
                  {result.value && (
                    <div className="mt-2 text-xs text-gray-500 break-all">
                      {result.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 手动测试按钮 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">手动测试</h2>
            <div className="space-y-4">
              <button
                onClick={generateAuthUrl}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                生成授权URL并打开
              </button>
              
              <button
                onClick={testTokenExchange}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors ml-4"
              >
                测试Token交换（会失败）
              </button>
              
              <button
                onClick={runBasicTests}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ml-4"
              >
                重新运行测试
              </button>
            </div>
          </div>
          
          {/* 故障排除指南 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">故障排除指南</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">常见问题和解决方案：</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>
                  <strong>授权码无效或已过期：</strong>
                  <br />• 确保Authing控制台中配置了正确的回调URL: {debugInfo.callbackUrl}
                  <br />• 检查授权码是否被重复使用
                  <br />• 确认client_id和client_secret正确
                </li>
                <li>
                  <strong>回调URL不匹配：</strong>
                  <br />• 当前配置的回调URL: {debugInfo.callbackUrl}
                  <br />• 请在Authing控制台的应用配置中添加此URL
                </li>
                <li>
                  <strong>网络连接问题：</strong>
                  <br />• 检查是否能访问 {debugInfo.tokenEndpoint}
                  <br />• 确认防火墙或代理设置
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OIDCDebugPage;
