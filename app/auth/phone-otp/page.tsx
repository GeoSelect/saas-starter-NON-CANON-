'use client'

import { useState } from 'react'
import { Phone, Send, Check } from 'lucide-react'

export default function PhoneOTPPage() {
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    if (!phone) return
    setLoading(true)
    // Mock API call
    setTimeout(() => {
      setLoading(false)
      setStep('verify')
    }, 1000)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) return
    setLoading(true)
    // Mock API call
    setTimeout(() => {
      setLoading(false)
      setVerified(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-500/20 p-3 rounded-full">
              <Phone className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Phone OTP Authentication</h1>
          <p className="text-gray-400">Verify your phone number with a one-time password</p>
        </div>

        {/* Main Card */}
        <div className="border border-slate-600 rounded-lg p-6 bg-slate-800/50">
          <h2 className="text-xl font-semibold text-white mb-4">
            {step === 'phone' ? 'Enter Phone Number' : 'Verify OTP Code'}
          </h2>
          {verified ? (
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="bg-orange-500/20 p-4 rounded-full">
                    <Check className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white text-center">Verification Successful</h3>
                <p className="text-gray-400 text-center">Your phone number has been verified</p>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-sm text-gray-300 text-center">
                  Phone: <span className="font-mono text-orange-300">{phone}</span>
                </div>
                <button
                  onClick={() => {
                    setStep('phone')
                    setPhone('')
                    setOtp('')
                    setVerified(false)
                  }}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                >
                  Start Over
                </button>
              </div>
            ) : step === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Enter a valid phone number with country code</p>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={!phone || loading}
                  className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send OTP Code'}
                </button>
                <p className="text-xs text-gray-500 text-center mt-4">
                  We'll send a 6-digit code to your phone for verification
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-sm text-gray-300">
                  Code sent to: <span className="font-mono text-orange-300 block mt-1">{phone}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-2">Enter the 6-digit code we sent to your phone</p>
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || loading}
                  className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => setStep('phone')}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Back to Phone Number
                </button>
              </div>
            )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Demo Information</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Use any valid phone number format</li>
            <li>• Demo mode: Use any 6-digit code</li>
            <li>• No real SMS will be sent</li>
            <li>• Verification is instant</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
