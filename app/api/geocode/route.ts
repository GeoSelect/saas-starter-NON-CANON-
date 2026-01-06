import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/geocode
 * Geocode an address using Google Geocoding API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address is required' },
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
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}`, details: data.error_message },
        { status: 400 }
      );
    }

    // Return first result with lat/lng
    const result = data.results[0];
    return NextResponse.json({
      address: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      bounds: result.geometry.bounds,
      placeId: result.place_id,
      addressComponents: result.address_components,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}
