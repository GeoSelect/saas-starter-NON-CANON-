'use client';

import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/context/AuthContext';
import { useState, useCallback } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGoogleMaps } from '@/lib/hooks/useGoogleMaps';

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
}

function SearchParcelPageContent() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { autocomplete, geocoding } = useGoogleMaps();
  
  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);
    if (value.length > 2) {
      autocomplete.getAutocomplete(value);
    } else {
      autocomplete.setSuggestions([]);
    }
  }, [autocomplete]);

  const handleSearch = async (selectedAddress: string) => {
    setLoading(true);
    setAddress(selectedAddress);
    autocomplete.setSuggestions([]);

    try {
      // Geocode the address to validate it exists
      await geocoding.geocode(selectedAddress);
      
      // Redirect to view page with address
      router.push(
        `/search/view?address=${encodeURIComponent(selectedAddress)}`
      );
    } catch (error) {
      console.error('Search failed:', error);
      alert('Could not find address. Please try another search.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-grow px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
        {autocomplete.suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {autocomplete.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSearch(suggestion.description)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b last:border-b-0 flex items-center gap-3"
              >
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-gray-800 font-medium">{suggestion.mainText}</p>
                  {suggestion.secondaryText && (
                    <p className="text-gray-500 text-sm">{suggestion.secondaryText}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {autocomplete.error && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg p-3 z-10">
            <p className="text-red-600 text-sm">{autocomplete.error}</p>
          </div>
        )}
        </div>

        {/* Search Button */}
        <button
          onClick={() => address && handleSearch(address)}
          disabled={!address || loading || autocomplete.loading}
          className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-semibold mb-8 flex items-center justify-center gap-2"
        >
          {loading || autocomplete.loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search Property'
          )}
        </button>

        {/* Info Message */}
        {autocomplete.error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 text-sm">
              API Error: {autocomplete.error}. Try entering an address manually or check your API key configuration.
            </p>
          </div>
        )}

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
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}

export default function SearchParcelPage() {
  return (
    <AuthProvider>
      <SearchParcelPageContent />
    </AuthProvider>
  );
}