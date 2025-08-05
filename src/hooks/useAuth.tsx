import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('登录成功');
    } catch (error: any) {
      let message = '登录失败';
      if (error.code === 'auth/user-not-found') {
        message = '用户不存在';
      } else if (error.code === 'auth/wrong-password') {
        message = '密码错误';
      } else if (error.code === 'auth/invalid-email') {
        message = '邮箱格式不正确';
      }
      toast.error(message);
      throw error;
    }
  };

  // 注册
  const register = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // 更新用户显示名称
      await updateProfile(user, { displayName });
      
      // 在Firestore中创建用户资料
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          language: 'zh-CN',
          notifications: true
        }
      });
      
      toast.success('注册成功');
    } catch (error: any) {
      console.error('注册错误:', error);
      let message = '注册失败';
      
      if (error.code === 'auth/email-already-in-use') {
        message = '邮箱已被使用';
      } else if (error.code === 'auth/weak-password') {
        message = '密码过于简单';
      } else if (error.code === 'auth/invalid-email') {
        message = '邮箱格式不正确';
      } else if (error.code === 'auth/unauthorized-domain') {
        message = 'Firebase配置错误：当前域名未授权。请联系管理员配置Firebase Authentication授权域名。';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Firebase配置错误：邮箱登录未启用。请联系管理员在Firebase控制台启用邮箱认证。';
      } else if (error.message) {
        message = `注册失败: ${error.message}`;
      }
      
      toast.error(message);
      throw error;
    }
  };

  // Google登录
  const loginWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // 检查用户是否已存在于Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // 如果是新用户，创建用户资料
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            language: 'zh-CN',
            notifications: true
          }
        });
      }
      
      toast.success('登录成功');
    } catch (error: any) {
      console.error('Google登录错误:', error);
      let message = 'Google登录失败';
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = '登录已取消';
      } else if (error.code === 'auth/unauthorized-domain') {
        message = 'Firebase配置错误：当前域名未授权。请联系管理员配置Firebase Authentication授权域名。';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Firebase配置错误：Google登录未启用。请联系管理员在Firebase控制台启用Google认证。';
      } else if (error.code === 'auth/popup-blocked') {
        message = '浏览器阻止了弹窗，请允许弹窗后重试';
      } else if (error.message) {
        message = `Google登录失败: ${error.message}`;
      }
      
      toast.error(message);
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('已登出');
    } catch (error) {
      toast.error('登出失败');
      throw error;
    }
  };

  // 重置密码
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('密码重置邮件已发送');
    } catch (error: any) {
      let message = '发送失败';
      if (error.code === 'auth/user-not-found') {
        message = '用户不存在';
      } else if (error.code === 'auth/invalid-email') {
        message = '邮箱格式不正确';
      }
      toast.error(message);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}