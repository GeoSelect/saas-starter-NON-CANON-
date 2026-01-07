import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/places/details
 * Get detailed place information using Google Places API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json(
      { error: 'Place ID is required' },
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
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', [
      'formatted_address',
      'geometry',
      'address_component',
      'place_id',
      'type',
      'formatted_phone_number',
      'website',
      'name',
    ].join(','));
    url.searchParams.set('language', 'en');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Details lookup failed: ${data.status}`, details: data.error_message },
        { status: 400 }
      );
    }

    const result = data.result;
    return NextResponse.json({
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      addressComponents: result.address_components,
      phone: result.formatted_phone_number || null,
      website: result.website || null,
      types: result.types || [],
    });
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
