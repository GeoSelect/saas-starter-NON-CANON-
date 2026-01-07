'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressSearch } from '@/components/AddressSearch';
import { SearchMap } from '@/components/search/SearchMap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  DollarSign,
  AlertTriangle,
  Home,
  Users,
  TrendingUp,
  Loader2,
  Navigation,
} from 'lucide-react';
import { parcelService, type ParcelData, type RiskOverlay } from '@/lib/services/parcel-service';
import { calculateDistance, formatCoordinates } from '@/lib/esri/map-utils';

export default function SearchPage() {
  const router = useRouter();
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [risks, setRisks] = useState<RiskOverlay[]>([]);
  const [nearbyParcels, setNearbyParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleParcelSelect = async (parcel: ParcelData) => {
    setSelectedParcel(parcel);
    setLoading(true);

    try {
      // Fetch risk data using coordinates
      const riskData = await parcelService.getRiskOverlays(parcel);
      setRisks(riskData);

      // Fetch nearby properties using coordinates
      const nearby = await parcelService.getNearbyParcels(
        parcel.coordinates.latitude,
        parcel.coordinates.longitude,
        1 // 1 mile radius
      );
      setNearbyParcels(nearby);

      console.log('Parcel Data:', parcel);
      console.log('Risk Overlays:', riskData);
      console.log('Nearby Properties:', nearby);

      // Navigate to parcel summary page after address entry
      setTimeout(() => {
        router.push(`/parcel/summary?id=${parcel.id}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to load enriched data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Find a Property</h1>
          <p className="text-slate-600 mt-2">
            Search for properties by address to see them on the Telluride map and unlock location data
          </p>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - Search & Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Card */}
            <Card className="p-6 sticky top-4">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-6 w-6 text-orange-500" />
                <h2 className="text-lg font-semibold">Search Address</h2>
              </div>

              <AddressSearch
                onParcelSelect={handleParcelSelect}
                placeholder="123 Main St, City, ST ZIP"
              />
            </Card>

            {/* Property Details Card */}
            {selectedParcel && (
              <Card className="p-6 border-l-4 border-l-orange-500 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {selectedParcel.address}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedParcel.apn && (
                      <Badge variant="outline">APN: {selectedParcel.apn}</Badge>
                    )}
                    {selectedParcel.zoning && <Badge>{selectedParcel.zoning}</Badge>}
                    {selectedParcel.jurisdiction && (
                      <Badge variant="secondary">{selectedParcel.jurisdiction}</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Coordinates */}
                <div>
                  <p className="text-xs text-slate-600 mb-2 flex items-center gap-2 font-semibold">
                    <Navigation className="h-3 w-3" />
                    COORDINATES
                  </p>
                  <p className="text-sm font-mono text-slate-900">
                    {selectedParcel?.coordinates
                      ? formatCoordinates(
                          selectedParcel.coordinates.latitude,
                          selectedParcel.coordinates.longitude
                        )
                      : 'Coordinates unavailable'}
                  </p>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {selectedParcel.acreage && (
                    <div>
                      <p className="text-xs text-slate-600">Acreage</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedParcel.acreage.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {selectedParcel.assessedValue && (
                    <div>
                      <p className="text-xs text-slate-600">Value</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${(selectedParcel.assessedValue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {selectedParcel.landUse && (
                    <div>
                      <p className="text-xs text-slate-600">Land Use</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {selectedParcel.landUse}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Interactive Map */}
          <div className="lg:col-span-3 space-y-4">
            <SearchMap
              selectedParcel={selectedParcel}
              nearbyParcels={nearbyParcels}
              height={600}
            />
          </div>
        </div>

        {/* Full Width Sections Below Map */}
        <div className="mt-8 space-y-6">
          {/* Risk Assessment */}
          {risks.length > 0 && !loading && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Risk Assessment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {risks.map((risk, idx) => (
                  <Card
                    key={idx}
                    className="p-4 border-l-4"
                    style={{
                      borderLeftColor:
                        risk.severity === 'high'
                          ? '#ef4444'
                          : risk.severity === 'medium'
                            ? '#eab308'
                            : '#22c55e',
                    }}
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-sm capitalize">
                        {risk.type} Risk
                      </p>
                      <p className="text-xs text-slate-600">{risk.description}</p>
                      <Badge
                        variant={risk.severity === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Properties */}
          {nearbyParcels.length > 0 && !loading && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Home className="h-5 w-5 text-orange-500" />
                Nearby Properties (1 mile radius)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyParcels.map((parcel, idx) => {
                  const distance = calculateDistance(
                    selectedParcel.coordinates,
                    parcel.coordinates
                  );
                  return (
                    <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {parcel.address}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {distance.toFixed(2)} miles away
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {parcel.zoning && (
                            <Badge variant="outline" className="text-xs">
                              {parcel.zoning}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {parcel.acreage.toFixed(2)} ac
                          </Badge>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-sm font-semibold text-slate-900">
                            ${(parcel.assessedValue / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <Card className="p-12 text-center bg-white">
              <Loader2 className="h-8 w-8 mx-auto mb-4 text-orange-500 animate-spin" />
              <p className="text-slate-600">Loading enriched location data...</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
