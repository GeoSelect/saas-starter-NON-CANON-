import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// E.164 phone number format validation
function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

// Validate 6-digit OTP token
function isValidToken(token: string): boolean {
  const tokenRegex = /^\d{6}$/;
  return tokenRegex.test(token);
}

export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return NextResponse.json(
        { ok: false, error: 'Phone number and token are required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (!isValidToken(token)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid token format. Token must be 6 digits.' },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { ok: false, error: 'OTP has expired. Please request a new code.' },
          { status: 400 }
        );
      }
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { ok: false, error: 'Invalid OTP code. Please try again.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      session: data.session,
      user: data.user
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}
