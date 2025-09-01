// Credit system constants
export const CREDITS = {
  SIGNUP_BONUS: 150,
  DAILY_CHECKIN: 15,
  REFERRAL_SIGNUP: 30, // For referrer
  REFERRAL_FRIEND_BONUS: 50, // For new user
  REFERRAL_FIRST_VIDEO: 70, // For referrer when friend creates first video
  SOCIAL_SHARE: 100, // For UGC social media tasks
  VIDEO_CREATION_COST: 60,
} as const;

// File upload constants
export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_FORMATS: ['image/jpeg', 'image/png'],
  MAX_PROMPT_LENGTH: 300,
} as const;

// Mood options for video generation
export const MOODS = [
  { id: 'joyful', label: 'Joyful', emoji: '😊', description: 'Upbeat and cheerful' },
  { id: 'calm', label: 'Calm', emoji: '😌', description: 'Peaceful and serene' },
  { id: 'epic', label: 'Epic', emoji: '⚡', description: 'Dramatic and powerful' },
  { id: 'mysterious', label: 'Mysterious', emoji: '🌙', description: 'Enigmatic and intriguing' },
] as const;

// Gallery categories
export const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🎨' },
  { id: 'animals', label: 'Animals', icon: '🐾' },
  { id: 'fantasy', label: 'Fantasy', icon: '🦄' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
] as const;

// Sort options for gallery
export const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending' },
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
] as const;

export const VIDEOS_PER_PAGE = 12;

// Prompt templates
export const PROMPT_TEMPLATES = [
  'A [character] is [action] in [place]',
  'The [animal] is flying through [location]',
  'A magical [object] glowing in the [time of day]',
  'The [character] is dancing with [other character]',
  'A brave [hero] fighting a [creature]',
  'The [vehicle] racing through [environment]',
] as const;

// Performance targets
export const PERFORMANCE = {
  PAGE_LOAD_TARGET: 3000, // 3 seconds
  VIDEO_GENERATION_TARGET: 60000, // 60 seconds
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CREATE: '/create',
  GALLERY: '/gallery',
  PRICING: '/pricing',
  ACCOUNT: {
    PROFILE: '/account/profile',
    CREATIONS: '/account/creations',
    BILLING: '/account/billing',
    REFERRALS: '/account/referrals',
  },
  TERMS: '/terms-of-service',
  PRIVACY: '/privacy-policy',
} as const;