import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  credits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastCheckinDate?: Timestamp;
  referralCode: string;
  referredBy?: string;
  isFirstVideoGenerated: boolean;
  role?: 'user' | 'admin' | 'moderator';
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