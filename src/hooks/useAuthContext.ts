// 语言: TypeScript
// 说明: 认证上下文Hook，单独文件以支持Fast Refresh

import { useContext } from 'react';
import { AuthContext, AuthContextType } from './useAuth';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
