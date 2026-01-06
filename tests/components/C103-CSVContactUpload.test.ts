// C103 CSV Contact Upload Tests — Unit tests for parser, validation, and limits
// Jest test suite

import { parseAndValidateCSV } from '@/lib/utils/csv-parser';
import { getMaxRowsForTier } from '@/lib/contracts/ccp09/csv-upload';

describe('C103 CSV Contact Upload', () => {
  // ========================================================================
  // CSV Parser Unit Tests
  // ========================================================================

  describe('parseAndValidateCSV', () => {
    // Test 1: Valid CSV with all required fields
    it('should parse valid CSV with required fields (email, name)', async () => {
      const csvContent = `email,name
john@example.com,John Doe
jane@example.com,Jane Smith`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(true);
      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.validCount).toBe(2);
      expect(result.summary.errorCount).toBe(0);
      expect(result.validRows).toHaveLength(2);
      expect(result.validRows[0]).toEqual({
        email: 'john@example.com',
        name: 'John Doe',
        phone: undefined,
        company: undefined,
        notes: undefined,
      });
    });

    // Test 2: CSV with optional fields
    it('should parse CSV with optional fields (phone, company, notes)', async () => {
      const csvContent = `email,name,phone,company,notes
john@example.com,John Doe,555-1234,Acme Corp,VIP client`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(true);
      expect(result.validRows[0]).toEqual({
        email: 'john@example.com',
        name: 'John Doe',
        phone: '555-1234',
        company: 'Acme Corp',
        notes: 'VIP client',
      });
    });

    // Test 3: Missing required field (email)
    it('should error if email column is missing', async () => {
      const csvContent = `name,phone
John Doe,555-1234`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          issue: 'Missing required column: email',
        })
      );
    });

    // Test 4: Invalid email format
    it('should error if email is invalid', async () => {
      const csvContent = `email,name
not-an-email,John Doe
john@example.com,Jane Smith`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(false);
      expect(result.summary.validCount).toBe(1); // Second row is valid
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          lineNumber: 2,
          field: 'email',
          issue: 'Invalid email format',
        })
      );
    });

    // Test 5: Email too long (>254 chars)
    it('should error if email exceeds 254 characters', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // 262 chars
      const csvContent = `email,name
${longEmail},John Doe`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          lineNumber: 2,
          field: 'email',
          issue: expect.stringContaining('254 characters'),
        })
      );
    });

    // Test 6: Row limit enforcement
    it('should stop parsing after max rows exceeded', async () => {
      const csvContent = `email,name
row1@example.com,Row 1
row2@example.com,Row 2
row3@example.com,Row 3`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 2); // Max 2 rows

      expect(result.summary.totalRows).toBe(2); // Only 2 parsed
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          issue: 'Exceeded row limit of 2',
        })
      );
    });

    // Test 7: File size limit (10MB)
    it('should reject files larger than 10MB', async () => {
      // Create a file larger than 10MB
      const largeContent = new ArrayBuffer(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

      const result = await parseAndValidateCSV(file, 1000);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining('10 MB'),
        })
      );
    });

    // Test 8: Wrong MIME type
    it('should reject non-CSV MIME types', async () => {
      const csvContent = `email,name
john@example.com,John Doe`;

      const file = new File([csvContent], 'contacts.json', { type: 'application/json' });

      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining('text/csv'),
        })
      );
    });

    // Test 9: Empty file
    it('should handle empty CSV', async () => {
      const csvContent = 'email,name';

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.summary.totalRows).toBe(0);
      expect(result.summary.validCount).toBe(0);
      expect(result.validRows).toHaveLength(0);
    });

    // Test 10: Whitespace handling
    it('should trim whitespace from fields', async () => {
      const csvContent = `email,name
  john@example.com  ,  John Doe  `;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(true);
      expect(result.validRows[0].email).toBe('john@example.com');
      expect(result.validRows[0].name).toBe('John Doe');
    });

    // Test 11: Quotes handling (CSV standard)
    it('should handle quoted fields with commas', async () => {
      const csvContent = `email,name,company
john@example.com,John Doe,"Acme, Inc"`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(true);
      expect(result.validRows[0].company).toBe('Acme, Inc');
    });

    // Test 12: Duplicate emails
    it('should accept duplicate emails (no uniqueness constraint at CSV level)', async () => {
      const csvContent = `email,name
john@example.com,John Doe
john@example.com,John Smith`;

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const result = await parseAndValidateCSV(file, 100);

      expect(result.valid).toBe(true);
      expect(result.summary.validCount).toBe(2);
      // Uniqueness enforced at DB level via constraints
    });
  });

  // ========================================================================
  // Tier-Based Row Limit Tests
  // ========================================================================

  describe('getMaxRowsForTier', () => {
    it('should return 100 for free tier', () => {
      expect(getMaxRowsForTier('free')).toBe(100);
    });

    it('should return 1000 for pro tier', () => {
      expect(getMaxRowsForTier('pro')).toBe(1000);
    });

    it('should return 5000 for pro_plus tier', () => {
      expect(getMaxRowsForTier('pro_plus')).toBe(5000);
    });

    it('should return 20000 for portfolio tier', () => {
      expect(getMaxRowsForTier('portfolio')).toBe(20000);
    });

    it('should return 50000 for enterprise tier', () => {
      expect(getMaxRowsForTier('enterprise')).toBe(50000);
    });

    it('should default to free tier for unknown tiers', () => {
      expect(getMaxRowsForTier('unknown')).toBe(100);
    });
  });

  // ========================================================================
  // Determinism Tests (Same Input → Same Output)
  // ========================================================================

  describe('Determinism', () => {
    it('should produce identical results for same CSV input', async () => {
      const csvContent = `email,name,phone
alice@example.com,Alice,555-1111
bob@example.com,Bob,555-2222
invalid-email,Charlie,555-3333`;

      const file1 = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const file2 = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

      const result1 = await parseAndValidateCSV(file1, 100);
      const result2 = await parseAndValidateCSV(file2, 100);

      expect(result1.valid).toBe(result2.valid);
      expect(result1.summary).toEqual(result2.summary);
      expect(result1.validRows).toEqual(result2.validRows);
      expect(result1.errors).toEqual(result2.errors);
    });
  });

  // ========================================================================
  // Integration Tests (CSV + Tier Limits)
  // ========================================================================

  describe('Integration: CSV + Tier Limits', () => {
    it('should enforce free tier limit (100 rows)', async () => {
      // Generate CSV with 150 rows
      let csvContent = 'email,name\n';
      for (let i = 0; i < 150; i++) {
        csvContent += `user${i}@example.com,User ${i}\n`;
      }

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const maxRows = getMaxRowsForTier('free');
      const result = await parseAndValidateCSV(file, maxRows);

      expect(result.summary.validCount).toBe(100); // Limited to 100
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining('100'),
        })
      );
    });

    it('should allow pro tier to import more rows (1000)', async () => {
      // Generate CSV with 1000 rows
      let csvContent = 'email,name\n';
      for (let i = 0; i < 1000; i++) {
        csvContent += `user${i}@example.com,User ${i}\n`;
      }

      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });
      const maxRows = getMaxRowsForTier('pro');
      const result = await parseAndValidateCSV(file, maxRows);

      expect(result.summary.validCount).toBe(1000);
      expect(result.valid).toBe(true);
    });
  });
});
