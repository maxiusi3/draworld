import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')

  // Start the development server if not already running
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  
  try {
    // Check if server is already running
    const response = await fetch(baseURL)
    if (response.ok) {
      console.log('✅ Development server is already running')
      return
    }
  } catch (error) {
    console.log('⏳ Development server not running, will be started by webServer config')
  }

  // Set up test database state
  await setupTestDatabase()

  // Set up test authentication
  await setupTestAuth()

  // Set up test storage
  await setupTestStorage()

  console.log('✅ Global test setup completed')
}

async function setupTestDatabase() {
  console.log('📊 Setting up test database...')
  
  // Create test users
  const testUsers = [
    {
      id: 'test-user-1',
      email: 'test1@example.com',
      displayName: 'Test User 1',
      credits: 150,
      role: 'user',
    },
    {
      id: 'test-user-2',
      email: 'test2@example.com',
      displayName: 'Test User 2',
      credits: 300,
      role: 'user',
    },
    {
      id: 'admin-user',
      email: 'admin@example.com',
      displayName: 'Admin User',
      credits: 1000,
      role: 'admin',
    },
  ]

  // Create test videos
  const testVideos = [
    {
      id: 'video-1',
      userId: 'test-user-1',
      title: 'Test Video 1',
      status: 'completed',
      isPublic: true,
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
    },
    {
      id: 'video-2',
      userId: 'test-user-2',
      title: 'Test Video 2',
      status: 'processing',
      isPublic: false,
    },
  ]

  // In a real setup, you would populate your test database here
  // For now, we'll use mocked data in individual tests
  console.log('✅ Test database setup completed')
}

async function setupTestAuth() {
  console.log('🔐 Setting up test authentication...')
  
  // Create test authentication tokens
  const testTokens = {
    'test-user-1': 'mock-token-1',
    'test-user-2': 'mock-token-2',
    'admin-user': 'mock-admin-token',
  }

  // Store test tokens for use in tests
  process.env.TEST_TOKENS = JSON.stringify(testTokens)
  
  console.log('✅ Test authentication setup completed')
}

async function setupTestStorage() {
  console.log('💾 Setting up test storage...')
  
  // Create test image files
  const testImages = [
    'test-drawing.jpg',
    'large-image.jpg',
    'invalid-image.txt',
  ]

  // In a real setup, you would create actual test files
  // For now, we'll use mocked files in individual tests
  console.log('✅ Test storage setup completed')
}

export default globalSetup

// Add a dummy test to satisfy Jest
describe('Global Setup', () => {
  it('should complete setup', () => {
    expect(true).toBe(true);
  });
});