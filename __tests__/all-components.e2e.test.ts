import { test, expect } from '@playwright/test';

// This test will visit the /all-components page and check for any visible errors in the UI or console

test('all-components page renders without runtime errors', async ({ page }) => {
  // Listen for console errors
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:3000/all-components');

  // Wait for the main heading to appear
  await expect(page.getByRole('heading', { name: /all components/i })).toBeVisible();

  // Optionally, check for any error boundaries or error messages in the DOM
  const errorBoundary = await page.locator('text=Something went wrong').count();
  expect(errorBoundary).toBe(0);

  // Fail if any console errors were captured
  expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
});
