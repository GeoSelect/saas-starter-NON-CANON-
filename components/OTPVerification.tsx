'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';

interface OTPVerificationProps {
  phoneOrEmail: string;
  channel: 'sms' | 'email';
  onVerify: (otp: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export function OTPVerification({
  phoneOrEmail,
  channel,
  onVerify,
  onBack,
  isLoading = false,
  error,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setVerifyError('');
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setVerifyError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otpValue);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayValue = channel === 'sms'
    ? phoneOrEmail.replace(/\D/g, '').slice(-4).padStart(phoneOrEmail.length, '*')
    : phoneOrEmail.split('@')[0][0] + '*'.repeat(5) + '@' + phoneOrEmail.split('@')[1];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your {channel === 'sms' ? 'Phone' : 'Email'}</h2>
        <p className="text-gray-600">
          Enter the 6-digit code sent to <span className="font-medium">{displayValue}</span>
        </p>
      </div>

      {/* Error Messages */}
      {(verifyError || error) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{verifyError || error}</div>
        </div>
      )}

      {/* OTP Input Fields */}
      <div className="mb-8">
        <div className="flex gap-2 justify-center mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOTPChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
              placeholder="0"
              disabled={isVerifying || isLoading}
            />
          ))}
        </div>

        {/* Timer and Resend */}
        <div className="flex items-center justify-between text-sm">
          <div className={timeLeft > 30 ? 'text-gray-600' : 'text-red-600'}>
            Code expires in {formatTime(timeLeft)}
          </div>
          <button
            disabled={!canResend || isVerifying || isLoading}
            className={`font-medium transition ${
              canResend
                ? 'text-orange-600 hover:text-orange-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Resend Code
          </button>
        </div>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={isVerifying || isLoading || otp.some(d => !d)}
        className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
          isVerifying || isLoading || otp.some(d => !d)
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        }`}
      >
        {isVerifying || isLoading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Verify Code
          </>
        )}
      </button>

      {/* Help Text */}
      <p className="mt-6 text-center text-xs text-gray-500">
        Didn't receive the code? Check your spam folder or request a new one.
      </p>
    </div>
  );
}
