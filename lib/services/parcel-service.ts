// lib/services/parcel-service.ts
import { geocodeAddress, reverseGeocode } from '@/lib/esri/client';

export type ParcelData = {
  id: string;
  apn: string;
  address: string;
  jurisdiction: string;
  zoning: string;
  landUse?: string;
  acreage?: number;
  owner?: string;
  assessedValue?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  attributes: Record<string, any>;
  sources: string[];
  lastUpdated: string;
};

export type RiskOverlay = {
  type: 'flood' | 'fire' | 'earthquake' | 'environmental';
  severity: 'low' | 'medium' | 'high';
  description: string;
  source: string;
};

class ParcelService {
  /**
   * Search parcels by address using ESRI geocoding
   */
  async searchByAddress(address: string): Promise<ParcelData[]> {
    try {
      // First, geocode the address
      const geocodeResult = await geocodeAddress(address);

      if (!geocodeResult) {
        return [];
      }

      // Fetch parcel data for the geocoded location
      const parcel = await this.getParcelByCoordinates(
        geocodeResult.location.y,
        geocodeResult.location.x
      );

      return parcel ? [parcel] : [];
    } catch (error) {
      console.error('Parcel search error:', error);
      throw error;
    }
  }

  /**
   * Get parcel data by coordinates
   */
  async getParcelByCoordinates(lat: number, lng: number): Promise<ParcelData | null> {
    try {
      // 🎯 TODO: Replace with your actual parcel data source
      // This could be:
      // - Your Supabase database
      // - County GIS service
      // - ESRI Feature Service
      // - Third-party parcel API

      // For now, using mock data structure
      const address = await this.reverseGeocodeAddress(lat, lng);

      const mockParcel: ParcelData = {
        id: `parcel_${Date.now()}`,
        apn: this.generateMockAPN(),
        address,
        jurisdiction: 'Sample County',
        zoning: 'R-1 (Residential)',
        landUse: 'Single Family Residential',
        acreage: 0.25,
        owner: 'Property Owner LLC',
        assessedValue: 450000,
        coordinates: { lat, lng },
        geometry: this.generateMockBoundary(lat, lng),
        attributes: {
          yearBuilt: 2005,
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1800,
        },
        sources: ['County Assessor', 'ESRI Geocoding'],
        lastUpdated: new Date().toISOString(),
      };

      return mockParcel;
    } catch (error) {
      console.error('Get parcel by coordinates error:', error);
      return null;
    }
  }

  /**
   * Get parcel by APN (Assessor Parcel Number)
   */
  async getParcelByAPN(apn: string): Promise<ParcelData | null> {
    try {
      // 🎯 TODO: Query your parcel database by APN
      // For now, returning mock data

      return {
        id: `parcel_${apn}`,
        apn,
        address: '123 Main St, Anytown, CA 12345',
        jurisdiction: 'Sample County',
        zoning: 'R-1',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        attributes: {},
        sources: ['Mock Data'],
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get parcel by APN error:', error);
      return null;
    }
  }

  /**
   * Get risk overlays for a parcel
   */
  async getRiskOverlays(parcel: ParcelData): Promise<RiskOverlay[]> {
    // 🎯 TODO: Integrate with risk assessment APIs
    // Examples:
    // - FEMA flood zones
    // - CalFire hazard severity zones
    // - USGS earthquake data
    // - EPA environmental data

    const mockRisks: RiskOverlay[] = [
      {
        type: 'flood',
        severity: 'low',
        description: 'Outside 100-year flood zone',
        source: 'FEMA',
      },
      {
        type: 'fire',
        severity: 'medium',
        description: 'Moderate fire hazard zone',
        source: 'CAL FIRE',
      },
    ];

    return mockRisks;
  }

  /**
   * Get nearby parcels within a radius
   */
  async getNearbyParcels(
    lat: number,
    lng: number,
    radiusMiles: number = 0.5
  ): Promise<ParcelData[]> {
    // 🎯 TODO: Query parcels within radius
    // This would typically use spatial database queries

    return [];
  }

  // Helper methods

  private async reverseGeocodeAddress(lat: number, lng: number): Promise<string> {
    try {
      const result = await reverseGeocode(lat, lng);
      return result?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  private generateMockAPN(): string {
    const prefix = Math.floor(Math.random() * 900 + 100);
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${suffix}-00`;
  }

  private generateMockBoundary(lat: number, lng: number) {
    // Generate a small square boundary around the point
    const offset = 0.0001;
    return {
      type: 'Polygon' as const,
      coordinates: [
        [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset],
        ],
      ],
    };
  }
}

export const parcelService = new ParcelService();
