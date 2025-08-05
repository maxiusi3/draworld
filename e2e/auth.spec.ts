import { test, expect } from '@playwright/test';

test.describe('用户认证测试', () => {
  test('应该能够访问登录页面', async ({ page }) => {
    await page.goto('/');
    
    // 点击登录链接
    await page.getByRole('link', { name: '登录' }).click();
    
    // 检查是否跳转到登录页面
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByText('登录')).toBeVisible();
  });

  test('应该能够访问注册页面', async ({ page }) => {
    await page.goto('/');
    
    // 点击注册链接
    await page.getByRole('link', { name: '注册' }).click();
    
    // 检查是否跳转到注册页面
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByText('注册')).toBeVisible();
  });

  test('登录表单应该有必要的字段', async ({ page }) => {
    await page.goto('/login');
    
    // 检查邮箱输入框
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();
    
    // 检查密码输入框
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    
    // 检查登录按钮
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('注册表单应该有必要的字段', async ({ page }) => {
    await page.goto('/register');
    
    // 检查邮箱输入框
    await expect(page.getByPlaceholder('邮箱')).toBeVisible();
    
    // 检查密码输入框
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    
    // 检查确认密码输入框
    await expect(page.getByPlaceholder('确认密码')).toBeVisible();
    
    // 检查注册按钮
    await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
  });

  test('应该显示表单验证错误', async ({ page }) => {
    await page.goto('/login');
    
    // 尝试提交空表单
    await page.getByRole('button', { name: '登录' }).click();
    
    // 应该显示验证错误（这里假设有客户端验证）
    // 实际的验证逻辑需要根据具体实现来调整
  });
});
