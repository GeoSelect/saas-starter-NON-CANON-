import { ActivityType } from "@/lib/types/activity";

/**
 * Allowed metadata keys per activity type
 * Enforces allowlists to prevent accidental data leakage (tokens, PII, large payloads)
 */
const ALLOWED_KEYS_BY_TYPE: Record<string, Set<string>> = {
  [ActivityType.SIGN_UP]: new Set([]),
  [ActivityType.SIGN_IN]: new Set([]),
  [ActivityType.SIGN_OUT]: new Set([]),
  [ActivityType.UPDATE_PASSWORD]: new Set([]),
  [ActivityType.DELETE_ACCOUNT]: new Set([]),
  [ActivityType.UPDATE_ACCOUNT]: new Set(["updated_fields"]),
  [ActivityType.CREATE_TEAM]: new Set(["team_id", "team_name"]),
  [ActivityType.REMOVE_TEAM_MEMBER]: new Set([
    "team_id",
    "member_id",
    "member_email",
  ]),
  [ActivityType.INVITE_TEAM_MEMBER]: new Set([
    "team_id",
    "invited_email",
    "role",
  ]),
  [ActivityType.ACCEPT_INVITATION]: new Set(["team_id"]),
  [ActivityType.PARCEL_SELECTED]: new Set([
    "parcel_id",
    "apn",
    "source",
    "confidence",
    "request_id",
    "address",
  ]),
  [ActivityType.RULES_EVALUATED]: new Set([
    "parcel_id",
    "ruleset_version",
    "rule_counts",
    "duration_ms",
    "inputs_hash",
  ]),
  [ActivityType.SNAPSHOT_CREATED]: new Set([
    "snapshot_id",
    "parcel_id",
    "address",
    "report_id",
    "schema_version",
  ]),
  [ActivityType.SHARE_LINK_CREATED]: new Set([
    "share_link_id",
    "snapshot_id",
    "token_prefix", // NEVER full_token
    "expires_at",
    "max_views",
    "requires_auth",
  ]),
  [ActivityType.REPORT_SHARED]: new Set([
    "report_id",
    "shared_with",
    "role_granted",
    "channel",
    "message_id",
  ]),
};

/**
 * Maximum allowed string length for metadata values
 * Prevents accidental payload dumps or oversized PII leaks
 */
const MAX_STRING_LENGTH = 1000;

/**
 * Sanitize activity metadata to prevent leakage and enforce schema
 *
 * @param activityType - Type of activity
 * @param meta - Raw metadata object
 * @returns Sanitized metadata with only allowed keys and safe values
 *
 * Rules:
 * - Strips disallowed keys per activity type
 * - Truncates suspicious string values
 * - Converts nested objects to JSON strings (prevents deep structures)
 * - Rejects large payloads
 */
export function sanitizeActivityMeta(
  activityType: ActivityType,
  meta?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") {
    return null;
  }

  const allowedKeys = ALLOWED_KEYS_BY_TYPE[activityType];
  if (!allowedKeys) {
    // Unknown activity type - return empty metadata for safety
    console.warn(`Unknown activity type: ${activityType}`);
    return {};
  }

  // Additional validation for sensitive types BEFORE filtering
  if (activityType === ActivityType.SHARE_LINK_CREATED) {
    // Explicit check: never allow full token (catch before allowlist filters it out)
    if (meta.full_token || meta.token) {
      console.error(
        "SECURITY: Attempted to log full token in SHARE_LINK_CREATED activity"
      );
      throw new Error("Full tokens cannot be logged");
    }
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    // Reject disallowed keys
    if (!allowedKeys.has(key)) {
      console.debug(
        `Rejecting disallowed metadata key '${key}' for ${activityType}`
      );
      continue;
    }

    // Sanitize the value
    sanitized[key] = sanitizeValue(value);
  }

  // Additional validation for sensitive types
  if (activityType === ActivityType.SHARE_LINK_CREATED) {
    // Verify token_prefix is short (max 16 chars for display)
    if (
      typeof sanitized.token_prefix === "string" &&
      sanitized.token_prefix.length > 16
    ) {
      console.warn("Truncating long token_prefix");
      sanitized.token_prefix = sanitized.token_prefix.substring(0, 9);
    }
  }

  return sanitized;
}

/**
 * Sanitize a single metadata value
 * - Truncates long strings
 * - Converts objects to JSON (prevents deep nesting)
 * - Preserves safe primitives
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) {
      console.debug(
        `Truncating string value from ${value.length} to ${MAX_STRING_LENGTH} chars`
      );
      return value.substring(0, MAX_STRING_LENGTH);
    }
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    // Convert arrays to JSON strings to prevent deep nesting
    const json = JSON.stringify(value);
    if (json.length > MAX_STRING_LENGTH) {
      console.debug("Array payload truncated to 1000 chars");
      return json.substring(0, MAX_STRING_LENGTH);
    }
    return json;
  }

  if (typeof value === "object") {
    // Convert nested objects to JSON strings
    const json = JSON.stringify(value);
    if (json.length > MAX_STRING_LENGTH) {
      console.debug("Object payload truncated to 1000 chars");
      return json.substring(0, MAX_STRING_LENGTH);
    }
    return json;
  }

  // Reject unknown types
  console.warn(`Unknown metadata value type: ${typeof value}`);
  return null;
}
