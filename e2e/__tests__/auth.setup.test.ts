// src/e2e/__tests__/auth.setup.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Login and save session', async ({ page }) => {
  await page.goto('/auth/login'); // Replace with your login page

  await page.fill('input[name="email"]', 'abdullahseller@gmail.com');
  await page.fill('input[name="password"]', 'Adoo1234567890');
  await page.click('button[type="submit"]');

  // Wait for some element that appears only after successful login
  await page.waitForURL('**/dashboard'); // Or something like:

  // Save session to file
  await page.context().storageState({ path: 'storageState.json' });
});
