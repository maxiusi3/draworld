import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProvider } from '@/contexts/UserContext'

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Test providers wrapper
interface ProvidersProps {
  children: React.ReactNode
}

const AllProviders: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </AuthProvider>
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  credits: 150,
  createdAt: new Date(),
  updatedAt: new Date(),
  referralCode: 'ABC123',
  isFirstVideoGenerated: false,
  ...overrides,
})

export const createMockVideo = (overrides = {}) => ({
  id: 'video-123',
  userId: 'test-user-123',
  title: 'Test Video',
  prompt: 'A magical adventure',
  mood: 'joyful' as const,
  originalImageUrl: 'https://example.com/original.jpg',
  croppedImageUrl: 'https://example.com/cropped.jpg',
  videoUrl: 'https://example.com/video.mp4',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  status: 'completed' as const,
  isPublic: false,
  views: 0,
  shares: 0,
  likes: 0,
  duration: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockCreditTransaction = (overrides = {}) => ({
  id: 'tx-123',
  userId: 'test-user-123',
  type: 'earned' as const,
  amount: 15,
  description: 'Daily check-in bonus',
  source: 'checkin' as const,
  createdAt: new Date(),
  ...overrides,
})

export const createMockPayment = (overrides = {}) => ({
  id: 'payment-123',
  userId: 'test-user-123',
  stripePaymentIntentId: 'pi_123',
  packageId: 'starter',
  amount: 199,
  credits: 100,
  bonusCredits: 0,
  status: 'succeeded' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock file creation helper
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Mock image URL creation
export const mockCreateObjectURL = () => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = jest.fn()
}

// Mock intersection observer
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  }
}

// Mock resize observer
export const mockResizeObserver = () => {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  }
}

// Mock media queries
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock local storage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
  return localStorageMock
}

// Mock fetch
export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock video element
export const mockVideoElement = () => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  })
  
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    writable: true,
    value: jest.fn(),
  })
  
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    writable: true,
    value: jest.fn(),
  })
}

// Mock canvas context
export const mockCanvasContext = () => {
  const mockContext = {
    drawImage: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
  }
  
  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext)
  return mockContext
}

// Test data generators
export const generateTestUsers = (count: number) => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: `user-${index}`,
      email: `user${index}@example.com`,
      displayName: `User ${index}`,
    })
  )
}

export const generateTestVideos = (count: number, userId = 'test-user-123') => {
  return Array.from({ length: count }, (_, index) =>
    createMockVideo({
      id: `video-${index}`,
      userId,
      title: `Video ${index}`,
    })
  )
}

// Performance testing helpers
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Error boundary for testing
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>
    }

    return this.props.children
  }
}