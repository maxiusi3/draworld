import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { sessionManager } from '../lib/auth';
import { AuthSession } from '../lib/adapters/types';
import { authAdapter } from '../lib/adapters/authAdapter';

interface AuthContextType {
  currentUser: { uid: string } | null;
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  loginByRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
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
  const [currentUser, setCurrentUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSessionState] = useState<AuthSession | null>(null);

  useEffect(() => {
    const storedSession = sessionManager.getSession();
    if (storedSession?.tokens?.id_token) {
      setSessionState(storedSession);
      // 简化：仅基于 id_token 存在视为已登录用户
      setCurrentUser({ uid: 'oidc-user' });
    }
    setLoading(false);
  }, []);

  const setSession = (newSession: AuthSession) => {
    sessionManager.setSession(newSession);
    setSessionState(newSession);
  };

  // 登录跳转：重定向至 Authing 授权页
  const loginByRedirect = async () => {
    const url = await authAdapter.buildAuthorizeUrl({ redirectUri: window.location.origin + '/callback' });
    window.location.href = url;
  };

  // 登出：清空本地会话
  const logout = async () => {
    sessionManager.clearSession();
    setSessionState(null);
    setCurrentUser(null);
    toast.success('已登出');
  };

  const value: AuthContextType = {
    currentUser,
    session,
    setSession,
    loginByRedirect,
    logout,
    loading,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}