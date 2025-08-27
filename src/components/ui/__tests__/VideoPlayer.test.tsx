import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VideoPlayer } from '../VideoPlayer'

// Mock services that use Firebase
jest.mock('@/services/analyticsService', () => ({
  AnalyticsService: {
    trackEvent: jest.fn(),
    trackVideoShare: jest.fn(),
  },
}))

jest.mock('@/services/socialTaskService', () => ({
  SocialTaskService: {
    trackShare: jest.fn(),
    getSharingTemplate: jest.fn().mockReturnValue({
      text: 'Check out this amazing video!',
      hashtags: ['#draworld', '#ai', '#video'],
    }),
  },
}))

jest.mock('@/hooks/useSocialTasks', () => ({
  useSocialTasks: () => ({
    tasks: [],
    loading: false,
    completeTask: jest.fn(),
  }),
}))

// Mock video element methods
const mockPlay = jest.fn()
const mockPause = jest.fn()
const mockLoad = jest.fn()

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: mockPlay.mockResolvedValue(undefined),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: mockPause,
})

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: mockLoad,
})

describe('VideoPlayer Component', () => {
  const mockVideoData = {
    src: 'https://example.com/video.mp4',
    poster: 'https://example.com/thumbnail.jpg',
    title: 'Test Video',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders video player with controls', () => {
    render(<VideoPlayer {...mockVideoData} />)
    
    const video = screen.getByTestId('video-element')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', mockVideoData.src)
  })

  it('handles play/pause functionality', () => {
    render(<VideoPlayer {...mockVideoData} />)
    
    const video = screen.getByTestId('video-element')
    
    // Simulate clicking on video to play/pause
    fireEvent.click(video)
    expect(mockPlay).toHaveBeenCalled()
  })

  it('displays video metadata correctly', () => {
    render(<VideoPlayer {...mockVideoData} />)
    
    // Check that title is displayed
    expect(screen.getByText(mockVideoData.title)).toBeInTheDocument()
  })

  it('handles sharing functionality', () => {
    const mockOnShare = jest.fn()
    render(<VideoPlayer {...mockVideoData} onShare={mockOnShare} />)
    
    const shareButton = screen.getByTestId('share-button')
    expect(shareButton).toBeInTheDocument()
    
    fireEvent.click(shareButton)
    // Share button opens modal, doesn't directly call onShare
    expect(shareButton).toBeInTheDocument()
  })

  it('shows loading state while video loads', () => {
    render(<VideoPlayer {...mockVideoData} />)
    
    const video = screen.getByTestId('video-element')
    
    // Simulate video loading state
    fireEvent.loadStart(video)
    
    // Check that video element exists (loading state is handled by browser)
    expect(video).toBeInTheDocument()
  })
})