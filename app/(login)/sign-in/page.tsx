'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ArrowRight, Mail, Lock, Phone, Loader } from 'lucide-react';
import { logAuditEvent } from '@/lib/audit/client';
import { isValidPhoneNumber, isValidOtpToken } from '@/lib/validation/phone';

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  
  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone auth state
  const [phone, setPhone] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  
  // Shared state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Replace with actual auth API call
      // For demo purposes, we'll simulate authentication
      if (!email || !password) {
        throw new Error('Please enter email and password');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Simulate successful login
      const user = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        plan: 'browse', // Default plan for new login
      };

      // Log successful login to audit trail
      await logAuditEvent(
        user.id,
        user.name,
        user.email,
        user.plan,
        'login',
        'success'
      );

      // Store user in localStorage (replace with proper session management)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');

      // Redirect to dashboard
      router.push('/chat');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMsg);

      // Log failed login attempt to audit trail
      await logAuditEvent(
        email,
        'Unknown',
        email,
        'browse',
        'login',
        'failure',
        errorMsg
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!phone) {
        throw new Error('Please enter a phone number');
      }

      if (!isValidPhoneNumber(phone)) {
        throw new Error('Invalid phone number. Please use format like +1234567890');
      }

      const response = await fetch('/api/auth/phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setPhoneStep('verify');
      setOtp('');
      setResendCountdown(60);

      // Countdown timer
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMsg);

      await logAuditEvent(
        phone,
        'Unknown',
        phone,
        'browse',
        'login',
        'failure',
        `OTP send failed: ${errorMsg}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!phone) {
        throw new Error('Phone number missing');
      }

      if (!otp) {
        throw new Error('Please enter the verification code');
      }

      if (!isValidOtpToken(otp)) {
        throw new Error('Verification code must be 6 digits');
      }

      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Create user session
      const user = {
        id: `user_${Date.now()}`,
        name: `User ${phone.slice(-4)}`,
        email: `phone_${phone}@geoselect.it`,
        plan: 'browse',
        phone: phone,
      };

      await logAuditEvent(
        user.id,
        user.name,
        user.email,
        user.plan,
        'login',
        'success',
        'Phone OTP verification successful'
      );

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');

      router.push('/chat');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMsg);

      await logAuditEvent(
        phone,
        'Unknown',
        phone,
        'browse',
        'login',
        'failure',
        `OTP verification failed: ${errorMsg}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-orange-500" />
            <span className="text-lg sm:text-xl font-bold text-white">GeoSelect.It</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to access your GeoSelect.It account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Authentication Method Tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => {
                  setTab('email');
                  setPhoneStep('input');
                  setError('');
                }}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  tab === 'email'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
              </button>
              <button
                onClick={() => {
                  setTab('phone');
                  setPhoneStep('input');
                  setError('');
                }}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  tab === 'phone'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
              </button>
            </div>

            {/* Email Sign In Form */}
            {tab === 'email' && (
              <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-gray-700">Remember me</span>
                  </label>
                  <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                    Forgot password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Phone Sign In Form */}
            {tab === 'phone' && (
              <form onSubmit={phoneStep === 'input' ? handleSendPhoneOtp : handleVerifyPhoneOtp} className="space-y-6">
                {phoneStep === 'input' ? (
                  <>
                    {/* Phone Number Field */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          id="phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Format: +1234567890 (with country code)</p>
                    </div>

                    {/* Send OTP Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send Verification Code
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* OTP Verification Field */}
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <p className="text-xs text-gray-600 mb-2">
                        We sent a 6-digit code to {phone}
                      </p>
                      <input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                        required
                      />
                    </div>

                    {/* Resend Code */}
                    <div className="text-center">
                      {resendCountdown > 0 ? (
                        <p className="text-sm text-gray-600">
                          Resend code in {resendCountdown}s
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneStep('input');
                            setOtp('');
                            setPhone('');
                          }}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          ← Use different phone number
                        </button>
                      )}
                    </div>

                    {/* Verify Button */}
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Sign In
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Demo Credentials */}
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Demo credentials:</strong>
              </p>
              <p className="text-xs text-gray-600 font-mono">
                Email: demo@example.com<br />
                Password: password123
              </p>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-gray-700">
              Don't have an account?{' '}
              <Link href="/sign-up" className="text-orange-600 hover:text-orange-700 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Back to Landing */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-300 hover:text-white transition text-sm">
              ← Back to landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
