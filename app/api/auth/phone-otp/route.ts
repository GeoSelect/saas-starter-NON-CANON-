/**
 * Phone OTP Request API Route
 * POST /api/auth/phone-otp
 * Sends OTP via SMS to the provided phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidPhoneNumber } from '@/lib/validation/phone';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // Validate phone number
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

    // TODO: Implement Supabase Auth phone OTP sending
    // This is a placeholder that would integrate with:
    // const { data, error } = await supabase.auth.signInWithOtp({
    //   phone: phone,
    //   options: {
    //     shouldCreateUser: true,
    //   },
    // });

    // For demo purposes, return success
    // In production, Supabase Auth will send the SMS automatically
    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully. Check your SMS for the 6-digit code.',
        phone: phone.slice(-4), // Return masked phone number
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Phone OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
