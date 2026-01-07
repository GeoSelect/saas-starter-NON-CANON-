'use client';

import * as React from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { geocodeAddress } from '@/lib/esri/client';
import { parcelService, type ParcelData } from '@/lib/services/parcel-service';

export interface AddressSearchProps {
  onParcelSelect?: (parcel: ParcelData) => void;
  placeholder?: string;
  showResults?: boolean;
}

export function AddressSearch({
  onParcelSelect,
  placeholder = 'Enter address, city, or ZIP code...',
  showResults = true,
}: AddressSearchProps) {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ParcelData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      // Step 1: Geocode the address using Esri
      const geocodeResult = await geocodeAddress(address);

      if (!geocodeResult) {
        setError('Address not found. Please try a different address.');
        setResults([]);
        setSearching(false);
        return;
      }

      // Step 2: Get parcel data for the coordinates
      const parcel = await parcelService.getParcelByCoordinates(
        geocodeResult.location.y,
        geocodeResult.location.x
      );

      if (parcel) {
        setResults([parcel]);
        setError(null);

        // Callback if provided
        if (onParcelSelect) {
          onParcelSelect(parcel);
        }
      } else {
        setError('No parcel data found for this location.');
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectParcel = (parcel: ParcelData) => {
    if (onParcelSelect) {
      onParcelSelect(parcel);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="w-full">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={placeholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={searching}
              className="pr-10"
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button type="submit" disabled={searching} size="default">
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Search Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {showResults && hasSearched && results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </h3>
          {results.map((parcel) => (
            <Card
              key={parcel.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectParcel(parcel)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{parcel.address}</h4>
                    <p className="text-xs text-gray-500">
                      {parcel.coordinates.lat.toFixed(6)}, {parcel.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="flex-shrink-0">
                    View
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parcel.apn && <Badge variant="outline">{parcel.apn}</Badge>}
                  {parcel.zoning && <Badge variant="secondary">{parcel.zoning}</Badge>}
                  {parcel.acreage && (
                    <Badge variant="outline">{parcel.acreage.toFixed(2)} acres</Badge>
                  )}
                </div>

                {parcel.assessedValue && (
                  <p className="text-sm text-gray-600">
                    Est. Value: ${parcel.assessedValue.toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {showResults && hasSearched && results.length === 0 && !error && (
        <Card className="p-8 text-center border-dashed">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No results found</p>
        </Card>
      )}
    </div>
  );
}
