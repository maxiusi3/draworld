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
}

// Credit transaction types
export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchased';
  amount: number;
  description: string;
  source: 'signup' | 'checkin' | 'referral' | 'purchase' | 'video_generation' | 'admin_award';
  relatedId?: string; // Payment ID, Video ID, Referral ID, etc.
  createdAt: Timestamp;
}

// Video creation types
export interface VideoCreation {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  mood: 'joyful' | 'calm' | 'epic' | 'mysterious';
  originalImageUrl: string;
  croppedImageUrl: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  isPublic: boolean;
  category?: 'animals' | 'fantasy' | 'nature' | 'vehicles';
  views: number;
  shares: number;
  likes: number;
  duration?: number; // in seconds
  fileSize?: number; // in bytes
  resolution?: string; // e.g., "1920x1080"
  runwareGenerationId?: string; // External API generation ID
  processingStartedAt?: Timestamp;
  processingCompletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  error?: string;
}

// Video metadata for storage management
export interface VideoMetadata {
  id: string;
  videoCreationId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  duration: number;
  resolution: string;
  bitrate?: number;
  frameRate?: number;
  codec?: string;
  storageProvider: 'firebase' | 'cloudinary' | 'aws';
  storagePath: string;
  cdnUrl?: string;
  thumbnailPath?: string;
  thumbnailCdnUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Video processing job
export interface VideoProcessingJob {
  id: string;
  videoCreationId: string;
  type: 'generation' | 'thumbnail' | 'compression' | 'format_conversion';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  progress: number; // 0-100
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  packageId: string;
  amount: number; // in cents
  credits: number;
  bonusCredits: number;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Referral types
export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  signupBonusAwarded: boolean;
  firstVideoBonusAwarded: boolean;
  createdAt: Timestamp;
}

// Social task types
export interface SocialTask {
  id: string;
  userId: string;
  userEmail: string;
  type: 'instagram_share' | 'tiktok_share' | 'twitter_share' | 'facebook_share';
  platform: string;
  postUrl?: string;
  hashtags: string[];
  creditsAwarded: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  event: string;
  properties: Record<string, unknown>;
  createdAt: Timestamp;
}

// UI component types
export interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonusCredits: number;
  popular: boolean;
}

export interface PromptTemplate {
  id: string;
  text: string;
  category: string;
}

// Form types
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