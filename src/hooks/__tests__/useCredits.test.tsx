import { renderHook, act, waitFor } from '@testing-library/react'
import { useCredits } from '../useCredits'

// Mock the CreditService
const mockDailyCheckIn = jest.fn()
const mockSpendCredits = jest.fn()
const mockGetCreditHistory = jest.fn()

jest.mock('@/services/creditService', () => ({
  CreditService: {
    dailyCheckIn: mockDailyCheckIn,
    spendCredits: mockSpendCredits,
    getCreditHistory: mockGetCreditHistory,
    canPerformDailyCheckIn: jest.fn((lastCheckIn) => {
      if (!lastCheckIn) return true
      const now = new Date()
      const timeDiff = now.getTime() - lastCheckIn.getTime()
      return timeDiff >= 24 * 60 * 60 * 1000
    }),
    getNextCheckinTime: jest.fn((lastCheckIn) => {
      if (!lastCheckIn) return null
      return new Date(lastCheckIn.getTime() + 24 * 60 * 60 * 1000)
    }),
  },
}))

// Mock the UserContext
const mockRefreshUser = jest.fn()
const mockUser = {
  id: 'test-user',
  credits: 150,
  lastCheckinDate: null,
}

jest.mock('@/contexts/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    refreshUser: mockRefreshUser,
  }),
}))

describe('useCredits Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with user credit data', () => {
    const { result } = renderHook(() => useCredits())
    
    expect(result.current.credits).toBe(150)
    expect(result.current.canCheckIn).toBe(true)
  })

  it('handles daily check-in successfully', async () => {
    mockDailyCheckIn.mockResolvedValue({
      success: true,
      creditsEarned: 15,
      newBalance: 165,
    })

    const { result } = renderHook(() => useCredits())
    
    await act(async () => {
      await result.current.performDailyCheckIn()
    })

    expect(mockDailyCheckIn).toHaveBeenCalled()
    expect(mockRefreshUser).toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('handles daily check-in error', async () => {
    mockDailyCheckIn.mockRejectedValue(new Error('Check-in failed'))

    const { result } = renderHook(() => useCredits())
    
    await act(async () => {
      await result.current.performDailyCheckIn()
    })

    expect(result.current.error).toBe('Check-in failed')
    expect(result.current.loading).toBe(false)
  })

  it('handles spending credits successfully', async () => {
    mockSpendCredits.mockResolvedValue({
      success: true,
      creditsSpent: 60,
      newBalance: 90,
    })

    const { result } = renderHook(() => useCredits())
    
    await act(async () => {
      const success = await result.current.spendCredits(60, 'Video generation', 'video_generation')
      expect(success).toBe(true)
    })

    expect(mockSpendCredits).toHaveBeenCalledWith(60, 'Video generation', 'video_generation', undefined)
    expect(mockRefreshUser).toHaveBeenCalled()
  })

  it('handles spending credits error', async () => {
    mockSpendCredits.mockRejectedValue(new Error('Insufficient credits'))

    const { result } = renderHook(() => useCredits())
    
    await act(async () => {
      const success = await result.current.spendCredits(200, 'Video generation', 'video_generation')
      expect(success).toBe(false)
    })

    expect(result.current.error).toBe('Insufficient credits')
  })

  it('loads credit history successfully', async () => {
    const mockHistory = {
      transactions: [
        {
          id: '1',
          type: 'earned',
          amount: 150,
          description: 'Welcome bonus',
          createdAt: new Date(),
        },
      ],
      hasMore: false,
      lastDoc: null,
    }

    mockGetCreditHistory.mockResolvedValue(mockHistory)

    const { result } = renderHook(() => useCredits())
    
    await act(async () => {
      await result.current.loadCreditHistory()
    })

    expect(result.current.creditHistory).toEqual(mockHistory.transactions)
    expect(result.current.hasMoreHistory).toBe(false)
  })

  it('handles credit history loading error', async () => {
    mockGetCreditHistory.mockRejectedValue(new Error('Failed to load history'))

    const { result } = renderHook(() => useCredits())
    
    await act(async () => {
      await result.current.loadCreditHistory()
    })

    expect(result.current.error).toBe('Failed to load history')
  })

  it('calculates next check-in time correctly', () => {
    const lastCheckIn = new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    mockUser.lastCheckinDate = lastCheckIn

    const { result } = renderHook(() => useCredits())
    
    expect(result.current.canCheckIn).toBe(false)
    expect(result.current.nextCheckinTime).toBeInstanceOf(Date)
  })

  it('clears error when performing new operations', async () => {
    mockDailyCheckIn.mockRejectedValue(new Error('First error'))

    const { result } = renderHook(() => useCredits())
    
    // First operation fails
    await act(async () => {
      await result.current.performDailyCheckIn()
    })
    expect(result.current.error).toBe('First error')

    // Second operation should clear error
    mockDailyCheckIn.mockResolvedValue({
      success: true,
      creditsEarned: 15,
      newBalance: 165,
    })

    await act(async () => {
      await result.current.performDailyCheckIn()
    })
    expect(result.current.error).toBeNull()
  })

  it('handles loading more credit history', async () => {
    const initialHistory = {
      transactions: [{ id: '1', type: 'earned', amount: 150 }],
      hasMore: true,
      lastDoc: 'doc1',
    }

    const moreHistory = {
      transactions: [{ id: '2', type: 'spent', amount: -60 }],
      hasMore: false,
      lastDoc: null,
    }

    mockGetCreditHistory
      .mockResolvedValueOnce(initialHistory)
      .mockResolvedValueOnce(moreHistory)

    const { result } = renderHook(() => useCredits())
    
    // Load initial history
    await act(async () => {
      await result.current.loadCreditHistory()
    })
    expect(result.current.creditHistory).toHaveLength(1)
    expect(result.current.hasMoreHistory).toBe(true)

    // Load more history
    await act(async () => {
      await result.current.loadMoreHistory()
    })
    expect(result.current.creditHistory).toHaveLength(2)
    expect(result.current.hasMoreHistory).toBe(false)
  })
})