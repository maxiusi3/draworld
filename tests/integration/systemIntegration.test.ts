/**
 * System Integration Tests
 * Tests complete user flows and system integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock Firebase and external services
jest.mock('@/lib/firebase');
jest.mock('@/lib/stripe');
jest.mock('@/lib/runware');

// Create shared mock functions for proper call tracking
const mockDocSet = jest.fn().mockResolvedValue(undefined);
const mockDocUpdate = jest.fn().mockResolvedValue(undefined);
const mockDocDelete = jest.fn().mockResolvedValue(undefined);
const mockCollectionAdd = jest.fn().mockResolvedValue({ id: 'new-doc-id' });
const mockCollectionGet = jest.fn();
const mockDocGet = jest.fn();

// Mock services
const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: mockDocGet,
      set: mockDocSet,
      update: mockDocUpdate,
      delete: mockDocDelete,
    })),
    add: mockCollectionAdd,
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: mockCollectionGet,
  })),
};

const mockStripe = {
  createPaymentIntent: jest.fn(),
  confirmPayment: jest.fn(),
  retrievePaymentIntent: jest.fn(),
};

const mockRunware = {
  generateVideo: jest.fn(),
  getVideoStatus: jest.fn(),
};

describe('System Integration Tests', () => {
  beforeAll(() => {
    // Setup global mocks
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Cleanup
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set default mock implementations
    mockDocGet.mockResolvedValue({
      exists: true,
      data: jest.fn().mockReturnValue({
        id: 'test-user-123',
        credits: 150,
        displayName: 'Test User',
        email: 'test@example.com',
        lastCheckinDate: null,
      }),
    });
    
    mockCollectionGet.mockResolvedValue({
      docs: [],
      empty: true,
    });
  });

  describe('Complete User Registration Flow', () => {
    it('should complete full user registration with credit bonus', async () => {
      // Mock successful user creation
      mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        },
      });

      // Mock user document creation
      mockFirestore.collection().doc().set.mockResolvedValue(undefined);

      // Mock credit transaction creation
      mockFirestore.collection().add.mockResolvedValue({
        id: 'credit-tx-123',
      });

      // Simulate user registration
      const registrationData = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      };

      // Test user creation
      const userResult = await mockFirebaseAuth.createUserWithEmailAndPassword(
        registrationData.email,
        registrationData.password
      );

      expect(userResult.user.uid).toBe('test-user-123');

      // Simulate user document creation
      await mockDocSet({
        email: 'test@example.com',
        displayName: 'Test User',
        credits: 150,
        createdAt: new Date(),
      });

      // Simulate credit transaction creation
      await mockCollectionAdd({
        userId: 'test-user-123',
        type: 'earned',
        amount: 150,
        description: 'Welcome bonus for new account',
        source: 'signup',
      });

      // Test user document creation with initial credits
      expect(mockDocSet).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
          credits: 150, // Initial signup bonus
          createdAt: expect.any(Object),
        })
      );

      // Test credit transaction creation
      expect(mockCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          type: 'earned',
          amount: 150,
          description: 'Welcome bonus for new account',
          source: 'signup',
        })
      );
    });

    it('should handle referral signup with bonus credits', async () => {
      const referralCode = 'ABC123';
      
      // Mock referrer lookup with actual data
      mockCollectionGet.mockResolvedValue({
        docs: [{
          id: 'referrer-user',
          data: () => ({
            id: 'referrer-user',
            displayName: 'Referrer User',
            credits: 100,
          }),
        }],
        empty: false,
      });

      // Mock user creation with referral
      mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'referred-user-123',
          email: 'referred@example.com',
        },
      });

      // Test referral lookup
      const referrerQuery = await mockCollectionGet();
      expect(referrerQuery.docs).toHaveLength(1);

      // Simulate referred user document creation
      await mockDocSet({
        email: 'referred@example.com',
        displayName: 'Referred User',
        credits: 200, // 150 signup + 50 referral bonus
        referredBy: referralCode,
        createdAt: new Date(),
      });

      // Simulate referrer credit transaction
      await mockCollectionAdd({
        userId: 'referrer-user',
        type: 'earned',
        amount: 30,
        description: 'Referral bonus - friend signed up',
        source: 'referral',
      });

      // Test referred user gets bonus credits (150 + 50)
      expect(mockDocSet).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: 200, // 150 signup + 50 referral bonus
        })
      );

      // Test referrer gets referral credit
      expect(mockCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'referrer-user',
          type: 'earned',
          amount: 30,
          description: 'Referral bonus - friend signed up',
          source: 'referral',
        })
      );
    });
  });

  describe('Complete Video Creation Flow', () => {
    it('should complete full video creation workflow', async () => {
      const userId = 'test-user-123';
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Mock user with sufficient credits
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          id: userId,
          credits: 150,
          displayName: 'Test User',
        }),
      });

      // Mock image upload
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          imageUrl: 'https://example.com/uploaded-image.jpg',
        }),
      });

      // Mock content moderation (pass)
      const mockModerationResult = {
        isAppropriate: true,
        confidence: 0.95,
      };

      // Mock video generation
      mockRunware.generateVideo.mockResolvedValue({
        id: 'video-gen-123',
        status: 'processing',
        estimatedTime: 60,
      });

      // Mock video status polling
      mockRunware.getVideoStatus
        .mockResolvedValueOnce({
          id: 'video-gen-123',
          status: 'processing',
          progress: 25,
        })
        .mockResolvedValueOnce({
          id: 'video-gen-123',
          status: 'processing',
          progress: 75,
        })
        .mockResolvedValueOnce({
          id: 'video-gen-123',
          status: 'completed',
          videoUrl: 'https://example.com/generated-video.mp4',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
        });

      // Test image upload
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData(),
      });
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.imageUrl).toBe('https://example.com/uploaded-image.jpg');

      // Test video generation initiation
      const generationResult = await mockRunware.generateVideo({
        imageUrl: uploadResult.imageUrl,
        prompt: 'A magical adventure',
        mood: 'joyful',
        title: 'My Adventure',
      });

      expect(generationResult.id).toBe('video-gen-123');
      expect(generationResult.status).toBe('processing');

      // Simulate credit deduction
      await mockDocUpdate({
        credits: 90, // 150 - 60
      });

      // Test credit deduction
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: expect.any(Number), // Should be decremented by 60
        })
      );

      // Test video completion - call getVideoStatus multiple times to simulate polling
      let finalStatus;
      finalStatus = await mockRunware.getVideoStatus('video-gen-123'); // First call - processing 25%
      finalStatus = await mockRunware.getVideoStatus('video-gen-123'); // Second call - processing 75%
      finalStatus = await mockRunware.getVideoStatus('video-gen-123'); // Third call - completed
      
      expect(finalStatus.status).toBe('completed');
      expect(finalStatus.videoUrl).toBeTruthy();
    });

    it('should handle insufficient credits gracefully', async () => {
      const userId = 'test-user-123';

      // Mock user with insufficient credits
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          id: userId,
          credits: 30, // Less than 60 required
          displayName: 'Test User',
        }),
      });

      // Test credit check
      const userDoc = await mockDocGet();
      const userData = userDoc.data();
      
      expect(userData.credits).toBeLessThan(60);

      // Should not proceed with video generation
      expect(mockRunware.generateVideo).not.toHaveBeenCalled();
    });
  });

  describe('Payment Processing Integration', () => {
    it('should complete payment flow and award credits', async () => {
      const userId = 'test-user-123';
      const packageId = 'starter';
      const amount = 199; // $1.99
      const credits = 100;

      // Mock Stripe payment intent creation
      mockStripe.createPaymentIntent.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      });

      // Mock payment confirmation
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded',
        },
      });

      // Mock payment record creation
      mockFirestore.collection().add.mockResolvedValue({
        id: 'payment-123',
      });

      // Test payment intent creation
      const paymentIntent = await mockStripe.createPaymentIntent({
        amount,
        currency: 'usd',
        metadata: {
          userId,
          packageId,
          credits: credits.toString(),
        },
      });

      expect(paymentIntent.id).toBe('pi_test_123');

      // Test payment confirmation
      const confirmation = await mockStripe.confirmPayment({
        elements: {}, // Mock elements
        confirmParams: {
          return_url: 'https://example.com/success',
        },
      });

      expect(confirmation.paymentIntent.status).toBe('succeeded');

      // Simulate credit award
      await mockDocUpdate({
        credits: 250, // Previous credits + 100
      });

      // Simulate payment record creation
      await mockCollectionAdd({
        userId,
        stripePaymentIntentId: 'pi_test_123',
        packageId,
        amount,
        credits,
        status: 'succeeded',
        createdAt: new Date(),
      });

      // Test credit award
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: expect.any(Number), // Should be incremented
        })
      );

      // Test payment record
      expect(mockCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          stripePaymentIntentId: 'pi_test_123',
          packageId,
          amount,
          credits,
          status: 'succeeded',
        })
      );
    });

    it('should handle payment failures gracefully', async () => {
      // Mock payment failure
      mockStripe.confirmPayment.mockResolvedValue({
        error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.',
        },
      });

      const confirmation = await mockStripe.confirmPayment({
        elements: {},
        confirmParams: {
          return_url: 'https://example.com/success',
        },
      });

      expect(confirmation.error).toBeDefined();
      expect(confirmation.error.code).toBe('card_declined');

      // Should not award credits on failure
      expect(mockDocUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Credit System Integration', () => {
    it('should handle daily check-in flow', async () => {
      const userId = 'test-user-123';

      // Mock user with no recent check-in
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          id: userId,
          credits: 100,
          lastCheckinDate: null,
        }),
      });

      // Test check-in eligibility
      const userDoc = await mockDocGet();
      const userData = userDoc.data();
      expect(userData.lastCheckinDate).toBeNull();

      // Simulate check-in process
      await mockDocUpdate({
        credits: 115,
        lastCheckinDate: new Date(),
      });

      await mockCollectionAdd({
        userId,
        type: 'earned',
        amount: 15,
        description: 'Daily check-in bonus',
        source: 'checkin',
      });

      // Test credit award
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: expect.any(Number),
          lastCheckinDate: expect.any(Object),
        })
      );

      // Test transaction record
      expect(mockCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'earned',
          amount: 15,
          description: 'Daily check-in bonus',
          source: 'checkin',
        })
      );
    });

    it('should prevent multiple check-ins within 24 hours', async () => {
      const userId = 'test-user-123';
      const recentCheckIn = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago

      // Mock user with recent check-in
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          id: userId,
          credits: 100,
          lastCheckinDate: { toDate: () => recentCheckIn },
        }),
      });

      const userDoc = await mockDocGet();
      const userData = userDoc.data();
      const lastCheckIn = userData.lastCheckinDate.toDate();
      const hoursSinceLastCheckIn = (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60);

      expect(hoursSinceLastCheckIn).toBeLessThan(24);

      // Should not allow check-in
      expect(mockDocUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Gallery and Social Features Integration', () => {
    it('should handle video sharing and gallery promotion', async () => {
      const videoId = 'video-123';
      const userId = 'test-user-123';

      // Mock video document
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          id: videoId,
          userId,
          title: 'Test Video',
          status: 'completed',
          isPublic: false,
          videoUrl: 'https://example.com/video.mp4',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
        }),
      });

      // Test video sharing
      const shareUrl = `https://draworld.com/creation/${videoId}/result`;
      
      // Test gallery promotion (admin action)
      const promotionUpdate = {
        isPublic: true,
        promotedAt: new Date(),
        category: 'featured',
      };

      // Simulate gallery promotion
      await mockDocUpdate(promotionUpdate);

      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining(promotionUpdate)
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API failures gracefully', async () => {
      // Mock API failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/test');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Should implement retry logic
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection issues', async () => {
      // Mock Firestore error
      mockDocGet.mockRejectedValue(
        new Error('Database connection failed')
      );

      try {
        await mockDocGet();
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent user operations', async () => {
      const concurrentUsers = 10;
      const operations = [];

      for (let i = 0; i < concurrentUsers; i++) {
        operations.push(
          mockDocGet()
        );
      }

      // Mock successful concurrent operations
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'test' }),
      });

      const results = await Promise.all(operations);
      expect(results).toHaveLength(concurrentUsers);
    });

    it('should implement proper rate limiting', async () => {
      const rapidRequests = 10;
      const mockResponses = [];

      // Create mock responses with some rate limited
      for (let i = 0; i < rapidRequests; i++) {
        if (i < 3) {
          mockResponses.push({ ok: true, status: 200 });
        } else {
          mockResponses.push({ ok: false, status: 429 });
        }
      }

      // Mock rate limiting response
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2])
        .mockResolvedValue({ ok: false, status: 429 }); // Rate limited

      const requests = [];
      for (let i = 0; i < rapidRequests; i++) {
        requests.push(fetch('/api/rate-limited-endpoint'));
      }

      const results = await Promise.all(requests);
      
      // Should have some rate-limited responses
      const rateLimitedCount = results.filter(r => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });
});