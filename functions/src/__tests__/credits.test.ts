import * as test from 'firebase-functions-test'
import { dailyCheckIn, spendCredits, awardCredits, getCreditHistory } from '../credits'

// Initialize Firebase Functions test environment
const testEnv = test()

// Mock Firestore
const mockSet = jest.fn()
const mockUpdate = jest.fn()
const mockGet = jest.fn()
const mockBatch = jest.fn()
const mockCommit = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockStartAfter = jest.fn()

jest.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: mockSet,
        update: mockUpdate,
        get: mockGet,
      })),
      where: mockWhere.mockReturnThis(),
      orderBy: mockOrderBy.mockReturnThis(),
      limit: mockLimit.mockReturnThis(),
      startAfter: mockStartAfter.mockReturnThis(),
      get: mockGet,
    })),
    batch: () => ({
      set: mockSet,
      update: mockUpdate,
      commit: mockCommit,
    }),
    FieldValue: {
      serverTimestamp: () => 'server-timestamp',
      increment: (value: number) => `increment-${value}`,
    },
  }),
}))

// Mock utils
jest.mock('../utils', () => ({
  CREDIT_AMOUNTS: {
    DAILY_CHECKIN: 15,
  },
  canPerformDailyCheckIn: jest.fn(),
  isValidCreditSource: jest.fn(() => true),
}))

describe('Credits Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    testEnv.cleanup()
  })

  describe('dailyCheckIn', () => {
    it('should perform daily check-in successfully', async () => {
      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const mockUserData = {
        credits: 100,
        lastCheckinDate: null,
      }

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      })

      const { canPerformDailyCheckIn } = require('../utils')
      canPerformDailyCheckIn.mockReturnValue(true)

      mockCommit.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(dailyCheckIn)
      const result = await wrapped({}, mockContext)

      expect(result).toEqual({
        success: true,
        creditsEarned: 15,
        newBalance: 115,
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        credits: 'increment-15',
        lastCheckinDate: 'server-timestamp',
        updatedAt: 'server-timestamp',
      })
    })

    it('should throw error when user is not authenticated', async () => {
      const mockContext = {
        auth: null,
      }

      const wrapped = testEnv.wrap(dailyCheckIn)
      
      await expect(wrapped({}, mockContext)).rejects.toThrow(
        'User must be authenticated'
      )
    })

    it('should throw error when user not found', async () => {
      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      mockGet.mockResolvedValue({
        exists: false,
      })

      const wrapped = testEnv.wrap(dailyCheckIn)
      
      await expect(wrapped({}, mockContext)).rejects.toThrow(
        'User not found'
      )
    })

    it('should throw error when check-in not available', async () => {
      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const mockUserData = {
        credits: 100,
        lastCheckinDate: { toDate: () => new Date() },
      }

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      })

      const { canPerformDailyCheckIn } = require('../utils')
      canPerformDailyCheckIn.mockReturnValue(false)

      const wrapped = testEnv.wrap(dailyCheckIn)
      
      await expect(wrapped({}, mockContext)).rejects.toThrow(
        'Next check-in available at'
      )
    })
  })

  describe('spendCredits', () => {
    it('should spend credits successfully', async () => {
      const mockData = {
        amount: 60,
        description: 'Video generation',
        source: 'video_generation',
        relatedId: 'video-123',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const mockUserData = {
        credits: 150,
      }

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      })

      mockCommit.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(spendCredits)
      const result = await wrapped(mockData, mockContext)

      expect(result).toEqual({
        success: true,
        creditsSpent: 60,
        newBalance: 90,
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        credits: 'increment--60',
        updatedAt: 'server-timestamp',
      })
    })

    it('should throw error when insufficient credits', async () => {
      const mockData = {
        amount: 200,
        description: 'Video generation',
        source: 'video_generation',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const mockUserData = {
        credits: 100,
      }

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      })

      const wrapped = testEnv.wrap(spendCredits)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'Insufficient credits'
      )
    })

    it('should throw error for invalid amount', async () => {
      const mockData = {
        amount: -10,
        description: 'Invalid amount',
        source: 'video_generation',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const wrapped = testEnv.wrap(spendCredits)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'Amount must be positive'
      )
    })

    it('should throw error for invalid source', async () => {
      const mockData = {
        amount: 60,
        description: 'Video generation',
        source: 'invalid_source',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const { isValidCreditSource } = require('../utils')
      isValidCreditSource.mockReturnValue(false)

      const wrapped = testEnv.wrap(spendCredits)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'Valid source is required'
      )
    })
  })

  describe('awardCredits', () => {
    it('should award credits successfully by admin', async () => {
      const mockData = {
        userId: 'target-user-123',
        amount: 100,
        description: 'Social media task completion',
        source: 'admin_award',
      }

      const mockContext = {
        auth: {
          uid: 'admin-user-123',
        },
      }

      // Mock admin user
      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ role: 'admin' }),
        })
        // Mock target user
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ credits: 50 }),
        })

      mockCommit.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(awardCredits)
      const result = await wrapped(mockData, mockContext)

      expect(result).toEqual({
        success: true,
        creditsAwarded: 100,
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        credits: 'increment-100',
        updatedAt: 'server-timestamp',
      })
    })

    it('should throw error when user is not admin', async () => {
      const mockData = {
        userId: 'target-user-123',
        amount: 100,
        description: 'Credits',
      }

      const mockContext = {
        auth: {
          uid: 'regular-user-123',
        },
      }

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: 'user' }),
      })

      const wrapped = testEnv.wrap(awardCredits)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'Only admins can award credits'
      )
    })

    it('should throw error when target user not found', async () => {
      const mockData = {
        userId: 'nonexistent-user',
        amount: 100,
        description: 'Credits',
      }

      const mockContext = {
        auth: {
          uid: 'admin-user-123',
        },
      }

      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ role: 'admin' }),
        })
        .mockResolvedValueOnce({
          exists: false,
        })

      const wrapped = testEnv.wrap(awardCredits)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'User not found'
      )
    })
  })

  describe('getCreditHistory', () => {
    it('should get credit history successfully', async () => {
      const mockData = {
        limit: 20,
        startAfter: 'doc-123',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'earned',
          amount: 15,
          description: 'Daily check-in',
        },
        {
          id: 'tx-2',
          type: 'spent',
          amount: -60,
          description: 'Video generation',
        },
      ]

      mockGet.mockResolvedValue({
        docs: mockTransactions.map((tx, index) => ({
          id: tx.id,
          data: () => tx,
        })),
      })

      const wrapped = testEnv.wrap(getCreditHistory)
      const result = await wrapped(mockData, mockContext)

      expect(result).toEqual({
        transactions: mockTransactions.map((tx, index) => ({
          id: tx.id,
          ...tx,
        })),
        hasMore: false,
        lastDoc: null,
      })
    })

    it('should use default limit when not provided', async () => {
      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      mockGet.mockResolvedValue({
        docs: [],
      })

      const wrapped = testEnv.wrap(getCreditHistory)
      await wrapped({}, mockContext)

      expect(mockLimit).toHaveBeenCalledWith(50)
    })

    it('should throw error when user is not authenticated', async () => {
      const mockContext = {
        auth: null,
      }

      const wrapped = testEnv.wrap(getCreditHistory)
      
      await expect(wrapped({}, mockContext)).rejects.toThrow(
        'User must be authenticated'
      )
    })
  })
})