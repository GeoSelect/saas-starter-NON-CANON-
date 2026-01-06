// C103 CSV Contact Upload E2E Tests — Playwright integration tests
// File: tests/e2e/c103-csv-contact-upload.spec.ts

import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: C103 CSV Contact Upload
 *
 * Scenarios:
 * 1. Free user blocked by C046 paywall (upgrade required)
 * 2. Pro user can upload CSV
 * 3. Upload with validation errors (partial success)
 * 4. Upload succeeds and contacts appear in list
 * 5. Audit trail recorded
 */

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('C103 CSV Contact Upload', () => {
  // ========================================================================
  // Test 1: Free User Blocked by C046 Paywall
  // ========================================================================

  test('free user should see upgrade prompt', async ({ page }) => {
    // Login as free user
    await page.goto(`${BASE_URL}/dashboard/contacts`);
    
    // Wait for login (assuming auth is handled)
    await page.fill('input[name="email"]', 'free@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/contacts');

    // Should see C046 UnlockDetails paywall
    await expect(page.locator('text=Upgrade to Import Contacts')).toBeVisible();
    await expect(page.locator('button:has-text("Upgrade Now")')).toBeVisible();

    // File input should not be visible
    await expect(page.locator('input[type="file"]')).not.toBeVisible();
  });

  // ========================================================================
  // Test 2: Pro User Can Access Upload
  // ========================================================================

  test('pro user should see CSV upload UI', async ({ page }) => {
    // Login as pro user
    await page.goto(`${BASE_URL}/dashboard/contacts`);
    
    await page.fill('input[name="email"]', 'pro@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/contacts');

    // Should see upload UI (not paywall)
    await expect(page.locator('text=Upload Contacts')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('button:has-text("Choose File")')).toBeVisible();
    await expect(page.locator('button:has-text("Upload")')).toBeVisible();
  });

  // ========================================================================
  // Test 3: Valid CSV Upload
  // ========================================================================

  test('should upload valid CSV and import contacts', async ({ page }) => {
    // Login as pro user
    await page.goto(`${BASE_URL}/dashboard/contacts`);
    
    await page.fill('input[name="email"]', 'pro@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/contacts');

    // Prepare test CSV file
    const csvContent = `email,name,phone,company
alice@example.com,Alice Johnson,555-1111,Acme Corp
bob@example.com,Bob Smith,555-2222,Widgets Inc
charlie@example.com,Charlie Brown,555-3333,Tech Solutions`;

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Check file appears in UI
    await expect(page.locator('text=contacts.csv')).toBeVisible();

    // Click upload button
    await page.click('button:has-text("Upload")');

    // Wait for results
    await page.waitForSelector('text=Upload successful');

    // Verify success message
    await expect(page.locator('text=Upload successful')).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible(); // Total rows
    await expect(page.locator('text=3').nth(1)).toBeVisible(); // Valid rows
    await expect(page.locator('text=0').last()).toBeVisible(); // Error rows
  });

  // ========================================================================
  // Test 4: Partial Success (CSV with Errors)
  // ========================================================================

  test('should handle CSV with validation errors', async ({ page }) => {
    // Login as pro user
    await page.goto(`${BASE_URL}/dashboard/contacts`);
    
    await page.fill('input[name="email"]', 'pro@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/contacts');

    // CSV with some invalid emails
    const csvContent = `email,name,phone
valid@example.com,Valid User,555-1111
invalid-email,Invalid User,555-2222
another@example.com,Another User,555-3333
missing-at-sign,No At Sign,555-4444`;

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Upload")');

    // Wait for results
    await page.waitForSelector('text=Upload completed with errors');

    // Verify partial success message
    await expect(page.locator('text=Upload completed with errors')).toBeVisible();
    await expect(page.locator('text=4')).toBeVisible(); // Total rows (excluding header)
    await expect(page.locator('text=2')).toBeVisible(); // Valid rows
    await expect(page.locator('text=2')).toBeVisible(); // Error rows

    // Verify error details visible
    await expect(page.locator('text=Line 2')).toBeVisible();
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  // ========================================================================
  // Test 5: File Size Limit Enforcement
  // ========================================================================

  test('should reject files larger than 10MB', async ({ page }) => {
    // Login as pro user
    await page.goto(`${BASE_URL}/dashboard/contacts`);
    
    await page.fill('input[name="email"]', 'pro@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/contacts');

    // Create a file larger than 10MB (simulated)
    const largeContent = new ArrayBuffer(11 * 1024 * 1024); // 11MB
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'large.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeContent),
    });

    // Should show error before upload
    // (This may be browser-side validation or server-side response)
    await page.click('button:has-text("Upload")');
    
    // Wait for error message
    await expect(page.locator('text=10 MB')).toBeVisible();
  });

  // ========================================================================
  // Test 6: Row Limit Enforcement by Tier
  // ========================================================================

  test('free user should have lower row limit', async ({ page }) => {
    // Login as free user (if upgrade prompt allows)
    // Generate CSV with 150 rows
    // Attempt upload
    // Should fail with row limit error

    // Note: This test requires creating 150+ contacts in CSV
    // For brevity, checking that error message appears
    
    const csvContent = `email,name\n`;
    for (let i = 0; i < 150; i++) {
      csvContent += `user${i}@example.com,User ${i}\n`;
    }

    // If free user can somehow access upload:
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'too-many.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Upload")');

    // Should show row limit error
    // (Free tier = 100 rows max)
    await expect(page.locator('text=100')).toBeVisible();
  });

  // ========================================================================
  // Test 7: Uploaded Contacts Appear in List
  // ========================================================================

  test('uploaded contacts should appear in contact list', async ({ page }) => {
    // Login as pro user
    await page.goto(`${BASE_URL}/dashboard/contacts`);
    
    await page.fill('input[name="email"]', 'pro@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/contacts');

    const csvContent = `email,name,company
newcontact@example.com,New Contact,New Company`;

    // Upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'new-contact.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Upload")');
    await page.waitForSelector('text=Upload successful');

    // Click "View Contacts" or refresh
    await page.click('button:has-text("Upload Another File")');
    
    // Navigate to contacts list
    await page.goto(`${BASE_URL}/dashboard/crm/contacts`);

    // Verify new contact appears
    await expect(page.locator('text=newcontact@example.com')).toBeVisible();
    await expect(page.locator('text=New Contact')).toBeVisible();
    await expect(page.locator('text=New Company')).toBeVisible();
  });

  // ========================================================================
  // Test 8: Audit Trail Recorded
  // ========================================================================

  test('upload should be recorded in audit log', async ({ page }) => {
    // This requires admin/audit view access
    // Skip if not available in test environment

    // Login as workspace admin
    await page.goto(`${BASE_URL}/dashboard/audit-logs`);
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard/audit-logs');

    // Filter to "Contact Upload" events
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="eventType"]', 'contact_upload');

    // Should show recent upload
    await expect(page.locator('text=contacts.csv')).toBeVisible();
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
