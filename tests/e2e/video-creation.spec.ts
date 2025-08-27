import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Video Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token')
    })
    await page.goto('/create')
  })

  test('should display image upload interface', async ({ page }) => {
    await expect(page.locator('[data-testid="image-uploader"]')).toBeVisible()
    await expect(page.locator('text=Upload Your Drawing')).toBeVisible()
  })

  test('should upload and crop image', async ({ page }) => {
    // Mock file upload
    const fileInput = page.locator('input[type="file"]')
    const testImage = path.join(__dirname, '../fixtures/test-image.jpg')
    
    await fileInput.setInputFiles(testImage)
    
    // Wait for cropper to appear
    await expect(page.locator('[data-testid="image-cropper"]')).toBeVisible()
    
    // Confirm crop
    await page.click('button:has-text("Confirm Crop")')
    
    await expect(page.locator('[data-testid="cropped-image"]')).toBeVisible()
  })

  test('should enter prompt and select mood', async ({ page }) => {
    // Skip to prompt step (mock image upload)
    await page.evaluate(() => {
      window.mockImageUploaded = true
    })
    await page.reload()
    
    // Enter prompt
    const promptInput = page.locator('textarea[placeholder*="describe"]')
    await promptInput.fill('A magical forest with dancing trees')
    
    // Select mood
    await page.click('[data-testid="mood-peaceful"]')
    
    await expect(page.locator('button:has-text("Generate Video")')).toBeEnabled()
  })

  test('should show generation progress', async ({ page }) => {
    // Mock complete form state
    await page.evaluate(() => {
      window.mockFormComplete = true
    })
    await page.reload()
    
    await page.click('button:has-text("Generate Video")')
    
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible()
    await expect(page.locator('text=Generating your animation')).toBeVisible()
  })

  test('should validate insufficient credits', async ({ page }) => {
    // Mock low credits
    await page.evaluate(() => {
      window.mockUserCredits = 30 // Less than required 60
    })
    await page.reload()
    
    await page.click('button:has-text("Generate Video")')
    
    await expect(page.locator('[data-testid="insufficient-credits-modal"]')).toBeVisible()
    await expect(page.locator('text=Not enough credits')).toBeVisible()
  })

  test('should display video result', async ({ page }) => {
    // Mock successful generation
    await page.evaluate(() => {
      window.mockVideoGenerated = {
        id: 'test-video-id',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg'
      }
    })
    await page.goto('/creation/test-video-id/result')
    
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible()
    await expect(page.locator('button:has-text("Share")')).toBeVisible()
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
  })
})

test.describe('Gallery Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token')
    })
  })

  test('should save to personal gallery', async ({ page }) => {
    await page.goto('/creation/test-video-id/result')
    
    await page.click('button:has-text("Save to Gallery")')
    
    await expect(page.locator('text=Saved to your gallery')).toBeVisible()
  })

  test('should navigate to personal gallery', async ({ page }) => {
    await page.goto('/account/creations')
    
    await expect(page.locator('h1:has-text("My Creations")')).toBeVisible()
    await expect(page.locator('[data-testid="creation-grid"]')).toBeVisible()
  })

  test('should share video', async ({ page }) => {
    await page.goto('/creation/test-video-id/result')
    
    await page.click('button:has-text("Share")')
    
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible()
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible()
  })
})