import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  credits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastCheckIn?: Timestamp;
  referralCode?: string;
  referredBy?: string;
  isFirstVideoGenerated?: boolean;
  role?: 'user' | 'admin';
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  source: 'signup' | 'checkin' | 'referral' | 'purchase' | 'generation' | 'admin_award';
  relatedId?: string;
  createdAt: Timestamp;
}

export interface Payment {
  id: string;
  userId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  packageId: string;
  credits: number;
  bonusCredits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdminUser extends User {
  lastSignInTime?: string;
  creationTime?: string;
  banned?: boolean;
  banReason?: string;
  bannedAt?: Timestamp | null;
}

export interface UserDetailsStats {
  totalVideos: number;
  totalSpent: number;
}

export interface CreateVideoForm {
  originalImage: File | null;
  croppedImageUrl: string;
  prompt: string;
  mood: 'joyful' | 'calm' | 'epic' | 'mysterious';
}

export interface AuthForm {
  email: string;
  password: string;
  displayName?: string;
}

export interface ProfileForm {
  displayName: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface Video {
  id: string;
  title?: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: Timestamp;
  userId: string;
  userName?: string;
  views?: number;
  likes?: number;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isFeatured?: boolean;
}