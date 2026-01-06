'use client';

import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { AuthProvider } from '@/lib/context/AuthContext';
import { useState } from 'react';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SearchParcelPageContent() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Mock Google Places address suggestions
  const mockAddresses = [
    '123 Mountain View Road, Telluride, CO 81435',
    '456 Ski Run Parkway, Vail, CO 81657',
    '789 Peak Street, Aspen, CO 81611',
    '321 Valley Lane, Jackson, WY 83001',
    '654 Ridge Road, Boulder, CO 80301',
  ];

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (value.length > 2) {
      // Mock Google Places autocomplete
      setSuggestions(
        mockAddresses.filter((addr) =>
          addr.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = async (selectedAddress: string) => {
    setLoading(true);
    setAddress(selectedAddress);
    setSuggestions([]);

    // Simulate API call to geocode address
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect to view page with address
    router.push(
      `/search/view?address=${encodeURIComponent(selectedAddress)}`
    );
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <main className="pb-24">
      <Header />
      <div className="px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Parcel</h1>
        <p className="text-gray-600">
          Search for any property address and view street-level imagery
        </p>
      </div>

      {/* Search Form */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Enter address (e.g., 123 Main St, Denver, CO)"
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-base"
          />
        </div>

        {/* Autocomplete Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b last:border-b-0 flex items-center gap-3"
              >
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-gray-800">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={() => address && handleSearch(address)}
        disabled={!address || loading}
        className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-semibold mb-8 flex items-center justify-center gap-2"
      >
        {loading ? 'Searching...' : 'Search Property'}
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Example Searches */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Try these examples:</h3>
        <div className="space-y-2">
          {mockAddresses.slice(0, 3).map((addr, index) => (
            <button
              key={index}
              onClick={() => handleSearch(addr)}
              className="w-full text-left px-4 py-2 bg-white hover:bg-orange-50 border border-gray-200 rounded-lg transition-colors text-gray-700 text-sm"
            >
              {addr}
            </button>
          ))}
        </div>
      </div>

      {/* Features Info */}
      <div className="mt-8 space-y-4">
        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold text-gray-900">Google Address Search</h4>
          <p className="text-gray-600 text-sm mt-1">
            Autocomplete powered by Google Places API with real-time suggestions
          </p>
        </div>
        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold text-gray-900">Street View Ready</h4>
          <p className="text-gray-600 text-sm mt-1">
            View 360° street-level imagery from Google Street View
          </p>
        </div>
        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold text-gray-900">No Sign-up Required</h4>
          <p className="text-gray-600 text-sm mt-1">
            Search and view parcels without creating an account
          </p>
        </div>
      </div>

      <BottomNavigation />
      </div>
    </main>
  );
}

export default function SearchParcelPage() {
  return (
    <AuthProvider>
      <SearchParcelPageContent />
    </AuthProvider>
  );
}