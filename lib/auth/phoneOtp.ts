/**
 * Phone Authentication Service
 * Integrates Supabase Phone OTP for SMS authentication
 */

import { createClient } from '@supabase/supabase-js';

export interface PhoneAuthResponse {
  success: boolean;
  error?: string;
  sessionId?: string;
  message?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

class PhoneAuthService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Send OTP to phone number
   * Supports both SMS and email OTP
   */
  async sendPhoneOTP(phoneNumber: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<PhoneAuthResponse> {
    try {
      // Validate phone number format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        return {
          success: false,
          error: 'Invalid phone number format. Use +1234567890',
        };
      }

      const { data, error } = await this.supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: channel,
          shouldCreateUser: true,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: `OTP sent via ${channel} to ${formattedPhone}`,
        sessionId: data?.session?.id,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP';
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Send OTP to email (alternative to SMS)
   */
  async sendEmailOTP(email: string): Promise<PhoneAuthResponse> {
    try {
      // Validate email format
      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      const { data, error } = await this.supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: `OTP sent to ${email}`,
        sessionId: data?.session?.id,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP';
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Verify OTP token
   */
  async verifyOTP(
    phone: string,
    token: string,
    type: 'sms' | 'email' = 'sms'
  ): Promise<VerifyOTPResponse> {
    try {
      const formattedPhone = type === 'sms' ? this.formatPhoneNumber(phone) : phone;

      const { data, error } = await this.supabase.auth.verifyOtp({
        phone: type === 'sms' ? formattedPhone : undefined,
        email: type === 'email' ? formattedPhone : undefined,
        token: token,
        type: type === 'sms' ? 'sms' : 'email',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify OTP';
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Format and validate phone number
   * Accepts: +1234567890, 1234567890, or (123) 456-7890
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/\D/g, '');

    // Add + if not present and number is long enough
    if (!phone.startsWith('+')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+' + phone.replace(/\D/g, '');
    }

    // Validate length (most international numbers are 10-15 digits)
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return null;
    }

    return cleaned;
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mask phone number for display
   */
  static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return `****${cleaned.slice(-4)}`;
  }

  /**
   * Mask email for display
   */
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local[0] + '*'.repeat(Math.max(1, local.length - 2)) + local[local.length - 1];
    return `${maskedLocal}@${domain}`;
  }
}

// Singleton instance
export const phoneAuthService = new PhoneAuthService();
