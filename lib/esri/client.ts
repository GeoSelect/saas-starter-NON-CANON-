/**
 * Esri ArcGIS API Client
 * Handles authentication and API requests to Esri services
 */

const ESRI_API_KEY = process.env.NEXT_PUBLIC_ESRI_API_KEY;
const ESRI_API_URL = process.env.NEXT_PUBLIC_ESRI_API_URL;

export interface EsriParcelData {
  parcelId: string;
  address: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    lotSize: number;
    lotSizeUnit: string;
    yearBuilt: number;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    zoning?: string;
    taxAssessment?: number;
    lastSalePrice?: number;
    lastSaleDate?: string;
  };
}

export interface EsriGeocodeResult {
  address: string;
  location: {
    x: number;
    y: number;
  };
  score: number;
  attributes: {
    [key: string]: any;
  };
}

/**
 * Geocode an address using Esri's Geocoding Service
 */
export async function geocodeAddress(address: string): Promise<EsriGeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      address,
      f: 'json',
      token: ESRI_API_KEY || '',
    });

    const response = await fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0];
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Get parcel information using Esri's Feature Services
 * This would connect to a parcel layer in ArcGIS Online
 */
export async function getParcelData(
  lat: number,
  lng: number
): Promise<EsriParcelData | null> {
  try {
    const params = new URLSearchParams({
      geometry: JSON.stringify({ x: lng, y: lat }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      f: 'json',
      token: ESRI_API_KEY || '',
    });

    // This URL would need to be replaced with your actual parcel feature service
    const PARCEL_LAYER_URL =
      'https://services.arcgisonline.com/ArcGIS/rest/services/USA_Parcel_Locator/FeatureServer/0/query';

    const response = await fetch(`${PARCEL_LAYER_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Parcel query failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        parcelId: feature.attributes.OBJECTID || 'unknown',
        address: feature.attributes.SITUS_ADDR || '',
        geometry: feature.geometry,
        properties: {
          lotSize: feature.attributes.ACRES || 0,
          lotSizeUnit: 'acres',
          yearBuilt: feature.attributes.YEAR_BUILT || 0,
          propertyType: feature.attributes.PROPERTY_TYPE || 'Unknown',
          bedrooms: feature.attributes.BEDROOMS || undefined,
          bathrooms: feature.attributes.BATHROOMS || undefined,
          sqft: feature.attributes.SQFT || undefined,
          zoning: feature.attributes.ZONING || undefined,
          taxAssessment: feature.attributes.ASSESSED_VALUE || undefined,
          lastSalePrice: feature.attributes.SALE_PRICE || undefined,
          lastSaleDate: feature.attributes.SALE_DATE || undefined,
        },
      };
    }

    return null;
  } catch (error) {
    console.error('Parcel data fetch error:', error);
    return null;
  }
}

/**
 * Get reverse geocode data (coordinates to address)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<EsriGeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      location: `${lng},${lat}`,
      f: 'json',
      token: ESRI_API_KEY || '',
    });

    const response = await fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?${params}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.address) {
      return {
        address: data.address.Match_addr,
        location: { x: lng, y: lat },
        score: 100,
        attributes: data.address,
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Get property demographics and market data
 */
export async function getPropertyDemographics(
  lat: number,
  lng: number
): Promise<any> {
  try {
    const params = new URLSearchParams({
      studyAreas: JSON.stringify([
        {
          areaType: 'RingBuffer',
          areaRadius: 1,
          radiusUnit: 'esriMiles',
          geometry: { x: lng, y: lat },
        },
      ]),
      analysisVariables: JSON.stringify(['Wealth.TOTPOP_CY', 'Wealth.MEDHINC_CY']),
      f: 'json',
      token: ESRI_API_KEY || '',
    });

    const response = await fetch(
      `https://geoenrichment.arcgis.com/arcgis/rest/services/GeoEnrichment/Enrich?${params}`
    );

    if (!response.ok) {
      throw new Error(`Demographics fetch failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Demographics fetch error:', error);
    return null;
  }
}
