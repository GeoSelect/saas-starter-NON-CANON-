import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// E.164 phone number format validation (e.g., +1234567890)
function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms'
      }
    });

    if (error) {
      // Handle rate limiting and other Supabase errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { ok: false, error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
