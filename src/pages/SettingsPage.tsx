import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { currentUser, logout, resetPassword, delete: deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleResetPassword = async () => {
    if (!currentUser?.email) {
      toast.error('无法获取邮箱地址');
      return;
    }
    
    setResettingPassword(true);
    try {
      await resetPassword(currentUser.email);
    } catch (error) {
      // 错误已在useAuth中处理
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '删除我的账户') {
      toast.error('请输入正确的确认文字');
      return;
    }
    
    setDeleting(true);
    try {
      // 调用 AuthContext 的删除方法
      if (deleteAccount) {
        await deleteAccount();
      }
      toast.success('账户已删除');
      navigate('/');
    } catch (error: any) {
      console.error('删除账户失败:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('为了安全，请重新登录后再试');
        await logout();
        navigate('/login');
      } else {
        toast.error('删除账户失败');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录才能访问设置页面</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            账户设置
          </h1>
          <p className="text-gray-600">
            管理您的账户信息和首选项
          </p>
        </div>

        <div className="space-y-6">
          {/* 用户信息 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <UserCircleIcon className="w-8 h-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">用户信息</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">姓名</label>
                <div className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800">
                  {currentUser.displayName || '未设置'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">邮箱</label>
                <div className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800">
                  {currentUser.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">注册时间</label>
                <div className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800">
                  {currentUser.metadata.creationTime ? 
                    new Date(currentUser.metadata.creationTime).toLocaleDateString('zh-CN') 
                    : '未知'
                  }
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">最后登录</label>
                <div className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800">
                  {currentUser.metadata.lastSignInTime ? 
                    new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('zh-CN') 
                    : '未知'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 密码管理 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <KeyIcon className="w-8 h-8 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">密码管理</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                如果您需要更改密码，我们将向您的邮箱发送重置链接。
              </p>
              
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resettingPassword ? '发送中...' : '发送密码重置邮件'}
              </button>
            </div>
          </div>

          {/* 危险操作 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-100">
            <div className="flex items-center space-x-4 mb-6">
              <TrashIcon className="w-8 h-8 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-800">危险操作</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-semibold mb-2">删除账户</h3>
                    <p className="text-red-700 text-sm mb-4">
                      删除账户将永久删除您的所有数据，包括作品、视频和账户信息。此操作不可逆转！
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                      >
                        删除我的账户
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-red-800 font-medium">
                          请输入 "删除我的账户" 来确认操作：
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="删除我的账户"
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleting || deleteConfirmText !== '删除我的账户'}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting ? '删除中...' : '确认删除'}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                            disabled={deleting}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;