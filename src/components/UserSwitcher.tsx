import React, { useState } from 'react';
import { UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { sessionManager } from '../lib/auth';
import { AuthSession } from '../lib/adapters/types';

interface User {
  token: string;
  name: string;
  credits: number;
  description: string;
}

const testUsers: User[] = [
  {
    token: 'demo-token',
    name: '演示用户',
    credits: 200,
    description: '主要演示账户，功能齐全'
  },
  {
    token: 'new-user-token',
    name: '新用户',
    credits: 50,
    description: '模拟新注册用户体验'
  },
  {
    token: 'admin-token',
    name: '管理员',
    credits: 1000,
    description: '管理员功能测试'
  },
  {
    token: 'test-user-1-token',
    name: '测试用户1',
    credits: 150,
    description: '社交功能测试'
  },
  {
    token: 'test-user-2-token',
    name: '测试用户2',
    credits: 150,
    description: '社交功能测试'
  }
];

const UserSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState(() => {
    // 从session中获取当前token，如果没有则使用demo-token
    const session = sessionManager.getSession();
    return session?.tokens?.access_token || 'demo-token';
  });

  const currentUser = testUsers.find(user => user.token === currentToken) || testUsers[0];

  const handleUserSwitch = (token: string) => {
    // 创建新的session对象
    const newSession: AuthSession = {
      tokens: {
        access_token: token,
        id_token: token,
        refresh_token: token,
        token_type: 'Bearer',
        expires_in: 3600
      },
      expiresAt: Date.now() + 3600000 // 1小时后过期
    };

    // 更新session
    sessionManager.setSession(newSession);

    // 同时更新auth_token以兼容API调用
    localStorage.setItem('auth_token', token);

    setCurrentToken(token);
    setIsOpen(false);

    // 刷新页面以应用新的用户状态
    window.location.reload();
  };

  return (
    <div className="relative">
      {/* 当前用户显示 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
      >
        <UserIcon className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
        <span className="text-xs text-gray-500">({currentUser.credits}积分)</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 用户列表下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">切换测试账户</h3>
            <p className="text-xs text-gray-500 mt-1">选择不同的测试账户来体验各种功能</p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {testUsers.map((user) => (
              <button
                key={user.token}
                onClick={() => handleUserSwitch(user.token)}
                className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50 last:border-b-0 ${
                  user.token === currentToken ? 'bg-blue-50 border-blue-100' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800">{user.name}</span>
                      {user.token === currentToken && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">当前</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{user.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-600">{user.credits}</span>
                    <span className="text-xs text-gray-500 ml-1">积分</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 提示：切换用户后页面会自动刷新，每个用户都有独立的积分和数据
            </p>
          </div>
        </div>
      )}
      
      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserSwitcher;
