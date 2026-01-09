import { z } from 'zod';

// Google Places Autocomplete schemas
export const GooglePlacesAutocompleteSchema = z.object({
  predictions: z.array(z.object({
    place_id: z.string(),
    description: z.string(),
    main_text: z.string(),
    secondary_text: z.string().optional(),
    matched_substrings: z.array(z.object({
      length: z.number(),
      offset: z.number(),
    })).optional(),
  })),
  status: z.enum(['OK', 'ZERO_RESULTS', 'INVALID_REQUEST', 'OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'UNKNOWN_ERROR']),
});

export const GooglePlacesGeocodeSchema = z.object({
  results: z.array(z.object({
    place_id: z.string(),
    formatted_address: z.string(),
    geometry: z.object({
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      bounds: z.object({
        northeast: z.object({ lat: z.number(), lng: z.number() }),
        southwest: z.object({ lat: z.number(), lng: z.number() }),
      }).optional(),
    }),
    address_components: z.array(z.object({
      long_name: z.string(),
      short_name: z.string(),
      types: z.array(z.string()),
    })).optional(),
  })),
  status: z.enum(['OK', 'ZERO_RESULTS', 'INVALID_REQUEST', 'OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'UNKNOWN_ERROR']),
});

export type GooglePlacesAutocompletePrediction = z.infer<typeof GooglePlacesAutocompleteSchema>['predictions'][0];
export type GooglePlacesGeocodeResult = z.infer<typeof GooglePlacesGeocodeSchema>['results'][0];

/**
 * Get autocomplete predictions from Google Places
 * Used for address search suggestions
 */
export async function getAddressAutocomplete(
  input: string,
  bounds?: { neLat: number; neLng: number; swLat: number; swLng: number }
): Promise<GooglePlacesAutocompletePrediction[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  const params = new URLSearchParams({
    input,
    key: apiKey,
    components: 'country:us', // Restrict to US
  });

  // Add location bias (for San Miguel County, Colorado)
  if (bounds) {
    params.append(
      'location_bias',
      `rectangle:${bounds.swLat},${bounds.swLng}|${bounds.neLat},${bounds.neLng}`
    );
  } else {
    // Default to Colorado area
    params.append('location_bias', 'rectangle:36.9,-109.0|41.0,-102.0');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { headers: { 'User-Agent': 'geoselect-address-lookup/1.0' } }
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = GooglePlacesAutocompleteSchema.parse(data);

    if (parsed.status !== 'OK') {
      if (parsed.status === 'ZERO_RESULTS') {
        return [];
      }
      throw new Error(`Google Places API status: ${parsed.status}`);
    }

    return parsed.predictions;
  } catch (error) {
    console.error('Google Places autocomplete error:', error);
    throw error;
  }
}

/**
 * Get geocoded coordinates from address
 * Used to convert selected address to lat/lng for parcel lookup
 */
export async function geocodeAddress(address: string): Promise<GooglePlacesGeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  const params = new URLSearchParams({
    address,
    key: apiKey,
    components: 'country:US', // Restrict to US
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
      { headers: { 'User-Agent': 'geoselect-address-lookup/1.0' } }
    );

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = GooglePlacesGeocodeSchema.parse(data);

    if (parsed.status !== 'OK') {
      if (parsed.status === 'ZERO_RESULTS') {
        throw new Error(`No results found for address: ${address}`);
      }
      throw new Error(`Google Geocoding API status: ${parsed.status}`);
    }

    if (parsed.results.length === 0) {
      throw new Error(`No geocoding results for: ${address}`);
    }

    return parsed.results[0];
  } catch (error) {
    console.error('Google Geocoding error:', error);
    throw error;
  }
}

/**
 * Verify Google Maps API is configured
 */
export function verifyGooglePlacesConfig(): { valid: boolean; message: string } {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      valid: false,
      message: 'GOOGLE_MAPS_API_KEY environment variable not set',
    };
  }

  if (apiKey.length < 20) {
    return {
      valid: false,
      message: 'GOOGLE_MAPS_API_KEY appears to be invalid (too short)',
    };
  }

  return {
    valid: true,
    message: 'Google Places API configured',
  };
}

/**
 * Extract useful components from a geocoded result
 */
export function extractAddressComponents(result: GooglePlacesGeocodeResult): {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
} {
  const components: Record<string, string> = {};

  if (result.address_components) {
    for (const component of result.address_components) {
      if (component.types.includes('street_number')) {
        components.streetNumber = component.short_name;
      } else if (component.types.includes('route')) {
        components.streetName = component.long_name;
      } else if (component.types.includes('locality')) {
        components.city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        components.state = component.short_name;
      } else if (component.types.includes('postal_code')) {
        components.zipCode = component.short_name;
      } else if (component.types.includes('country')) {
        components.country = component.short_name;
      }
    }
  }

  return components;
}
