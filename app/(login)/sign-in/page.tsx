'use client';

import { ArrowRight, Github, Home } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle sign-in logic here
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Home Button */}
      <div className="absolute top-4 left-4">
        <Link
          href="/mobile-landing"
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-white transition-colors"
          title="Back to Home"
        >
          <Home className="h-6 w-6" />
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your GeoSelect.It account</p>
        </div>

        {/* SSO Section */}
        <div className="space-y-3">
          {/* Google SSO */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#4285F4" fontSize="20" fontWeight="bold">G</text>
            </svg>
            Continue with Google
          </button>

          {/* GitHub SSO */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 text-gray-400">Or continue with email</span>
          </div>
        </div>

        {/* Email Input */}
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? 'Signing in...' : 'Continue'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Forgot Password Button */}
        <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          Forgot Password?
        </button>

        {/* Create Account Button */}
        <Link
          href="/choose-plan"
          className="w-full block text-center bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors border border-slate-600"
        >
          Create Account
        </Link>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-orange-500 hover:text-orange-400">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
