import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Video Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token')
      localStorage.setItem('user-data', JSON.stringify({
        id: 'test-user',
        credits: 150,
        displayName: 'Test User'
      }))
    })
  })

  test('should complete full video creation flow', async ({ page }) => {
    // Navigate to create page
    await page.goto('/create')
    await expect(page).toHaveURL('/create')

    // Step 1: Upload image
    const fileInput = page.locator('[data-testid="file-input"]')
    const testImagePath = path.join(__dirname, '../fixtures/test-drawing.jpg')
    await fileInput.setInputFiles(testImagePath)
    
    // Wait for image preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible()
    
    await page.click('[data-testid="continue-button"]')

    // Step 2: Crop image
    await expect(page.locator('[data-testid="crop-area"]')).toBeVisible()
    
    // Simulate drag to crop (mock crop area)
    const cropArea = page.locator('[data-testid="crop-area"]')
    await cropArea.hover()
    await page.mouse.down()
    await page.mouse.move(100, 100)
    await page.mouse.up()
    
    // Confirm crop
    await page.click('[data-testid="confirm-crop-button"]')

    // Step 3: Add prompt and mood
    await page.fill('[data-testid="prompt-input"]', 'A magical adventure')
    
    // Select mood
    await page.click('[data-testid="mood-joyful"]')
    
    // Add title
    await page.fill('[data-testid="title-input"]', 'My Adventure')

    // Generate video
    await page.click('[data-testid="generate-button"]')

    // Should show generation progress
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible()

    // Mock video generation completion
    await page.route('**/api/video/status/*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'completed',
          videoUrl: 'https://example.com/video.mp4',
          thumbnailUrl: 'https://example.com/thumbnail.jpg'
        })
      })
    })

    // Wait for completion
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 10000 })
    
    // Should show video controls
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="share-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible()
  })

  test('should handle insufficient credits', async ({ page }) => {
    // Set low credits
    await page.evaluate(() => {
      localStorage.setItem('user-data', JSON.stringify({
        id: 'test-user',
        credits: 30, // Less than 60 required
        displayName: 'Test User'
      }))
    })

    await page.goto('/create')

    const fileInput = page.locator('[data-testid="file-input"]')
    const testImagePath = path.join(__dirname, '../fixtures/test-drawing.jpg')
    await fileInput.setInputFiles(testImagePath)
    await page.click('[data-testid="continue-button"]')
    await page.click('[data-testid="confirm-crop-button"]')

    // Fill prompt
    await page.fill('[data-testid="prompt-input"]', 'A magical scene')
    await page.click('[data-testid="mood-joyful"]')

    await page.click('[data-testid="generate-button"]')

    // Should show insufficient credits modal
    await expect(page.locator('[data-testid="insufficient-credits-modal"]')).toBeVisible()
    await expect(page.locator('text=You need 60 credits')).toBeVisible()
    
    // Should show options to earn more credits
    await expect(page.locator('[data-testid="daily-check-status-button"]')).toBeVisible()
  })

  test('should handle long-running video generation', async ({ page }) => {
    await page.goto('/create')

    // Mock long generation
    await page.route('**/api/video/generate', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'generation-id',
          status: 'processing'
        })
      })
    })

    // Complete form
    const fileInput = page.locator('[data-testid="file-input"]')
    const testImagePath = path.join(__dirname, '../fixtures/test-drawing.jpg')
    await fileInput.setInputFiles(testImagePath)
    await page.click('[data-testid="continue-button"]')
    await page.click('[data-testid="confirm-crop-button"]')
    
    await page.fill('[data-testid="prompt-input"]', 'A magical adventure')
    await page.click('[data-testid="mood-joyful"]')
    await page.click('[data-testid="generate-button"]')

    // Should show progress
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible()
    
    // After timeout, should show message
    await expect(page.locator('text=Generation is taking longer than expected')).toBeVisible({ timeout: 65000 })
  })

  test('should use prompt templates', async ({ page }) => {
    await page.goto('/create')

    // Complete image upload and crop
    const fileInput = page.locator('[data-testid="file-input"]')
    const testImagePath = path.join(__dirname, '../fixtures/test-drawing.jpg')
    await fileInput.setInputFiles(testImagePath)
    await page.click('[data-testid="continue-button"]')
    await page.click('[data-testid="confirm-crop-button"]')

    // Should be able to pick prompt template
    await page.click('[data-testid="template-magical-adventure"]')
    
    const promptInput = page.locator('[data-testid="prompt-input"]')
    await expect(promptInput).toHaveValue(/magical adventure/i)
  })

  test('should handle content moderation rejection', async ({ page }) => {
    await page.goto('/create')

    // Mock content moderation failure
    await page.route('**/api/video/generate', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'Content moderation failed',
          message: 'Image contains inappropriate content'
        })
      })
    })

    const fileInput = page.locator('[data-testid="file-input"]')
    const testImagePath = path.join(__dirname, '../fixtures/test-drawing.jpg')
    await fileInput.setInputFiles(testImagePath)
    await page.click('[data-testid="continue-button"]')
    await page.click('[data-testid="confirm-crop-button"]')

    await page.fill('[data-testid="prompt-input"]', 'Inappropriate content')
    await page.click('[data-testid="mood-epic"]')
    await page.click('[data-testid="generate-button"]')

    // Should show moderation error
    await expect(page.locator('text=Image contains inappropriate content')).toBeVisible()
  })

  test('should handle invalid file types', async ({ page }) => {
    await page.goto('/create')

    const fileInput = page.locator('[data-testid="file-input"]')
    const textFilePath = path.join(__dirname, '../fixtures/test.txt')
    await fileInput.setInputFiles(textFilePath)

    await expect(page.locator('text=Please upload a JPEG or PNG image')).toBeVisible()
  })

  test('should handle file too large', async ({ page }) => {
    await page.goto('/create')

    // Mock large file upload
    await page.route('**/upload', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'File size must be less than 10MB'
        })
      })
    })

    const fileInput = page.locator('[data-testid="file-input"]')
    const largeImagePath = path.join(__dirname, '../fixtures/large-image.jpg')
    await fileInput.setInputFiles(largeImagePath)

    await expect(page.locator('text=File size must be less than 10MB')).toBeVisible()
  })
})