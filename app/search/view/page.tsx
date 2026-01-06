'use client';

import Link from 'next/link';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { AuthProvider } from '@/lib/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { MapPin, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SearchViewPage() {
  return (
    <AuthProvider>
      <SearchViewPageContent />
    </AuthProvider>
  );
}

function SearchViewPageContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') || '123 Mountain View Road, Telluride, CO 81435';
  const [streetViewUrl, setStreetViewUrl] = useState('');

  useEffect(() => {
    // Mock Google Street View embed URL
    const mockStreetViewUrl = `https://www.google.com/maps/embed?pb=!4v1704570000000!6m8!1m7!1s${encodeURIComponent(
      'street_view_' + address
    )}!2m2!1d37.9377!2d-106.9167!3f0!4f0!5f0.7820865974627469`;
    setStreetViewUrl(mockStreetViewUrl);
  }, [address]);

  return (
    <main className="pb-24">
      <Header />
      <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/search"
          className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parcel Details</h1>
        <p className="text-gray-600 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {address}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Street View Section */}
        <div className="md:col-span-2">
          <div className="bg-gray-200 rounded-lg overflow-hidden h-96 mb-6 flex items-center justify-center relative">
            {/* Mock Street View Placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex flex-col items-center justify-center text-white">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Google Street View</h3>
              <p className="text-blue-100 text-center max-w-xs">
                Street-level imagery from Google Maps for {address}
              </p>
            </div>
          </div>

          {/* Street View Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Street View Controls</h3>
            <div className="grid grid-cols-4 gap-3">
              <Link href="/search/view?view=north" className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm font-medium text-center">
                North
              </Link>
              <Link href="/search/view?view=east" className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm font-medium text-center">
                East
              </Link>
              <Link href="/search/view?view=south" className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm font-medium text-center">
                South
              </Link>
              <Link href="/search/view?view=west" className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-sm font-medium text-center">
                West
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Rotate and pan the street view to explore the property from all angles. Zoom in/out to see details.
            </p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          {/* Property Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Property Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Latitude</p>
                <p className="text-gray-800 font-medium">37.9377°</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Longitude</p>
                <p className="text-gray-800 font-medium">-106.9167°</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Area</p>
                <p className="text-gray-800 font-medium">15.5 acres</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Zoning</p>
                <p className="text-gray-800 font-medium">Residential - Mountain</p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need More Info?</h3>
            <div className="space-y-3">
              <a
                href="tel:+1-970-555-0100"
                className="flex items-center gap-3 text-orange-600 hover:text-orange-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                +1 (970) 555-0100
              </a>
              <a
                href="mailto:info@geoselect.com"
                className="flex items-center gap-3 text-orange-600 hover:text-orange-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                info@geoselect.com
              </a>
            </div>
          </div>

          {/* Sign Up CTA */}
          <Link
            href="/workspaces/create"
            className="block w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-center"
          >
            Sign Up for More Features
          </Link>

          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold mb-3">UNLOCK WITH ACCOUNT:</p>
            <ul className="space-y-2 text-xs text-gray-700">
              <li>✓ Property analysis</li>
              <li>✓ Batch exports</li>
              <li>✓ AI insights</li>
              <li>✓ Historical data</li>
              <li>✓ Market comparisons</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Map Location</h3>
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">🗺️</div>
            <p className="text-gray-600">Google Maps embedded view</p>
            <p className="text-gray-500 text-sm mt-1">37.9377°, -106.9167°</p>
          </div>
        </div>
      </div>

      <BottomNavigation />
      </div>
    </main>
  );
}
