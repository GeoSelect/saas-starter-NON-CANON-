'use client';

import { Share2, FileDown, MapIcon, FileText, Activity, Settings, ChevronRight, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function ParcelSummaryPage() {
  const searchParams = useSearchParams();
  const parcelId = searchParams.get('id') || '40023';
  const [expandedSection, setExpandedSection] = useState<'attributes' | null>(null);

  // Mock property data matching Figma design
  const property = {
    address: '201 Blue Hole Ln',
    city: 'Wimberley',
    state: 'TX',
    zip: '78676',
    parcelId: '40023',
    zoned: 'Residential',
    hoaActive: true,
    parcelRequired: true,
    lotSize: '0.25 acres',
    floodZone: 'Zone X',
    compliance: '2 items',
    constraints: '1 active',
    propertyType: 'Single Family',
    bedrooms: 4,
    bathrooms: 3,
    sqft: '3,250',
    yearBuilt: 2005,
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${property.address} - Property Report`,
        text: 'Check out this property report',
        url: window.location.href
      });
    } else {
      alert('Copy this link to share: ' + window.location.href);
    }
  };

  const handleExportPDF = () => {
    alert('PDF export feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              P
            </div>
            <span className="font-semibold text-gray-800">Parcel IQ</span>
          </div>
          <button
            onClick={handleShare}
            className="text-gray-600 hover:text-gray-800"
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Hero Image */}
        <div className="relative w-full h-64 md:h-80 bg-gradient-to-b from-blue-400 to-gray-300 overflow-hidden">
          <div className="absolute inset-0 bg-pattern opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
            [Property/Aerial Photo]
          </div>
        </div>

        {/* Content Container */}
        <div className="px-4 py-6 space-y-6">
          {/* Address and Info */}
          <div className="border-b pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.address}</h1>
            <p className="text-gray-600">Parcel ID: {property.parcelId}</p>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                {property.zoned}
              </span>
              {property.hoaActive && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  HOA Active
                </span>
              )}
              {property.parcelRequired && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                  Parcel Required
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleShare}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Lot Size */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-green-600 mt-1">📍</div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Lot Size</p>
                  <p className="text-lg font-bold text-gray-900">{property.lotSize}</p>
                </div>
              </div>
            </div>

            {/* Flood Zone */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-1">💧</div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Flood Zone</p>
                  <p className="text-lg font-bold text-gray-900">{property.floodZone}</p>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 mt-1">⚡</div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Compliance</p>
                  <p className="text-lg font-bold text-gray-900">{property.compliance}</p>
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-1">⚠️</div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Constraints</p>
                  <p className="text-lg font-bold text-gray-900">{property.constraints}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Street View Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Street View</h2>
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-600">
              [Street View Image - 201 Blue Hole Ln]
            </div>
            <p className="text-xs text-gray-600 mt-2">Street view • 201 Blue Hole Ln</p>
          </div>

          {/* Property Attributes */}
          <div className="border-t pt-6">
            <button
              onClick={() => setExpandedSection(expandedSection === 'attributes' ? null : 'attributes')}
              className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900">Property Attributes</h2>
                <p className="text-sm text-gray-600">Land use, structure, and ownership details</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'attributes' ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedSection === 'attributes' && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-semibold text-gray-900">Single Family</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bedrooms</span>
                  <span className="font-semibold text-gray-900">{property.bedrooms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bathrooms</span>
                  <span className="font-semibold text-gray-900">{property.bathrooms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Square Feet</span>
                  <span className="font-semibold text-gray-900">{property.sqft}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Year Built</span>
                  <span className="font-semibold text-gray-900">{property.yearBuilt}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="border-t pt-6 grid grid-cols-4 gap-3 text-center">
            <Link
              href={`/parcel/summary?id=${parcelId}`}
              className="flex flex-col items-center gap-2 py-3 px-2 text-blue-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Report</span>
            </Link>
            <Link
              href={`/parcel/summary?id=${parcelId}`}
              className="flex flex-col items-center gap-2 py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MapIcon className="h-5 w-5" />
              <span className="text-xs">Map</span>
            </Link>
            <Link
              href={`/parcel/details?id=${parcelId}`}
              className="flex flex-col items-center gap-2 py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Documents</span>
            </Link>
            <Link
              href={`/parcel/summary?id=${parcelId}`}
              className="flex flex-col items-center gap-2 py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs">Activity</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
