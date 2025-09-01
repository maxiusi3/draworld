'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditTransaction, Payment } from '@/types';
import { CreditService } from '@/services/creditService';
import { PaymentService } from '@/services/paymentService';

interface UserContextType {
  // Credit management
  creditHistory: CreditTransaction[];
  paymentHistory: Payment[];
  loadingCredits: boolean;
  loadingPayments: boolean;
  
  // Actions
  performDailyCheckIn: () => Promise<{ success: boolean; creditsEarned?: number; error?: string }>;
  refreshCreditHistory: () => Promise<void>;
  refreshPaymentHistory: () => Promise<void>;
  
  // Check-in status
  canCheckIn: boolean;
  nextCheckInTime: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [nextCheckInTime, setNextCheckInTime] = useState<string | null>(null);

  // Check if user can perform daily check-in
  const updateCheckInStatus = useCallback(() => {
    if (!user?.lastCheckIn) {
      setCanCheckIn(true);
      setNextCheckInTime(null);
      return;
    }

    const now = new Date();
    const lastCheckIn = user.lastCheckIn.toDate();
    const timeDiff = now.getTime() - lastCheckIn.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff >= 24) {
      setCanCheckIn(true);
      setNextCheckInTime(null);
    } else {
      setCanCheckIn(false);
      const nextCheckIn = new Date(lastCheckIn.getTime() + 24 * 60 * 60 * 1000);
      const timeUntilNext = nextCheckIn.getTime() - now.getTime();
      const hoursUntil = Math.floor(timeUntilNext / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursUntil > 0) {
        setNextCheckInTime(`${hoursUntil}h ${minutesUntil}m`);
      } else {
        setNextCheckInTime(`${minutesUntil}m`);
      }
    }
  }, [user]);

  // Update check-in status when user changes
  useEffect(() => {
    updateCheckInStatus();
    
    // Update every minute
    const interval = setInterval(updateCheckInStatus, 60000);
    return () => clearInterval(interval);
  }, [updateCheckInStatus, user]);

  const refreshCreditHistory = useCallback(async () => {
    if (!user) return;

    setLoadingCredits(true);
    try {
      const result = await CreditService.getCreditHistory(50);
      setCreditHistory(result.transactions);
    } catch (error) {
      console.error('Failed to load credit history:', error);
    } finally {
      setLoadingCredits(false);
    }
  }, [user]);

  const refreshPaymentHistory = useCallback(async () => {
    if (!user) return;

    setLoadingPayments(true);
    try {
      const result = await PaymentService.getPaymentHistory(20);
      setPaymentHistory(result.payments);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoadingPayments(false);
    }
  }, [user]);

  // Perform daily check-in
  const performDailyCheckIn = async () => {
    if (!canCheckIn) {
      return { success: false, error: 'Check-in not available yet' };
    }

    try {
      const result = await CreditService.dailyCheckIn();
      await refreshUser(); // Refresh user data to update lastCheckIn
      updateCheckInStatus();
      await refreshCreditHistory(); // Refresh credit history
      
      return { 
        success: true, 
        creditsEarned: result.creditsEarned 
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to perform check-in';
      return { 
        success: false, 
        error: message
      };
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refreshCreditHistory();
      refreshPaymentHistory();
    } else {
      setCreditHistory([]);
      setPaymentHistory([]);
    }
  }, [user, refreshCreditHistory, refreshPaymentHistory]);

  const value: UserContextType = {
    creditHistory,
    paymentHistory,
    loadingCredits,
    loadingPayments,
    performDailyCheckIn,
    refreshCreditHistory,
    refreshPaymentHistory,
    canCheckIn,
    nextCheckInTime,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}