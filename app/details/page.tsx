import Link from 'next/link';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/context/AuthContext';
import { FileText, MapPin, DollarSign, Calendar } from 'lucide-react';

export default function DetailsPage() {
  return (
    <AuthProvider>
      <DetailsPageContent />
    </AuthProvider>
  );
}

function DetailsPageContent() {
  const parcelDetails = {
    id: 'PARCEL-2024-001',
    address: '123 Mountain View Road, Telluride, CO 81435',
    location: {
      lat: 37.9377,
      lng: -106.9167,
    },
    area: '15.5 acres',
    value: '$2,500,000',
    zoning: 'Residential - Mountain',
    status: 'Active',
    lastUpdated: 'Jan 5, 2026',
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-grow px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Parcel Details</h1>
          <p className="text-gray-600 mb-6">{parcelDetails.id}</p>

          {/* Details Grid */}
          <div className="space-y-4">
          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <p className="font-medium text-gray-900">{parcelDetails.address}</p>
              </div>
            </div>
          </div>

          {/* Area */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Area</p>
                <p className="font-medium text-gray-900">{parcelDetails.area}</p>
              </div>
            </div>
          </div>

          {/* Estimated Value */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Value</p>
                <p className="font-medium text-gray-900">{parcelDetails.value}</p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="font-medium text-gray-900">{parcelDetails.lastUpdated}</p>
              </div>
            </div>
          </div>

          {/* Zoning & Status */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Zoning</p>
              <p className="font-medium text-gray-900">{parcelDetails.zoning}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {parcelDetails.status}
              </span>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Link href="/feature-gating" className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-center">
              Edit Details
            </Link>
            <Link href="/search/view" className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center">
              View Map
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
}
