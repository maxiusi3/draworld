import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { User } from '@/types';

// Firebase Functions
const updateUserProfileFn = httpsCallable(functions, 'updateUserProfile');
const getUserDataFn = httpsCallable(functions, 'getUserData');

export class UserService {
  /**
   * Update user profile
   */
  static async updateProfile(displayName: string): Promise<void> {
    try {
      await updateUserProfileFn({ displayName });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get user data
   */
  static async getUserData(): Promise<User> {
    try {
      const result = await getUserDataFn();
      return result.data as User;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user data';
      throw new Error(errorMessage);
    }
  }
}