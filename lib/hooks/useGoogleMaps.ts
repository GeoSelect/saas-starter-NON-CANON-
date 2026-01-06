import { useState, useCallback } from 'react';

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  matchedSubstrings?: any[];
}

interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  addressComponents: any[];
  phone?: string;
  website?: string;
  types?: string[];
}

interface GeocodeResult {
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  bounds?: any;
  placeId: string;
  addressComponents: any[];
}

/**
 * Hook for Google Places autocomplete
 */
export function useGooglePlacesAutocomplete() {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAutocomplete = useCallback(async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      setSuggestions(data.predictions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, loading, error, getAutocomplete, setSuggestions };
}

/**
 * Hook for Google Places details
 */
export function useGooglePlacesDetails() {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDetails = useCallback(async (placeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(placeId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch place details');
      }

      setDetails(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { details, loading, error, getDetails };
}

/**
 * Hook for Geocoding (convert address to coordinates)
 */
export function useGoogleGeocoding() {
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to geocode address');
      }

      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, geocode };
}

/**
 * Hook combining all Google Maps functionality
 */
export function useGoogleMaps() {
  const autocomplete = useGooglePlacesAutocomplete();
  const placeDetails = useGooglePlacesDetails();
  const geocoding = useGoogleGeocoding();

  return {
    autocomplete,
    placeDetails,
    geocoding,
  };
}
