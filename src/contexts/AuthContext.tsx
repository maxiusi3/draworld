'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { CREDITS } from '@/lib/constants';
import { generateReferralCode } from '@/lib/utils';
import { trackSignup, trackLogin, setAnalyticsUserId, setAnalyticsUserProperties } from '@/lib/analytics';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, referralCode?: string) => Promise<void>;
  signInWithGoogle: (referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    if (!db) {
      console.error('Firestore not initialized');
      return null;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        return { id: firebaseUser.uid, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Create new user document in Firestore
  const createUserDocument = async (
    firebaseUser: FirebaseUser,
    displayName: string,
    referralCode?: string
  ): Promise<User> => {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const userData: Omit<User, 'id'> = {
      email: firebaseUser.email!,
      displayName: displayName || firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL || undefined,
      credits: CREDITS.SIGNUP_BONUS,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      referralCode: generateReferralCode(firebaseUser.uid),
      referredBy: referralCode,
      isFirstVideoGenerated: false,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Create signup bonus transaction
    await setDoc(doc(db, 'creditTransactions', `${firebaseUser.uid}_signup`), {
      userId: firebaseUser.uid,
      type: 'bonus',
      amount: CREDITS.SIGNUP_BONUS,
      description: 'Welcome bonus for new account',
      createdAt: serverTimestamp(),
    });

    // Handle referral if provided
    if (referralCode) {
      try {
        const { ReferralService } = await import('@/services/referralService');
        await ReferralService.processReferralSignup(referralCode);
      } catch (error) {
        console.error('Failed to process referral:', error);
        // Don&apos;t throw error here as user creation was successful
      }
    }

    return { id: firebaseUser.uid, ...userData } as User;
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      trackLogin('email');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string, referralCode?: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName });
      
      // Create user document in Firestore
      const userData = await createUserDocument(firebaseUser, displayName, referralCode);
      setUser(userData);
      trackSignup('email', referralCode);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (referralCode?: string) => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      
      // Check if user already exists
      let userData = await fetchUserData(firebaseUser);
      
      if (!userData) {
        // Create new user document
        userData = await createUserDocument(
          firebaseUser,
          firebaseUser.displayName || 'User',
          referralCode
        );
      }
      
      setUser(userData);
      trackLogin('google');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName: string) => {
    if (!firebaseUser || !user) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName });
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', user.id), {
        displayName,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setUser(prev => prev ? { ...prev, displayName } : null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Update user password
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser) throw new Error('No user logged in');

    try {
      // Re-authenticate user first
      await signInWithEmailAndPassword(auth, firebaseUser.email!, currentPassword);
      
      // Update password
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!firebaseUser) return;
    
    const userData = await fetchUserData(firebaseUser);
    setUser(userData);
  };

  // Listen for auth state changes
  useEffect(() => {
    // Check if Firebase auth is available
    if (!auth) {
      console.error('Firebase auth not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      try {
        if (firebaseUser) {
          setFirebaseUser(firebaseUser);
          const userData = await fetchUserData(firebaseUser);
          setUser(userData);
          
          // Set analytics user properties
          if (userData) {
            setAnalyticsUserId(userData.id);
            setAnalyticsUserProperties({
              user_id: userData.id,
              email: userData.email,
              display_name: userData.displayName,
              created_at: userData.createdAt?.toString() || '',
            });
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut: logout, // Alias for consistency
    logout,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}