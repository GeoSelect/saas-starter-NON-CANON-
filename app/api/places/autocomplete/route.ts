import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/places/autocomplete
 * Get address suggestions using Google Places Autocomplete
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const sessionToken = searchParams.get('sessionToken');
  const componentRestrictions = searchParams.get('componentRestrictions'); // e.g., 'country:us'

  if (!input || input.length < 2) {
    return NextResponse.json(
      { error: 'Input must be at least 2 characters' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('type', 'geocode'); // Only return geocoding results
    url.searchParams.set('language', 'en');

    // Restrict to US by default
    if (componentRestrictions) {
      url.searchParams.set('components', componentRestrictions);
    } else {
      url.searchParams.set('components', 'country:us');
    }

    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      // OK_JMZ_REQUEST_DENIED is OK - just return empty results
      if (data.status === 'ZERO_RESULTS' || data.status === 'OVER_QUERY_LIMIT') {
        return NextResponse.json({ predictions: [] });
      }
      return NextResponse.json(
        { error: `Autocomplete failed: ${data.status}`, details: data.error_message },
        { status: 400 }
      );
    }

    // Return predictions
    return NextResponse.json({
      predictions: data.predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.main_text,
        secondaryText: prediction.secondary_text,
        matchedSubstrings: prediction.matched_substrings,
      })),
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
