/**
 * Phone number validation utilities
 */

/**
 * Validates phone number in E.164 format
 * E.164 format: + followed by 1-15 digits
 * Examples: +1234567890, +442071838750, +919876543210
 */
export function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validates OTP token format (6 digits)
 */
export function isValidOtpToken(token: string): boolean {
  const tokenRegex = /^\d{6}$/;
  return tokenRegex.test(token);
}
