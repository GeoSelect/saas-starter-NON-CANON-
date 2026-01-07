/**
 * CCP-04: Parcel Display Component
 *
 * Shows resolved parcel intelligence with owner, property, and valuation details
 */

"use client";

import { ParcelResult } from "@/lib/types/parcel";
import { Button } from "@/components/ui/button";
import { MapPin, Home, DollarSign, User, FileText } from "lucide-react";

interface ParcelDisplayProps {
  parcel: ParcelResult;
  onCreateReport?: () => void;
  onShare?: () => void;
}

export function ParcelDisplay({ parcel, onCreateReport, onShare }: ParcelDisplayProps) {
  return (
    <div className="space-y-6 bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-500" />
          {parcel.metadata?.display_address || "Parcel Information"}
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          {parcel.county}, {parcel.state} • Parcel ID: {parcel.parcel_id}
        </p>
      </div>

      {/* Owner Information */}
      {parcel.owner && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
            <User className="h-5 w-5 text-green-500" />
            Owner Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <div>
              <p className="text-sm text-gray-600">Owner</p>
              <p className="font-medium text-gray-900">{parcel.owner.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900 capitalize">{parcel.owner.type || "N/A"}</p>
            </div>
            {parcel.owner.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-blue-600">{parcel.owner.email}</p>
              </div>
            )}
            {parcel.owner.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{parcel.owner.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Details */}
      {parcel.property_info && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
            <Home className="h-5 w-5 text-orange-500" />
            Property Details
          </h3>
          <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
            {parcel.property_info.bedrooms && (
              <div>
                <p className="text-sm text-gray-600">Bedrooms</p>
                <p className="font-medium text-gray-900">{parcel.property_info.bedrooms}</p>
              </div>
            )}
            {parcel.property_info.bathrooms && (
              <div>
                <p className="text-sm text-gray-600">Bathrooms</p>
                <p className="font-medium text-gray-900">{parcel.property_info.bathrooms}</p>
              </div>
            )}
            {parcel.property_info.year_built && (
              <div>
                <p className="text-sm text-gray-600">Year Built</p>
                <p className="font-medium text-gray-900">{parcel.property_info.year_built}</p>
              </div>
            )}
            {parcel.property_info.lot_size_sqft && (
              <div>
                <p className="text-sm text-gray-600">Lot Size</p>
                <p className="font-medium text-gray-900">
                  {(parcel.property_info.lot_size_sqft / 1000).toFixed(1)}K sqft
                </p>
              </div>
            )}
            {parcel.property_info.building_sqft && (
              <div>
                <p className="text-sm text-gray-600">Building Size</p>
                <p className="font-medium text-gray-900">
                  {(parcel.property_info.building_sqft / 1000).toFixed(1)}K sqft
                </p>
              </div>
            )}
            {parcel.property_info.pool !== undefined && (
              <div>
                <p className="text-sm text-gray-600">Pool</p>
                <p className="font-medium text-gray-900">{parcel.property_info.pool ? "Yes" : "No"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valuation */}
      {parcel.valuation && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
            <DollarSign className="h-5 w-5 text-purple-500" />
            Valuation
          </h3>
          <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            {parcel.valuation.estimated_value && (
              <div>
                <p className="text-sm text-gray-600">Estimated Value</p>
                <p className="font-medium text-gray-900">
                  ${(parcel.valuation.estimated_value / 1000000).toFixed(2)}M
                </p>
              </div>
            )}
            {parcel.valuation.tax_assessed_value && (
              <div>
                <p className="text-sm text-gray-600">Tax Assessed Value</p>
                <p className="font-medium text-gray-900">
                  ${(parcel.valuation.tax_assessed_value / 1000000).toFixed(2)}M
                </p>
              </div>
            )}
            {parcel.valuation.last_sale_price && (
              <div>
                <p className="text-sm text-gray-600">Last Sale Price</p>
                <p className="font-medium text-gray-900">
                  ${(parcel.valuation.last_sale_price / 1000000).toFixed(2)}M
                </p>
              </div>
            )}
            {parcel.valuation.last_sale_date && (
              <div>
                <p className="text-sm text-gray-600">Last Sale Date</p>
                <p className="font-medium text-gray-900">{parcel.valuation.last_sale_date}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Sources */}
      {parcel.sources && parcel.sources.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Data Sources</h3>
          <div className="flex flex-wrap gap-2">
            {parcel.sources.map((source, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  source.confidence === "high"
                    ? "bg-green-100 text-green-800"
                    : source.confidence === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-orange-100 text-orange-800"
                }`}
              >
                {source.name} ({source.confidence})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCreateReport && (
          <Button onClick={onCreateReport} className="gap-2">
            <FileText className="h-4 w-4" />
            Create Report
          </Button>
        )}
        {onShare && (
          <Button onClick={onShare} variant="outline" className="gap-2">
            Share with Homeowner
          </Button>
        )}
      </div>
    </div>
  );
}
