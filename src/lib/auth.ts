import { auth } from './firebase';
import { User, deleteUser, getIdToken } from 'firebase/auth';

// Get current user token with force refresh option
export async function getCurrentUserToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await getIdToken(user, forceRefresh);
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
}

// Securely delete user account
export async function deleteUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  
  try {
    await deleteUser(user);
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

// Validate token expiry and refresh if needed
export async function validateAndRefreshToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    // Get token claims to check expiry
    const tokenResult = await user.getIdTokenResult();
    const expirationTime = new Date(tokenResult.expirationTime);
    const now = new Date();
    
    // If token expires in less than 5 minutes, refresh it
    const timeUntilExpiry = expirationTime.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeUntilExpiry < fiveMinutes) {
      return await getCurrentUserToken(true); // Force refresh
    }
    
    return tokenResult.token;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Format Firebase Auth errors
export function formatAuthError(error: any): string {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

// Check if user can perform daily check-in
export function canPerformDailyCheckIn(lastCheckIn?: Date): boolean {
  if (!lastCheckIn) return true;
  
  const now = new Date();
  const lastCheckInDate = new Date(lastCheckIn);
  
  // Check if it's been at least 24 hours
  const timeDiff = now.getTime() - lastCheckInDate.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff >= 24;
}

// Get time until next check-in
export function getTimeUntilNextCheckIn(lastCheckIn: Date): string {
  const now = new Date();
  const nextCheckIn = new Date(lastCheckIn.getTime() + 24 * 60 * 60 * 1000);
  
  if (now >= nextCheckIn) return 'Available now';
  
  const timeDiff = nextCheckIn.getTime() - now.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}