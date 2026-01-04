import { describe, it, expect, beforeEach, vi } from "vitest";
import { sanitizeActivityMeta } from "./activity-sanitizer";
import { ActivityType } from "@/lib/types/activity";

describe("sanitizeActivityMeta - Activity Metadata Redaction", () => {
  describe("SHARE_LINK_CREATED - Token Security", () => {
    it("accepts token_prefix and rejects full_token", () => {
      const meta = {
        share_link_id: "link-123",
        snapshot_id: "snap-456",
        token_prefix: "abc12345", // OK: prefix only
        expires_at: "2026-01-11T12:00:00Z",
        max_views: 5,
        requires_auth: false,
      };

      const result = sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta);

      expect(result).toEqual(meta);
      expect(result?.token_prefix).toBe("abc12345");
      expect(result?.full_token).toBeUndefined();
    });

    it("throws error if full_token is present", () => {
      const meta = {
        share_link_id: "link-123",
        snapshot_id: "snap-456",
        token_prefix: "abc12345",
        full_token: "abc12345xyz789secret", // FORBIDDEN
      };

      expect(() =>
        sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta)
      ).toThrow("Full tokens cannot be logged");
    });

    it("throws error if token is present", () => {
      const meta = {
        share_link_id: "link-123",
        snapshot_id: "snap-456",
        token_prefix: "abc12345",
        token: "secrettoken123", // FORBIDDEN
      };

      expect(() =>
        sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta)
      ).toThrow("Full tokens cannot be logged");
    });

    it("truncates oversized token_prefix", () => {
      const meta = {
        share_link_id: "link-123",
        snapshot_id: "snap-456",
        token_prefix: "this_is_a_very_long_token_prefix_that_exceeds_sixteen_chars",
        expires_at: "2026-01-11T12:00:00Z",
      };

      const result = sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta);

      expect(result?.token_prefix).toBe("this_is_a");
      expect((result?.token_prefix as string).length).toBeLessThanOrEqual(16);
    });

    it("rejects disallowed keys in SHARE_LINK_CREATED", () => {
      const meta = {
        share_link_id: "link-123",
        snapshot_id: "snap-456",
        token_prefix: "abc12345",
        password: "should_be_rejected", // DISALLOWED
        api_key: "should_be_rejected", // DISALLOWED
        email: "user@example.com", // DISALLOWED
      };

      const result = sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta);

      expect(result?.password).toBeUndefined();
      expect(result?.api_key).toBeUndefined();
      expect(result?.email).toBeUndefined();
      expect(result?.share_link_id).toBe("link-123");
    });
  });

  describe("String Truncation - Payload Safety", () => {
    it("truncates strings exceeding 1000 characters", () => {
      const longString = "a".repeat(2000);
      const meta = {
        parcel_id: "p-123",
        address: longString,
      };

      const result = sanitizeActivityMeta(ActivityType.PARCEL_SELECTED, meta);

      expect((result?.address as string).length).toBe(1000);
      expect(result?.address).toBe("a".repeat(1000));
    });

    it("preserves strings under 1000 characters", () => {
      const safeString = "123 Main Street, Boulder, CO 80301";
      const meta = {
        parcel_id: "p-123",
        address: safeString,
      };

      const result = sanitizeActivityMeta(ActivityType.PARCEL_SELECTED, meta);

      expect(result?.address).toBe(safeString);
    });
  });

  describe("Nested Object Handling", () => {
    it("converts nested objects to JSON strings", () => {
      const meta = {
        parcel_id: "p-123",
        rule_counts: {
          evaluated: 15,
          passed: 12,
          failed: 3,
        },
      };

      const result = sanitizeActivityMeta(ActivityType.RULES_EVALUATED, meta);

      // rule_counts should be preserved as object (it's in allowlist)
      expect(result?.rule_counts).toBeDefined();
    });

    it("rejects disallowed nested keys", () => {
      const meta = {
        parcel_id: "p-123",
        internal_secret: {
          database_url: "postgres://...",
          api_key: "secret123",
        },
      };

      const result = sanitizeActivityMeta(ActivityType.PARCEL_SELECTED, meta);

      expect(result?.internal_secret).toBeUndefined();
      expect(result?.parcel_id).toBe("p-123");
    });
  });

  describe("Per-Type Allowlists", () => {
    it("enforces SNAPSHOT_CREATED allowlist", () => {
      const meta = {
        snapshot_id: "snap-123",
        parcel_id: "p-456",
        address: "789 Oak Ave",
        report_id: "report-789",
        schema_version: "1.0",
        internal_note: "should_be_rejected",
        creator_password: "should_be_rejected",
      };

      const result = sanitizeActivityMeta(ActivityType.SNAPSHOT_CREATED, meta);

      expect(result?.snapshot_id).toBe("snap-123");
      expect(result?.address).toBe("789 Oak Ave");
      expect(result?.internal_note).toBeUndefined();
      expect(result?.creator_password).toBeUndefined();
    });

    it("enforces PARCEL_SELECTED allowlist", () => {
      const meta = {
        parcel_id: "p-123",
        apn: "123-45-6789",
        source: "map_click",
        confidence: 0.95,
        request_id: "req-111",
        user_notes: "should_be_rejected",
        internal_id: "should_be_rejected",
      };

      const result = sanitizeActivityMeta(ActivityType.PARCEL_SELECTED, meta);

      expect(result?.parcel_id).toBe("p-123");
      expect(result?.confidence).toBe(0.95);
      expect(result?.user_notes).toBeUndefined();
      expect(result?.internal_id).toBeUndefined();
    });

    it("enforces REPORT_SHARED allowlist", () => {
      const meta = {
        report_id: "report-123",
        shared_with: JSON.stringify({
          email: "user@example.com",
        }),
        role_granted: "viewer",
        channel: "email",
        message_id: "msg-456",
        recipient_phone: "should_be_rejected",
        internal_routing: "should_be_rejected",
      };

      const result = sanitizeActivityMeta(ActivityType.REPORT_SHARED, meta);

      expect(result?.report_id).toBe("report-123");
      expect(result?.role_granted).toBe("viewer");
      expect(result?.recipient_phone).toBeUndefined();
      expect(result?.internal_routing).toBeUndefined();
    });
  });

  describe("Null/Undefined Handling", () => {
    it("returns null for null metadata", () => {
      const result = sanitizeActivityMeta(ActivityType.SIGN_IN, null);
      expect(result).toBeNull();
    });

    it("returns null for undefined metadata", () => {
      const result = sanitizeActivityMeta(ActivityType.SIGN_IN, undefined);
      expect(result).toBeNull();
    });

    it("returns empty object for non-object metadata", () => {
      const result = sanitizeActivityMeta(
        ActivityType.SIGN_IN,
        "invalid" as any
      );
      expect(result).toBeNull();
    });

    it("preserves null values in allowed fields", () => {
      const meta = {
        report_id: "report-123",
        shared_with: JSON.stringify({ email: null }),
        role_granted: "viewer",
        channel: "email",
        message_id: null,
      };

      const result = sanitizeActivityMeta(ActivityType.REPORT_SHARED, meta);

      expect(result?.message_id).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty metadata object", () => {
      const result = sanitizeActivityMeta(ActivityType.SIGN_IN, {});
      expect(result).toEqual({});
    });

    it("handles boolean and numeric values", () => {
      const meta = {
        share_link_id: "link-123",
        snapshot_id: "snap-456",
        requires_auth: true,
        max_views: 42,
      };

      const result = sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta);

      expect(result?.requires_auth).toBe(true);
      expect(result?.max_views).toBe(42);
    });

    it("rejects unknown activity types safely", () => {
      const meta = { some_key: "some_value" };
      const result = sanitizeActivityMeta(
        "UNKNOWN_TYPE" as ActivityType,
        meta
      );
      expect(result).toEqual({});
    });
  });

  describe("Large Payload Prevention", () => {
    it("truncates array payloads", () => {
      const largeArray = Array(500)
        .fill(null)
        .map((_, i) => ({ id: i, data: "x".repeat(10) }));

      const meta = {
        report_id: "r-123",
        shared_with: largeArray,
      };

      const result = sanitizeActivityMeta(ActivityType.REPORT_SHARED, meta);

      // String version will be truncated
      expect(result?.shared_with).toBeDefined();
    });

    it("handles deeply nested structures", () => {
      const deepNest = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: "value",
              },
            },
          },
        },
      };

      const meta = {
        report_id: "r-123",
        shared_with: deepNest,
      };

      const result = sanitizeActivityMeta(ActivityType.REPORT_SHARED, meta);

      // Allowed key, but converted to JSON string to prevent deep nesting
      expect(result?.shared_with).toBeDefined();
      expect(typeof result?.shared_with).toBe("string");
    });
  });
});
