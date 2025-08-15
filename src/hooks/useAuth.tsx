import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { sessionManager } from '../lib/auth';
import { AuthSession } from '../lib/adapters/types';
import { authAdapter } from '../lib/adapters/authAdapter';
import { oidcConfig } from '../lib/adapters/config';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

interface AuthContextType {
  currentUser: User | null;
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  loginByRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  resetPassword?: (email: string) => Promise<void>;
  delete?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSessionState] = useState<AuthSession | null>(null);

  useEffect(() => {
    const storedSession = sessionManager.getSession();
    if (storedSession?.tokens?.id_token) {
      setSessionState(storedSession);
      // 简化：仅基于 id_token 存在视为已登录用户
      setCurrentUser({
        uid: 'oidc-user',
        email: 'user@example.com',
        displayName: '用户',
        photoURL: '',
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      });
    }
    setLoading(false);
  }, []);

  const setSession = (newSession: AuthSession) => {
    sessionManager.setSession(newSession);
    setSessionState(newSession);
  };

  // 登录跳转：重定向至 Authing 授权页
  const loginByRedirect = async () => {
    try {
      const callbackUrl = oidcConfig.getCallbackUrl();
      console.log('使用回调URL:', callbackUrl);
      const url = await authAdapter.buildAuthorizeUrl({ redirectUri: callbackUrl });
      window.location.href = url;
    } catch (error) {
      console.error('构建授权URL失败:', error);
      toast.error('登录失败，请重试');
    }
  };

  // 登出：清空本地会话
  const logout = async () => {
    sessionManager.clearSession();
    setSessionState(null);
    setCurrentUser(null);
    toast.success('已登出');
  };

  // 重置密码（占位实现）
  const resetPassword = async (email: string) => {
    toast.success('密码重置邮件已发送');
  };

  // 删除账户（占位实现）
  const deleteAccount = async () => {
    sessionManager.clearSession();
    setSessionState(null);
    setCurrentUser(null);
    toast.success('账户已删除');
  };

  const value: AuthContextType = {
    currentUser,
    session,
    setSession,
    loginByRedirect,
    logout,
    loading,
    resetPassword,
    delete: deleteAccount,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}