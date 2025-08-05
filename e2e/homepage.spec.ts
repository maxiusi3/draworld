import { test, expect } from '@playwright/test';

test.describe('首页测试', () => {
  test('应该正确加载首页', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/童画奇旅/);
    
    // 检查主要元素是否存在
    await expect(page.getByText('童画奇旅')).toBeVisible();
    await expect(page.getByText('将儿童绘画转化为生动动画')).toBeVisible();
  });

  test('导航菜单应该正常工作', async ({ page }) => {
    await page.goto('/');
    
    // 检查登录链接
    const loginLink = page.getByRole('link', { name: '登录' });
    await expect(loginLink).toBeVisible();
    
    // 检查注册链接
    const registerLink = page.getByRole('link', { name: '注册' });
    await expect(registerLink).toBeVisible();
  });

  test('响应式设计应该正常工作', async ({ page }) => {
    // 测试桌面视图
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.getByText('童画奇旅')).toBeVisible();
    
    // 测试移动视图
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('童画奇旅')).toBeVisible();
  });

  test('页面性能应该良好', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面加载时间应该少于5秒
    expect(loadTime).toBeLessThan(5000);
  });
});
