/**
 * Phone OTP Verification API Route
 * POST /api/auth/verify-phone-otp
 * Verifies OTP token and creates user session
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidPhoneNumber, isValidOtpToken } from '@/lib/validation/phone';

export async function POST(request: NextRequest) {
  try {
    const { phone, token } = await request.json();

    // Validate inputs
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)',
        },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    if (!isValidOtpToken(token)) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please enter a 6-digit code.' },
        { status: 400 }
      );
    }

    // TODO: Implement Supabase Auth phone OTP verification
    // This is a placeholder that would integrate with:
    // const { data, error } = await supabase.auth.verifyOtp({
    //   phone: phone,
    //   token: token,
    //   type: 'sms',
    // });
    //
    // if (error) {
    //   return NextResponse.json(
    //     { error: error.message || 'Invalid or expired verification code' },
    //     { status: 401 }
    //   );
    // }
    //
    // // Create session
    // const response = NextResponse.json({ success: true });
    // response.cookies.set('auth-token', data.session.access_token);

    // For demo purposes, return success
    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified successfully',
        user: {
          phone: phone,
          verified_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Phone OTP verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
