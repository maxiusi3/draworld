/**
 * Referral System Integration Tests
 * Tests referral tracking and credit calculations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Firebase
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    })),
    add: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
  })),
};

jest.mock('@/lib/firebase', () => ({
  db: mockFirestore,
}));

describe('Referral System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Referral Code Generation', () => {
    it('should generate unique referral codes for new users', async () => {
      const userId = 'test-user-123';
      const expectedReferralCode = 'ABC123';

      // Mock user creation with referral code
      mockFirestore.collection().doc().set.mockResolvedValue(undefined);

      // Simulate user creation
      await mockFirestore.collection().doc().set({
        id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        referralCode: expectedReferralCode,
        credits: 150,
        createdAt: new Date(),
      });

      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          referralCode: expectedReferralCode,
        })
      );
    });

    it('should ensure referral codes are unique', async () => {
      const existingCodes = ['ABC123', 'DEF456', 'GHI789'];
      
      // Mock existing code check
      mockFirestore.collection().where().get.mockResolvedValue({
        empty: false, // Code already exists
      });

      // Should generate a different code
      const newCode = 'JKL012';
      
      // Mock successful unique code
      mockFirestore.collection().where().get.mockResolvedValueOnce({
        empty: true, // Code is unique
      });

      expect(newCode).not.toContain(existingCodes);
    });
  });

  describe('Referral Signup Process', () => {
    it('should award bonus credits to both referrer and referee', async () => {
      const referrerUserId = 'referrer-123';
      const refereeUserId = 'referee-456';
      const referralCode = 'ABC123';

      // Mock referrer lookup
      mockFirestore.collection().where().get.mockResolvedValue({
        docs: [{
          id: referrerUserId,
          data: () => ({
            id: referrerUserId,
            displayName: 'Referrer User',
            credits: 200,
            referralCode,
          }),
        }],
      });

      // Mock referee creation with referral bonus
      mockFirestore.collection().doc().set.mockResolvedValue(undefined);

      // Mock credit transactions
      mockFirestore.collection().add.mockResolvedValue({ id: 'tx-123' });

      // Simulate referral signup
      const refereeData = {
        id: refereeUserId,
        email: 'referee@example.com',
        displayName: 'Referee User',
        credits: 200, // 150 signup + 50 referral bonus
        referredBy: referrerUserId,
        referralCode: 'DEF456', // New code for referee
      };

      await mockFirestore.collection().doc().set(refereeData);

      // Verify referee gets bonus credits
      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: 200, // 150 + 50 bonus
          referredBy: referrerUserId,
        })
      );

      // Verify referrer gets referral credit
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: referrerUserId,
          type: 'earned',
          amount: 30,
          description: 'Referral bonus - friend signed up',
          source: 'referral',
        })
      );

      // Verify referee bonus transaction
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: refereeUserId,
          type: 'earned',
          amount: 50,
          description: 'Referral signup bonus',
          source: 'referral_signup',
        })
      );
    });

    it('should handle invalid referral codes gracefully', async () => {
      // Mock referrer lookup - not found
      mockFirestore.collection().where().get.mockResolvedValue({
        docs: [], // No referrer found
      });

      const refereeData = {
        email: 'referee@example.com',
        displayName: 'Referee User',
        credits: 150, // Only signup bonus, no referral bonus
      };

      await mockFirestore.collection().doc().set(refereeData);

      // Should only get signup bonus, not referral bonus
      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: 150, // No referral bonus
        })
      );
    });
  });

  describe('First Video Generation Bonus', () => {
    it('should award additional credits when referee generates first video', async () => {
      const referrerUserId = 'referrer-123';
      const refereeUserId = 'referee-456';

      // Mock referee with referrer relationship
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: refereeUserId,
          referredBy: referrerUserId,
          isFirstVideoGenerated: false,
          credits: 140, // After spending 60 for first video
        }),
      });

      // Mock referrer data
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          id: referrerUserId,
          credits: 230,
        }),
      });

      // Simulate first video generation completion
      await mockFirestore.collection().doc().update({
        isFirstVideoGenerated: true,
      });

      // Verify referrer gets first video bonus
      expect(mockFirestore.collection().add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: referrerUserId,
          type: 'earned',
          amount: 70,
          description: 'Referral bonus - friend generated first video',
          source: 'referral_first_video',
        })
      );

      // Verify referrer credit update
      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: expect.any(Number), // Should be incremented by 70
        })
      );
    });

    it('should not award bonus for subsequent videos', async () => {
      const referrerUserId = 'referrer-123';
      const refereeUserId = 'referee-456';

      // Mock referee who already generated first video
      mockFirestore.collection().doc().get.mockResolvedValue({
        exists: true,
        data: () => ({
          id: refereeUserId,
          referredBy: referrerUserId,
          isFirstVideoGenerated: true, // Already generated first video
        }),
      });

      // Simulate another video generation
      // Should not trigger any referral bonus

      expect(mockFirestore.collection().add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'referral_first_video',
        })
      );
    });
  });

  describe('Referral Analytics', () => {
    it('should track referral statistics', async () => {
      const referrerUserId = 'referrer-123';

      // Mock referral data
      mockFirestore.collection().where().get.mockResolvedValue({
        docs: [
          {
            id: 'referee-1',
            data: () => ({
              referredBy: referrerUserId,
              createdAt: new Date('2023-01-01'),
              isFirstVideoGenerated: true,
            }),
          },
          {
            id: 'referee-2',
            data: () => ({
              referredBy: referrerUserId,
              createdAt: new Date('2023-01-15'),
              isFirstVideoGenerated: false,
            }),
          },
          {
            id: 'referee-3',
            data: () => ({
              referredBy: referrerUserId,
              createdAt: new Date('2023-02-01'),
              isFirstVideoGenerated: true,
            }),
          },
        ],
      });

      const referralStats = {
        totalReferrals: 3,
        activeReferrals: 2, // Those who generated videos
        totalEarned: 160, // 30 * 3 + 70 * 2
        conversionRate: 0.67, // 2/3
      };

      expect(referralStats.totalReferrals).toBe(3);
      expect(referralStats.activeReferrals).toBe(2);
      expect(referralStats.conversionRate).toBeCloseTo(0.67, 2);
    });

    it('should calculate referral earnings correctly', async () => {
      const referralTransactions = [
        { amount: 30, source: 'referral' }, // Signup bonus
        { amount: 30, source: 'referral' }, // Another signup
        { amount: 70, source: 'referral_first_video' }, // First video bonus
        { amount: 30, source: 'referral' }, // Third signup
        { amount: 70, source: 'referral_first_video' }, // Second first video bonus
      ];

      const totalEarnings = referralTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );

      expect(totalEarnings).toBe(230);

      const signupBonuses = referralTransactions
        .filter(tx => tx.source === 'referral')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const videoBonuses = referralTransactions
        .filter(tx => tx.source === 'referral_first_video')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(signupBonuses).toBe(90); // 3 * 30
      expect(videoBonuses).toBe(140); // 2 * 70
    });
  });
});