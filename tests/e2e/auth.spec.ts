import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should allow user to sign up with email', async ({ page }) => {
    // Navigate to signup page
    await page.click('text=Sign Up')
    await expect(page).toHaveURL('/signup')

    // Fill signup form
    await page.fill('[data-testid="display-name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'Password123!')
    await page.fill('[data-testid="confirm-password-input"]', 'Password123!')

    // Submit form
    await page.click('[data-testid="signup-button"]')

    // Should redirect to home page with welcome message
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="welcome-notification"]')).toBeVisible()
    await expect(page.locator('text=150')).toBeVisible() // Credit display
  })

  test('should allow user to login with email', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Log In')
    await expect(page).toHaveURL('/login')

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'existing@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')

    // Submit form
    await page.click('[data-testid="login-button"]')

    // Should redirect to home page
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle login errors gracefully', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')

    await page.click('[data-testid="login-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.fill('[data-testid="password-input"]', 'Password123!')
    await page.click('[data-testid="signup-button"]')

    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'weak')
    await page.click('[data-testid="signup-button"]')

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('should handle Google sign in', async ({ page }) => {
    await page.goto('/login')

    // Mock Google OAuth (in real tests, you'd use test accounts)
    await page.route('**/auth/google', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, user: { id: 'google-user' } })
      })
    })

    await page.click('[data-testid="google-signin-button"]')

    // Should redirect to home page
    await expect(page).toHaveURL('/')
  })

  test('should allow user to logout', async ({ page }) => {
    // Assume user is logged in
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token')
    })
    await page.reload()

    // Click user menu and logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign Out')

    // Should redirect to home page without user menu
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
    await expect(page.locator('text=Log In')).toBeVisible()
  })

  test('should handle referral signup', async ({ page }) => {
    // Navigate with referral code
    await page.goto('/signup?ref=ABC123')

    // Should show referral bonus message
    await expect(page.locator('text=You\'ve been invited')).toBeVisible()
    await expect(page.locator('text=50 bonus credits')).toBeVisible()

    // Complete signup
    await page.fill('[data-testid="display-name-input"]', 'Referred User')
    await page.fill('[data-testid="email-input"]', 'referred@example.com')
    await page.fill('[data-testid="password-input"]', 'Password123!')
    await page.fill('[data-testid="confirm-password-input"]', 'Password123!')

    await page.click('[data-testid="signup-button"]')

    // Should show total credits including referral bonus
    await expect(page.locator('text=200')).toBeVisible() // 150 + 50 bonus
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/account/profile')

    // Should redirect to login
    await expect(page).toHaveURL('/login?redirect=/account/profile')

    // Login
    await page.fill('[data-testid="email-input"]', 'user@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Should redirect to intended page
    await expect(page).toHaveURL('/account/profile')
  })
})