# Google Maps API Integration Setup

This document explains how to set up Google Maps APIs for live address search and parcel details.

## Overview

The application now integrates with Google Maps APIs for:
- **Places Autocomplete**: Real-time address suggestions as users type
- **Geocoding**: Converting addresses to coordinates (lat/lng)
- **Street View**: Embedded maps showing property locations
- **Place Details**: Getting detailed information about addresses

## Setup Steps

### 1. Get Google Cloud API Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Street View Static API** (optional, for more features)
4. Create an API Key:
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the API key

### 2. Configure Environment Variables

Create/update `.env.local` file in the project root:

```bash
# Google Maps API Key (used for all services)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Optional: Separate keys for different services
# NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=...
# NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY=...
```

### 3. Set API Restrictions (Recommended)

In Google Cloud Console:
1. Select your API key
2. Set **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add: `localhost`, `localhost:3000`, your production domain
3. Set **API restrictions**:
   - Select the specific APIs you're using:
     - Maps JavaScript API
     - Places API
     - Geocoding API

### 4. Test the Integration

#### Search Page (`/search`)
1. Navigate to the search page
2. Start typing an address (e.g., "123 Main St")
3. You should see real Google Places suggestions appear
4. Select an address to search

#### View Page (`/search/view?address=...`)
1. From search page, select an address
2. The page will geocode the address and display an embedded Google Map
3. The coordinates should display at the top

## API Routes

### `/api/geocode?address=...`
Converts an address to latitude/longitude coordinates.

**Query Parameters:**
- `address` (required): The address to geocode

**Response:**
```json
{
  "address": "123 Mountain View Road, Telluride, CO 81435",
  "location": {
    "lat": 37.9377,
    "lng": -106.9167
  },
  "placeId": "...",
  "addressComponents": [...]
}
```

### `/api/places/autocomplete?input=...`
Gets address suggestions as user types.

**Query Parameters:**
- `input` (required): Minimum 2 characters
- `componentRestrictions` (optional): e.g., "country:us"
- `sessionToken` (optional): For session-based tracking

**Response:**
```json
{
  "predictions": [
    {
      "placeId": "...",
      "description": "123 Mountain View Road, Telluride, CO 81435, USA",
      "mainText": "123 Mountain View Road",
      "secondaryText": "Telluride, CO 81435, USA"
    }
  ]
}
```

### `/api/places/details?placeId=...`
Gets detailed information about a place.

**Query Parameters:**
- `placeId` (required): Place ID from autocomplete

**Response:**
```json
{
  "placeId": "...",
  "name": "123 Mountain View Road",
  "formattedAddress": "123 Mountain View Road, Telluride, CO 81435, USA",
  "location": {
    "lat": 37.9377,
    "lng": -106.9167
  },
  "addressComponents": [...],
  "phone": "...",
  "website": "...",
  "types": [...]
}
```

## Using the React Hooks

The application includes custom hooks for easy integration:

### `useGooglePlacesAutocomplete()`
```tsx
const { suggestions, loading, error, getAutocomplete, setSuggestions } = useGooglePlacesAutocomplete();

// Get suggestions
const handleChange = (value) => {
  if (value.length > 2) {
    getAutocomplete(value);
  } else {
    setSuggestions([]);
  }
};
```

### `useGoogleGeocoding()`
```tsx
const { result, loading, error, geocode } = useGoogleGeocoding();

// Geocode an address
const handleSearch = async (address) => {
  const result = await geocode(address);
  console.log(result.location); // { lat, lng }
};
```

### `useGoogleMaps()` (Combined)
```tsx
const { autocomplete, placeDetails, geocoding } = useGoogleMaps();

// Use all three services
```

## Usage Examples

### Example 1: Search Page
See `app/search/page.tsx` for implementation.

### Example 2: View Page with Embedded Map
See `app/search/view/page.tsx` for implementation.

## Billing & Cost Optimization

### Tips to minimize costs:
1. **Use Session Tokens**: Group related requests in a session to get discounted rates
2. **Cache Results**: Store geocoding results to avoid redundant API calls
3. **Set Daily Limits**: In Google Cloud Console, set daily quota limits
4. **Monitor Usage**: Check the Google Cloud Console dashboard regularly

### Typical costs:
- Places Autocomplete: $0.0075 per request (capped at $7 for every 1000 requests)
- Geocoding: $0.005 per request
- Street View Static: $0.007 per request

## Troubleshooting

### "API key not configured" error
- Check that `GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Restart the development server after adding the environment variable

### "Invalid API key" error
- Verify the API key in Google Cloud Console
- Check that the APIs are enabled for this key
- Verify HTTP referrer restrictions match your domain

### No suggestions appearing
- Check browser console for errors
- Verify Places API is enabled
- Ensure API key has correct restrictions

### Map not loading
- Check that Street View API is enabled
- Verify the address can be geocoded
- Check HTTP referrer restrictions

## API Key Security

### Never expose your API key in frontend code!
- Use environment variables with `NEXT_PUBLIC_` prefix for public keys
- Use server-side environment variables for sensitive operations
- Restrict your API keys using HTTP referrer restrictions

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps)
- [Places API Guide](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Geocoding API Guide](https://developers.google.com/maps/documentation/geocoding/overview)
- [Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)

## Next Steps

1. Add API keys to `.env.local`
2. Test the search page with real addresses
3. Monitor API usage in Google Cloud Console
4. Consider adding parcel-specific data from other sources (county assessor, etc.)
5. Implement caching strategy for better performance
