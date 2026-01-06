'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeoLocationButton } from '@/components/ui/GeoLocationButton';
import { supabaseBrowser } from '@/lib/supabase/client';

type AuthMethod = 'email' | 'phone';

export default function SignInPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<string>('');
  const [otpSent, setOtpSent] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Sending link...');

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }

    setStatus('Magic link sent. Check your email.');
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Sending code...');

    try {
      const response = await fetch('/api/auth/phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (!data.ok) {
        setStatus(`Error: ${data.error}`);
        return;
      }

      setOtpSent(true);
      setStatus('Code sent! Enter the 6-digit code below.');
    } catch (error) {
      setStatus('Error: Failed to send code. Please try again.');
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Verifying code...');

    try {
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: otp })
      });

      const data = await response.json();

      if (!data.ok) {
        setStatus(`Error: ${data.error}`);
        return;
      }

      setStatus('Success! Redirecting...');
      // Redirect to home page after successful authentication
      router.push('/');
    } catch (error) {
      setStatus('Error: Failed to verify code. Please try again.');
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <div style={{ marginBottom: 20 }}>
        <GeoLocationButton />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Sign in</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => {
            setAuthMethod('email');
            setStatus('');
            setOtpSent(false);
          }}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: authMethod === 'email' ? '2px solid #333' : '2px solid transparent',
            fontWeight: authMethod === 'email' ? 600 : 400,
            cursor: 'pointer'
          }}
        >
          Email
        </button>
        <button
          onClick={() => {
            setAuthMethod('phone');
            setStatus('');
            setOtpSent(false);
          }}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: authMethod === 'phone' ? '2px solid #333' : '2px solid transparent',
            fontWeight: authMethod === 'phone' ? 600 : 400,
            cursor: 'pointer'
          }}
        >
          Phone
        </button>
      </div>

      {/* Email Auth Form */}
      {authMethod === 'email' && (
        <form onSubmit={sendLink}>
          <label style={{ display: 'block', marginBottom: 8 }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            type="email"
            required
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <button
            type="submit"
            style={{ marginTop: 12, padding: 10, borderRadius: 6, border: '1px solid #333', cursor: 'pointer' }}
          >
            Send magic link
          </button>
        </form>
      )}

      {/* Phone Auth Form */}
      {authMethod === 'phone' && !otpSent && (
        <form onSubmit={sendOtp}>
          <label style={{ display: 'block', marginBottom: 8 }}>Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
            type="tel"
            required
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Include country code (e.g., +1 for US)
          </p>
          <button
            type="submit"
            style={{ marginTop: 12, padding: 10, borderRadius: 6, border: '1px solid #333', cursor: 'pointer' }}
          >
            Send Code
          </button>
        </form>
      )}

      {/* OTP Verification Form */}
      {authMethod === 'phone' && otpSent && (
        <div>
          <p style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
            Code sent to {phone}
          </p>
          <form onSubmit={verifyOtp}>
            <label style={{ display: 'block', marginBottom: 8 }}>Enter 6-digit code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              type="text"
              pattern="\d{6}"
              maxLength={6}
              required
              style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
            />
            <button
              type="submit"
              style={{ marginTop: 12, padding: 10, borderRadius: 6, border: '1px solid #333', cursor: 'pointer' }}
            >
              Verify Code
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setStatus('');
              }}
              style={{
                marginTop: 12,
                marginLeft: 8,
                padding: 10,
                borderRadius: 6,
                border: '1px solid #ccc',
                background: 'none',
                cursor: 'pointer'
              }}
            >
              Resend Code
            </button>
          </form>
        </div>
      )}

      {status && <p style={{ marginTop: 12, fontSize: 14 }}>{status}</p>}
    </div>
  );
}


