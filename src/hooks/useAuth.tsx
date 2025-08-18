import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { sessionManager } from '../lib/auth';
import { AuthSession } from '../lib/adapters/types';
import { authAdapter } from '../lib/adapters/authAdapter';
import { oidcConfig } from '../lib/adapters/config';
import { invitationService } from '../services/invitationService';
import { creditsService } from '../services/creditsService';
import { CreditTransactionReason } from '../types/credits';
import { parseJWTPayload, extractUserInfo, isTokenExpired } from '../utils/jwtUtils';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface AuthContextType {
  currentUser: User | null;
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  loginByRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  resetPassword?: (email: string) => Promise<void>;
  delete?: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

      // 解析JWT token获取真实用户信息
      const payload = parseJWTPayload(storedSession.tokens.id_token);
      if (payload && !isTokenExpired(payload)) {
        const userInfo = extractUserInfo(payload);
        console.log('[USE AUTH] 从JWT解析用户信息:', userInfo);
        setCurrentUser(userInfo);
      } else {
        console.log('[USE AUTH] JWT token无效或已过期，清除会话');
        sessionManager.clearSession();
        setSessionState(null);
        setCurrentUser(null);
      }
    }
    setLoading(false);
  }, []);

  // 处理邀请奖励
  const handleInvitationRewards = async () => {
    try {
      const result = await invitationService.handleInvitationFromUrl();
      if (result.success && result.reward) {
        // 邀请者与被邀请者奖励均由后端代发，前端仅显示提示
        if (result.reward > 0) {
          toast.success(`欢迎加入！您获得了${result.reward}积分奖励！`);
          // 刷新余额（后端已入账）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('creditsUpdated'));
          }
        }
      } else if (!result.success) {
        console.log('[AUTH] 邀请码处理失败:', result.message);
      }
    } catch (error) {
      console.error('[AUTH] 处理邀请奖励失败:', error);
      // 不影响登录流程，静默处理错误
    }
  };

  const setSession = (newSession: AuthSession) => {
    console.log('[USE AUTH] setSession 被调用，newSession:', newSession);
    sessionManager.setSession(newSession);
    setSessionState(newSession);

    // 设置用户状态
    if (newSession?.tokens?.id_token) {
      console.log('[USE AUTH] 设置用户状态...');

      // 解析JWT token获取真实用户信息
      const payload = parseJWTPayload(newSession.tokens.id_token);
      if (payload && !isTokenExpired(payload)) {
        const userInfo = extractUserInfo(payload);
        console.log('[USE AUTH] 从JWT解析用户信息:', userInfo);
        setCurrentUser(userInfo);
        console.log('[USE AUTH] 用户状态设置完成');

        // 处理邀请奖励（异步执行，不阻塞登录流程）
        handleInvitationRewards();
      } else {
        console.log('[USE AUTH] JWT token无效或已过期');
        setCurrentUser(null);
      }
    } else {
      console.log('[USE AUTH] 清除用户状态');
      setCurrentUser(null);
    }
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