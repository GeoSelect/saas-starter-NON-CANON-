/**
 * Phone number validation utilities
 * E.164 format support for international phone numbers
 */

/**
 * Validates phone number in E.164 format
 * E.164 format: +[country code][area code][number]
 * Example: +14155552671
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validates 6-digit OTP token
 */
export function isValidOtpToken(token: string): boolean {
  return /^\d{6}$/.test(token);
}

/**
 * Formats phone number input to E.164 format
 * Handles common input variations
 */
export function formatPhoneNumber(input: string): string {
  // Remove all non-digit characters except +
  let cleaned = input.replace(/[^\d+]/g, '');

  // Remove leading 0 if it exists (common in some countries)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    cleaned = `+1${cleaned}`;
  }

  return cleaned;
}

/**
 * Masks phone number for display
 * Example: +1234567890 -> +1 *** *** 890
 */
export function maskPhoneNumber(phone: string): string {
  const match = phone.match(/^\+(\d{1,3})(\d{4,})$/);
  if (!match) return phone;

  const countryCode = match[1];
  const rest = match[2];
  const masked = rest.slice(0, -3).replace(/\d/g, '*') + rest.slice(-3);

  return `+${countryCode} ${masked}`;
}
