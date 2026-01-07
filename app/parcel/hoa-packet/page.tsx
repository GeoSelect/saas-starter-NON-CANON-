'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Share2, Download, FileText, MapPin, Home, Lock, Zap, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function HoaPacketPage() {
  const searchParams = useSearchParams();
  const parcelId = searchParams.get('id') || '40023';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock property data
  const property = {
    address: '201 Blue Hole Ln',
    city: 'Wimberley',
    state: 'TX',
    zip: '78676',
    parcelId,
    propertyType: 'Single Family',
    bedrooms: 4,
    bathrooms: 3,
  };

  const packet = {
    price: 3900, // $39.00 in cents
    displayPrice: '$39',
    title: 'Complete HOA Packet',
    description: 'Get everything you need to understand the property, HOA obligations, and potential risks in one comprehensive download.',
  };

  const benefits = [
    {
      icon: FileText,
      title: 'HOA Documents',
      description: 'Complete HOA bylaws, CC&Rs, meeting minutes, and financial statements',
    },
    {
      icon: Home,
      title: 'Property History',
      description: 'Sales history, tax assessments, and comparable property data',
    },
    {
      icon: MapPin,
      title: 'Risk Assessment',
      description: 'Flood zones, zoning restrictions, easements, and legal constraints',
    },
    {
      icon: Lock,
      title: 'Compliance Check',
      description: 'HOA compliance status and any outstanding violations',
    },
  ];

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/parcel/hoa-packet/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId,
          property,
          priceInCents: packet.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, sessionUrl } = await response.json();

      // Redirect to Stripe checkout
      if (sessionUrl) {
        window.location.href = sessionUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IQ</span>
            </div>
            <span className="font-semibold text-gray-900">Parcel IQ</span>
          </Link>
          <Link href={`/parcel/summary?id=${parcelId}`} className="text-sm text-gray-600 hover:text-gray-900">
            Back to Parcel
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Product Details */}
          <div className="flex flex-col gap-8">
            {/* Property Header */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {packet.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4">{packet.description}</p>
              
              {/* Property Address */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Property Address</p>
                <p className="text-lg font-semibold text-gray-900">
                  {property.address}, {property.city}, {property.state} {property.zip}
                </p>
                <p className="text-sm text-gray-600 mt-2">Parcel ID: {property.parcelId}</p>
              </div>
            </div>

            {/* Benefits Grid */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security & Trust */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900">Secure & Encrypted</h3>
              </div>
              <p className="text-sm text-gray-700">
                Your payment is processed securely through Stripe. We never store your card information. Your packet is encrypted and delivered directly to your email.
              </p>
            </div>
          </div>

          {/* Right Column - Pricing & Checkout */}
          <div className="flex flex-col gap-6 sticky top-32 h-fit">
            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8">
              {/* Price Display */}
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Total Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">{packet.displayPrice}</span>
                  <span className="text-gray-600">/packet</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">One-time payment, instant download</p>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8 pb-8 border-b border-gray-200">
                {[
                  'Instant PDF download',
                  'Complete HOA documentation',
                  'Property & risk assessment',
                  'Compliance check',
                  'Lifetime access',
                  'Email delivery + portal access',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mb-4 ${
                  isLoading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Buy HOA Packet Now
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Back Link */}
              <Link
                href={`/parcel/summary?id=${parcelId}`}
                className="w-full py-2 px-4 rounded-lg font-medium text-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Continue Exploring
              </Link>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-4">Secure payment powered by</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-600">Stripe</span>
                  </div>
                  <div className="h-4 border-l border-gray-300"></div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-gray-600">SSL Encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Questions?</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">How long does delivery take?</p>
                  <p className="text-gray-600 mt-1">Instant! Your packet downloads immediately after payment confirms, plus you'll receive an email with a permanent download link.</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="font-medium text-gray-900">Can I share this packet?</p>
                  <p className="text-gray-600 mt-1">This is a personal purchase. For business use or multiple properties, contact our sales team for bulk pricing.</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="font-medium text-gray-900">What if I'm not satisfied?</p>
                  <p className="text-gray-600 mt-1">30-day refund guarantee. If the packet doesn't meet your needs, we'll refund your purchase.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>&copy; 2026 Parcel IQ. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/contact" className="hover:text-gray-900">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
