'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressSearch } from '@/components/AddressSearch';
import { InteractiveMap } from '@/components/parcel/InteractiveMap';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  DollarSign,
  Zap,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { parcelService, type ParcelData, type RiskOverlay } from '@/lib/services/parcel-service';

export default function PropertySearchPage() {
  const router = useRouter();
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [risks, setRisks] = useState<RiskOverlay[]>([]);
  const [loading, setLoading] = useState(false);

  const handleParcelSelect = async (parcel: ParcelData) => {
    setSelectedParcel(parcel);
    setLoading(true);

    try {
      // Fetch risk data for the selected parcel
      const riskData = await parcelService.getRiskOverlays(parcel);
      setRisks(riskData);
    } catch (error) {
      console.error('Failed to load risk data:', error);
      setRisks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (selectedParcel) {
      router.push(`/parcel/${selectedParcel.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Property Search</h1>
          <p className="text-slate-600 mt-2">
            Find and analyze properties with detailed parcel information, risk assessments, and market data.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Search Address</h2>
              <AddressSearch
                onParcelSelect={handleParcelSelect}
                placeholder="123 Main St, City, ST ZIP"
              />

              {/* Quick Search Tips */}
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Search Tips</h3>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span>Enter a complete street address</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span>Include city and state for accuracy</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span>Try ZIP code or APN lookup</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedParcel ? (
              <Card className="p-12 text-center border-dashed bg-white">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Property Selected</h3>
                <p className="text-slate-600">
                  Use the search box to find and view property details
                </p>
              </Card>
            ) : (
              <>
                {/* Property Header Card */}
                <Card className="p-6 bg-white border-l-4 border-l-orange-500">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {selectedParcel.address}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedParcel.apn && (
                          <Badge variant="outline">APN: {selectedParcel.apn}</Badge>
                        )}
                        {selectedParcel.zoning && <Badge>{selectedParcel.zoning}</Badge>}
                        {selectedParcel.jurisdiction && (
                          <Badge variant="secondary">{selectedParcel.jurisdiction}</Badge>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
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
                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> Value
                            </p>
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
                    </div>

                    <Button
                      onClick={handleViewDetails}
                      size="lg"
                      className="flex-shrink-0"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>

                {/* Map Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Property Location</h3>
                  <InteractiveMap
                    parcel={selectedParcel}
                    risks={risks}
                    showBoundaries={true}
                    showRisks={true}
                    height={400}
                  />
                </div>

                {/* Risk Assessment */}
                {risks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Risk Assessment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {risks.map((risk, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-3 w-3 rounded-full flex-shrink-0 mt-1 ${
                                risk.severity === 'high'
                                  ? 'bg-red-500'
                                  : risk.severity === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm capitalize">
                                {risk.type} Risk
                              </p>
                              <p className="text-xs text-slate-600 mt-1">{risk.description}</p>
                              <p className="text-xs text-slate-500 mt-2">Source: {risk.source}</p>
                            </div>
                            <Badge
                              variant={
                                risk.severity === 'high' ? 'destructive' : 'secondary'
                              }
                              className="text-xs flex-shrink-0"
                            >
                              {risk.severity}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Details Grid */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Property Details</h3>
                  <Card className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {selectedParcel.attributes &&
                        Object.entries(selectedParcel.attributes).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-lg font-semibold text-slate-900">{value}</p>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>

                {/* CTA Section */}
                <Card className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Ready to Analyze?</h3>
                      <p className="text-sm text-slate-700">
                        View comprehensive parcel details, market analysis, and download reports
                      </p>
                    </div>
                    <Button onClick={handleViewDetails} size="sm">
                      View Full Report
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
