import { test, expect } from '@playwright/test';

test('auth page has welcome back title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page.locator('h1')).toHaveText(/Welcome Back/);

  // Expect the email input to be visible
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Expect the password input to be visible
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
