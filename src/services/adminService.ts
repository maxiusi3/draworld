import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';
import { User, UserDetailsStats } from '@/types';

export interface AdminUser extends User {
  id: string;
}

export const AdminService = {
  async getUsers({
    page = 1,
    pageSize = 10,
    filter = 'all',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: {
    page?: number;
    pageSize?: number;
    filter?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: AdminUser[]; total: number }> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const usersRef = collection(db, 'users');
    let q = query(usersRef);

    if (search) {
      q = query(q, where('email', '>=', search), where('email', '<=', search + '\uf8ff'));
    }
    
    if (filter === 'banned') {
      q = query(q, where('banned', '==', true));
    }

    const totalQuery = query(q);
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    q = query(q, orderBy(sortBy, sortOrder));

    if (page > 1) {
      const lastVisibleDoc = await getDocs(query(usersRef, orderBy(sortBy, sortOrder), limit((page - 1) * pageSize)));
      const lastVisible = lastVisibleDoc.docs[lastVisibleDoc.docs.length - 1];
      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
    }
    
    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
    return { users, total };
  },

  async getUserDetails(id: string): Promise<Partial<AdminUser> & { stats: UserDetailsStats }> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    // This is a placeholder. In a real app, you'd fetch related data, e.g., from other collections.
    const stats: UserDetailsStats = {
      totalVideos: Math.floor(Math.random() * 100),
      totalSpent: Math.floor(Math.random() * 10000),
    };
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    const user = { id: userSnap.id, ...userSnap.data() } as AdminUser;

    return { ...user, stats };
  },

  async getUser(id: string): Promise<AdminUser | null> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as AdminUser;
    }
    return null;
  },

  async updateUser(id: string, data: Partial<AdminUser>): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, data);
  },

  async awardCredits(userId: string, amount: number, reason?: string): Promise<{success: boolean, message: string}> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const batch = writeBatch(db);
      const newCredits = (userSnap.data().credits || 0) + amount;
      batch.update(userRef, { credits: newCredits });

      const creditTxRef = doc(collection(db, 'users', userId, 'creditTransactions'));
      batch.set(creditTxRef, {
        amount,
        type: 'award',
        reason: reason || 'Admin award',
        createdAt: new Date(),
      });

      await batch.commit();
      return { success: true, message: `Awarded ${amount} credits.` };
    }
    return { success: false, message: 'User not found.' };
  },

  async deductCredits(userId: string, amount: number, reason?: string): Promise<{success: boolean, message: string}> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const batch = writeBatch(db);
      const newCredits = Math.max(0, (userSnap.data().credits || 0) - amount);
      batch.update(userRef, { credits: newCredits });

      const creditTxRef = doc(collection(db, 'users', userId, 'creditTransactions'));
      batch.set(creditTxRef, {
        amount: -amount,
        type: 'deduction',
        reason: reason || 'Admin deduction',
        createdAt: new Date(),
      });
      
      await batch.commit();
      return { success: true, message: `Deducted ${amount} credits.` };
    }
    return { success: false, message: 'User not found.' };
  },

  async banUser(userId: string, reason: string): Promise<{success: boolean, message: string}> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      role: 'banned',
      banned: true,
      banReason: reason,
      bannedAt: new Date(),
    });
    return { success: true, message: 'User has been banned.' };
  },

  async unbanUser(userId: string): Promise<{success: boolean, message: string}> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      role: 'user',
      banned: false,
      banReason: null,
      bannedAt: null,
    });
    return { success: true, message: 'User has been unbanned.' };
  },
};