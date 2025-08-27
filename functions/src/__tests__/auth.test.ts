import * as admin from 'firebase-admin'
import * as test from 'firebase-functions-test'
import { onUserCreate, onUserDelete, updateUserProfile, getUserData } from '../auth'

// Initialize Firebase Functions test environment
const testEnv = test()

// Mock Firestore
const mockSet = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockGet = jest.fn()
const mockAdd = jest.fn()
const mockWhere = jest.fn()
const mockBatch = jest.fn()
const mockCommit = jest.fn()

jest.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: mockSet,
        update: mockUpdate,
        delete: mockDelete,
        get: mockGet,
      })),
      add: mockAdd,
      where: mockWhere,
      get: mockGet,
    })),
    batch: () => ({
      set: mockSet,
      update: mockUpdate,
      delete: mockDelete,
      commit: mockCommit,
    }),
    FieldValue: {
      serverTimestamp: () => 'server-timestamp',
      increment: (value: number) => `increment-${value}`,
    },
  }),
}))

describe('Auth Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    testEnv.cleanup()
  })

  describe('onUserCreate', () => {
    it('should create user document with initial credits', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      }

      mockSet.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(onUserCreate)
      await wrapped(mockUser)

      expect(mockSet).toHaveBeenCalledWith({
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        credits: 150, // SIGNUP_BONUS
        createdAt: 'server-timestamp',
        updatedAt: 'server-timestamp',
        referralCode: expect.any(String),
        isFirstVideoGenerated: false,
      })
    })

    it('should create signup bonus transaction', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      }

      mockSet.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(onUserCreate)
      await wrapped(mockUser)

      expect(mockSet).toHaveBeenCalledWith({
        userId: 'test-user-123',
        type: 'earned',
        amount: 150,
        description: 'Welcome bonus for new account',
        source: 'signup',
        createdAt: 'server-timestamp',
      })
    })

    it('should handle missing display name', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: null,
      }

      mockSet.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(onUserCreate)
      await wrapped(mockUser)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'User',
        })
      )
    })

    it('should handle errors gracefully', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      }

      mockSet.mockRejectedValue(new Error('Database error'))

      const wrapped = testEnv.wrap(onUserCreate)
      
      // Should not throw error
      await expect(wrapped(mockUser)).resolves.toBeUndefined()
    })
  })

  describe('onUserDelete', () => {
    it('should delete user document and related data', async () => {
      const mockUser = {
        uid: 'test-user-123',
      }

      mockGet.mockResolvedValue({
        docs: [
          { ref: { delete: mockDelete } },
          { ref: { delete: mockDelete } },
        ],
      })
      mockCommit.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(onUserDelete)
      await wrapped(mockUser)

      expect(mockCommit).toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const mockUser = {
        uid: 'test-user-123',
      }

      mockGet.mockRejectedValue(new Error('Database error'))

      const wrapped = testEnv.wrap(onUserDelete)
      
      // Should not throw error
      await expect(wrapped(mockUser)).resolves.toBeUndefined()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockData = {
        displayName: 'Updated Name',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      mockUpdate.mockResolvedValue(undefined)

      const wrapped = testEnv.wrap(updateUserProfile)
      const result = await wrapped(mockData, mockContext)

      expect(mockUpdate).toHaveBeenCalledWith({
        displayName: 'Updated Name',
        updatedAt: 'server-timestamp',
      })
      expect(result).toEqual({ success: true })
    })

    it('should throw error when user is not authenticated', async () => {
      const mockData = {
        displayName: 'Updated Name',
      }

      const mockContext = {
        auth: null,
      }

      const wrapped = testEnv.wrap(updateUserProfile)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'User must be authenticated'
      )
    })

    it('should handle database errors', async () => {
      const mockData = {
        displayName: 'Updated Name',
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      mockUpdate.mockRejectedValue(new Error('Database error'))

      const wrapped = testEnv.wrap(updateUserProfile)
      
      await expect(wrapped(mockData, mockContext)).rejects.toThrow(
        'Failed to update profile'
      )
    })
  })

  describe('getUserData', () => {
    it('should return user data successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        credits: 150,
      }

      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      })

      const wrapped = testEnv.wrap(getUserData)
      const result = await wrapped({}, mockContext)

      expect(result).toEqual({
        id: 'test-user-123',
        ...mockUserData,
      })
    })

    it('should throw error when user is not authenticated', async () => {
      const mockContext = {
        auth: null,
      }

      const wrapped = testEnv.wrap(getUserData)
      
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

      const wrapped = testEnv.wrap(getUserData)
      
      await expect(wrapped({}, mockContext)).rejects.toThrow(
        'User not found'
      )
    })

    it('should handle database errors', async () => {
      const mockContext = {
        auth: {
          uid: 'test-user-123',
        },
      }

      mockGet.mockRejectedValue(new Error('Database error'))

      const wrapped = testEnv.wrap(getUserData)
      
      await expect(wrapped({}, mockContext)).rejects.toThrow(
        'Failed to get user data'
      )
    })
  })
})