'use client';

import { ArrowRight, MessageCircle, Home, FileText, CheckCircle, Users, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { TrustBadges } from '@/components/social-proof/TrustBadges';
import { InteractiveMapHero } from '@/components/InteractiveMapHero';
import { FacebookCommentsGallery } from '@/components/FacebookCommentsGallery';

export default function MobileLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex flex-col">
      {/* Welcome Screen */}
      <div className="flex-1 relative w-full flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8">          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold text-white">Welcome</h1>
            <p className="text-2xl font-semibold text-orange-500">GeoSelect.It</p>
          </div>
          {/* 3D Interactive Map */}
          <InteractiveMapHero />

          {/* Three Main CTA Buttons */}
          <div className="space-y-3">
            <Link
              href="/parcel/summary"
              className="w-full block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Start Report
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/preview/components"
              className="w-full block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              View Sample
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="w-full bg-slate-800/50 border-t border-slate-700 py-12 px-4">
        <div className="max-w-md mx-auto space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-6 text-center">Trusted by Real Estate Professionals</h2>
            <TrustBadges />
          </div>
          <FacebookCommentsGallery />
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="w-full bg-slate-900 border-t border-slate-700">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          {/* Home */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            title="Home"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>

          {/* Chat - Center */}
          <Link
            href="/chat"
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors"
            title="Chat"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs">Chat</span>
          </Link>

          {/* Details */}
          <Link
            href="/parcel/summary"
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            title="Details"
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
