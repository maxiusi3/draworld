import { renderHook, act, waitFor } from '@testing-library/react'
import { useVideoGeneration } from '../useVideoGeneration'

// Mock functions need to be declared before jest.mock calls
const mockGenerateVideo = jest.fn()
const mockGetVideoStatus = jest.fn()
const mockGetUserVideos = jest.fn()
const mockSpendCredits = jest.fn()

// Mock the VideoService
jest.mock('@/services/videoService', () => ({
  VideoService: {
    generateVideo: mockGenerateVideo,
    getVideoStatus: mockGetVideoStatus,
    getUserVideos: mockGetUserVideos,
  },
}))

// Mock the useCredits hook
jest.mock('../useCredits', () => ({
  useCredits: () => ({
    spendCredits: mockSpendCredits,
    credits: 150,
  }),
}))

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
  }),
}))

describe('useVideoGeneration Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useVideoGeneration())
    
    expect(result.current.isGenerating).toBe(false)
    expect(result.current.generationProgress).toBe(0)
    expect(result.current.currentVideo).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('handles video generation successfully', async () => {
    const mockVideoData = {
      id: 'video-123',
      status: 'pending',
      title: 'Test Video',
    }

    mockSpendCredits.mockResolvedValue(true)
    mockGenerateVideo.mockResolvedValue(mockVideoData)

    const { result } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    expect(mockSpendCredits).toHaveBeenCalledWith(60, 'Video generation', 'video_generation', undefined)
    expect(mockGenerateVideo).toHaveBeenCalledWith(generationData)
    expect(result.current.currentVideo).toEqual(mockVideoData)
    expect(result.current.isGenerating).toBe(false)
  })

  it('handles insufficient credits', async () => {
    mockSpendCredits.mockResolvedValue(false)

    const { result } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    expect(mockGenerateVideo).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Insufficient credits for video generation')
  })

  it('handles video generation error', async () => {
    mockSpendCredits.mockResolvedValue(true)
    mockGenerateVideo.mockRejectedValue(new Error('Generation failed'))

    const { result } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    expect(result.current.error).toBe('Generation failed')
    expect(result.current.isGenerating).toBe(false)
  })

  it('polls video status during generation', async () => {
    const mockVideoData = {
      id: 'video-123',
      status: 'processing',
      title: 'Test Video',
    }

    const completedVideoData = {
      ...mockVideoData,
      status: 'completed',
      videoUrl: 'https://example.com/video.mp4',
    }

    mockSpendCredits.mockResolvedValue(true)
    mockGenerateVideo.mockResolvedValue(mockVideoData)
    mockGetVideoStatus
      .mockResolvedValueOnce({ ...mockVideoData, status: 'processing' })
      .mockResolvedValueOnce(completedVideoData)

    const { result } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    // Wait for polling to complete
    await waitFor(() => {
      expect(result.current.currentVideo?.status).toBe('completed')
    }, { timeout: 5000 })

    expect(mockGetVideoStatus).toHaveBeenCalledWith('video-123')
    expect(result.current.currentVideo?.videoUrl).toBe('https://example.com/video.mp4')
  })

  it('handles status polling error', async () => {
    const mockVideoData = {
      id: 'video-123',
      status: 'processing',
      title: 'Test Video',
    }

    mockSpendCredits.mockResolvedValue(true)
    mockGenerateVideo.mockResolvedValue(mockVideoData)
    mockGetVideoStatus.mockRejectedValue(new Error('Status check failed'))

    const { result } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Status check failed')
    })
  })

  it('updates generation progress during processing', async () => {
    const mockVideoData = {
      id: 'video-123',
      status: 'processing',
      title: 'Test Video',
    }

    mockSpendCredits.mockResolvedValue(true)
    mockGenerateVideo.mockResolvedValue(mockVideoData)
    mockGetVideoStatus.mockResolvedValue({
      ...mockVideoData,
      progress: 75,
    })

    const { result } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    await waitFor(() => {
      expect(result.current.generationProgress).toBe(75)
    })
  })

  it('loads user videos successfully', async () => {
    const mockVideos = [
      { id: 'video-1', title: 'Video 1', status: 'completed' },
      { id: 'video-2', title: 'Video 2', status: 'processing' },
    ]

    mockGetUserVideos.mockResolvedValue({
      videos: mockVideos,
      hasMore: false,
      lastDoc: null,
    })

    const { result } = renderHook(() => useVideoGeneration())
    
    await act(async () => {
      await result.current.loadUserVideos()
    })

    expect(result.current.userVideos).toEqual(mockVideos)
    expect(result.current.hasMoreVideos).toBe(false)
  })

  it('handles loading user videos error', async () => {
    mockGetUserVideos.mockRejectedValue(new Error('Failed to load videos'))

    const { result } = renderHook(() => useVideoGeneration())
    
    await act(async () => {
      await result.current.loadUserVideos()
    })

    expect(result.current.error).toBe('Failed to load videos')
  })

  it('clears current video', () => {
    const { result } = renderHook(() => useVideoGeneration())
    
    // Set a current video first
    act(() => {
      result.current.currentVideo = {
        id: 'video-123',
        status: 'completed',
        title: 'Test Video',
      }
    })

    act(() => {
      result.current.clearCurrentVideo()
    })

    expect(result.current.currentVideo).toBeNull()
    expect(result.current.generationProgress).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('stops polling when component unmounts', async () => {
    const mockVideoData = {
      id: 'video-123',
      status: 'processing',
      title: 'Test Video',
    }

    mockSpendCredits.mockResolvedValue(true)
    mockGenerateVideo.mockResolvedValue(mockVideoData)
    mockGetVideoStatus.mockResolvedValue(mockVideoData)

    const { result, unmount } = renderHook(() => useVideoGeneration())
    
    const generationData = {
      croppedImageUrl: 'https://example.com/image.jpg',
      prompt: 'A magical dragon flying',
      mood: 'epic' as const,
      title: 'Test Video',
    }

    await act(async () => {
      await result.current.generateVideo(generationData)
    })

    // Unmount the hook
    unmount()

    // Wait a bit to ensure polling would have occurred
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Polling should have stopped, so status check calls should be minimal
    expect(mockGetVideoStatus).toHaveBeenCalledTimes(1)
  })
})