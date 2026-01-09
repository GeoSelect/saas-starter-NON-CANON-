# Address Search Feature

Complete address lookup with Google Places autocomplete and geocoding integration.

## Overview

The address search feature allows users to find parcels by typing an address, with intelligent autocomplete suggestions and automatic parcel data lookup.

### Components

1. **Frontend UI** (`AddressSearch.tsx`)
   - Type-ahead autocomplete search box
   - Keyboard navigation (arrow keys, enter, escape)
   - Loading states and error handling
   - Visual feedback for suggestions

2. **Backend API** (`/api/workspaces/[id]/address-search`)
   - Autocomplete endpoint (returns predictions)
   - Search endpoint (returns address + parcel data)
   - Workspace authentication
   - Audit trail logging

3. **Google Places Integration** (`lib/integrations/google-places.ts`)
   - `getAddressAutocomplete()` - Get predictions
   - `geocodeAddress()` - Convert address to coordinates
   - `extractAddressComponents()` - Parse address details
   - `verifyGooglePlacesConfig()` - Validate API setup

## Features

### Autocomplete

- **Debounced input** (300ms) to reduce API calls
- **Location biasing** - Defaults to Colorado region
- **US-only results** - Filters international results
- **Keyboard navigation** - Arrow keys to select, Enter to confirm
- **Clear button** - Quick reset with X button
- **No results message** - Helpful feedback when nothing found

### Search

- **Full geocoding** - Converts address to lat/lng coordinates
- **Parcel lookup** - Automatically finds parcel at coordinates
- **Address components** - Extracts street, city, state, zip
- **Audit logging** - Tracks all searches for workspace
- **Error handling** - Graceful failures with user-friendly messages

### User Experience

- **Loading indicators** - Shows spinner during API calls
- **Click outside** - Auto-closes suggestions
- **Selected state** - Visual highlight for keyboard selection
- **Disabled state** - Input disabled during search
- **Error messages** - Clear error display with helpful context

## Setup

### Prerequisites

1. **Google Maps API Key**
   ```bash
   # Add to .env.local
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

   Get key from [Google Cloud Console](https://console.cloud.google.com/):
   - Create project
   - Enable "Maps JavaScript API" and "Geocoding API"
   - Create API key (restrict to your domain)

2. **Database** - Needs `workspace_audit_log` table:
   ```sql
   CREATE TABLE workspace_audit_log (
     id UUID PRIMARY KEY,
     workspace_id VARCHAR NOT NULL,
     user_id VARCHAR NOT NULL,
     action VARCHAR NOT NULL,
     resource_type VARCHAR,
     resource_id VARCHAR,
     changes JSONB,
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Installation

1. **Verify files are in place**
   ```
   app/
   ├── api/workspaces/[id]/address-search/route.ts
   ├── (dashboard)/tools/address-lookup/components/AddressSearch.tsx
   ├── lib/
   │   ├── hooks/use-debounce.ts
   │   └── integrations/google-places.ts
   └── __tests__/
       └── integrations/google-places.integration.test.ts
   ```

2. **Update Address Lookup page** to include component:
   ```tsx
   import { AddressSearch } from './components/AddressSearch';

   export default function AddressLookupPage() {
     return (
       <div>
         <AddressSearch 
           workspaceId={workspaceId}
           onSelect={(result) => {
             // Load parcel data with result
             console.log('Selected:', result);
           }}
         />
         {/* Rest of page */}
       </div>
     );
   }
   ```

3. **Install dependencies** (if needed)
   ```bash
   pnpm install
   ```

## Usage

### Basic Example

```tsx
import { AddressSearch } from '@/app/(dashboard)/tools/address-lookup/components/AddressSearch';

function MyComponent({ workspaceId }) {
  return (
    <AddressSearch
      workspaceId={workspaceId}
      onSelect={(result) => {
        console.log('Address:', result.address);
        console.log('Coordinates:', result.lat, result.lng);
        console.log('Parcel:', result.parcel);
      }}
      placeholder="Search San Miguel County..."
    />
  );
}
```

### Result Object

```typescript
{
  address: "123 Main St, Telluride, CO 81435, USA",
  lat: 37.9369,
  lng: -107.8122,
  parcel?: {
    id: "parcel-12345",
    address: "123 MAIN ST",
    owner: "John Doe",
    zoning: "Commercial",
    apn: "1234-0000-12345"
  },
  components?: {
    streetNumber: "123",
    streetName: "Main St",
    city: "Telluride",
    state: "CO",
    zipCode: "81435"
  }
}
```

## API Endpoints

### POST `/api/workspaces/[id]/address-search`

#### Autocomplete Request
```json
{
  "address": "Main St",
  "type": "autocomplete"
}
```

#### Autocomplete Response
```json
{
  "suggestions": [
    {
      "placeId": "ChIJ...",
      "description": "Main Street, Telluride, CO, USA",
      "mainText": "Main Street",
      "secondaryText": "Telluride, CO, USA"
    }
  ]
}
```

#### Search Request
```json
{
  "address": "123 Main Street, Telluride, CO",
  "type": "search"
}
```

#### Search Response
```json
{
  "address": "123 Main Street, Telluride, CO 81435, USA",
  "coordinates": {
    "lat": 37.9369,
    "lng": -107.8122
  },
  "parcel": {
    "id": "parcel-12345",
    "address": "123 MAIN ST",
    "owner": "John Doe",
    "zoning": "Commercial",
    "apn": "1234-0000-12345"
  },
  "components": {
    "streetNumber": "123",
    "streetName": "Main Street",
    "city": "Telluride",
    "state": "CO",
    "zipCode": "81435"
  }
}
```

### Error Responses

```json
{
  "error": "Address search failed",
  "details": "ZERO_RESULTS"
}
```

Status codes:
- `200` - Success
- `400` - Invalid input or API error
- `401` - Unauthorized
- `403` - Forbidden (not workspace member)
- `500` - Server error

## Testing

### Unit Tests
```bash
pnpm test -- google-places.integration.test.ts
```

Tests cover:
- Autocomplete predictions
- Geocoding accuracy
- Address component extraction
- Error handling
- API key validation
- Rate limiting

### E2E Tests
```bash
npm run test:e2e -- address-search.spec.ts
```

Tests cover:
- Full search workflow
- Keyboard navigation
- Suggestion selection
- Parcel data loading
- Error messages
- Map updates

### Manual Testing

1. **Local testing**
   ```bash
   pnpm dev
   # Navigate to address-lookup tool
   # Type address in search box
   # Select suggestion
   # Verify parcel details appear
   ```

2. **Test addresses** (San Miguel County, CO)
   - "123 Main Street, Telluride, CO"
   - "Telluride Colorado"
   - "Colorado Avenue"
   - "Pine Street"

## Troubleshooting

### "API key not configured"
- Check `.env.local` has `GOOGLE_MAPS_API_KEY`
- Verify key has Places and Geocoding APIs enabled
- Check key is not restricted to wrong domain

### "Zero results"
- Address may not exist or be outside US
- Try partial address (city name alone)
- Verify correct spelling
- Check location bias settings

### "Rate limit exceeded"
- API quota exhausted for the day
- Check Google Cloud Console for quota
- Implement exponential backoff in retry logic
- Consider caching results

### "Parcel not found"
- Address may not have corresponding parcel
- Coordinates may be outside parcel layer
- Parcel data layer may be down
- Check ESRI Feature Server status

### Slow autocomplete
- Debounce timing too short (increase from 300ms)
- Network latency - check API response times
- Too many results - results are limited to top 5

## Performance

### Optimization Tips

1. **Debounce timing** - Currently 300ms
   ```tsx
   const debouncedInput = useDebounce(input, 500); // Increase if needed
   ```

2. **Location biasing** - Reduces irrelevant results
   ```typescript
   // Customize in google-places.ts
   const bounds = {
     northeast: { lat: 41, lng: -102 },
     southwest: { lat: 36.9, lng: -109 }
   };
   ```

3. **Result caching** - Add client-side cache for recent searches
   ```tsx
   const [cache, setCache] = useState(new Map());
   ```

4. **Parcel lookup** - Make optional to speed up autocomplete
   ```typescript
   // In endpoint, only geocode on type: 'search'
   ```

## Configuration

### Environment Variables

```env
# Required
GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional (with defaults)
GOOGLE_PLACES_REGION=US
GOOGLE_PLACES_LANGUAGE=en
```

### Component Props

```typescript
interface AddressSearchProps {
  workspaceId: string;                    // Required: workspace ID
  onSelect?: (result: SearchResult) => void;  // Callback on selection
  placeholder?: string;                   // Input placeholder
  className?: string;                     // Additional CSS classes
}
```

## Security

### API Key Protection
- Key stored in `.env.local` (not committed)
- Only exposed server-side
- Client calls backend endpoint (not Google directly)
- No API key exposed to browser

### Authentication
- All requests require user login
- Workspace membership verified
- User ID in audit log
- Actions logged for compliance

### Validation
- Input length limits (max 200 chars)
- API response validated with Zod schemas
- Address components sanitized
- Error messages don't expose API details

## Analytics

### Logged Events

All searches logged to `workspace_audit_log`:

```typescript
{
  workspace_id: "workspace-123",
  user_id: "user-456",
  action: "ADDRESS_SEARCH",
  resource_type: "address_lookup",
  changes: {
    address: "123 Main Street, Telluride, CO",
    lat: 37.9369,
    lng: -107.8122,
    parcelFound: true
  },
  timestamp: "2024-01-15T10:30:45Z"
}
```

### Metrics to Monitor

- Total searches per day
- Average search latency
- Success rate (parcel found %)
- Most searched addresses
- Error rates by type

## Related Documentation

- [GIS Data Sources](./GIS-DATA-SOURCES.md) - Dataset catalog
- [Google Places API](https://developers.google.com/maps/documentation/places)
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Zod Validation](https://zod.dev/)

## Examples

### Integration with Parcel Details

```tsx
function AddressLookupPage() {
  const [selectedParcel, setSelectedParcel] = useState(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <AddressSearch
        workspaceId={workspaceId}
        onSelect={(result) => {
          // Load parcel details
          if (result.parcel) {
            setSelectedParcel(result.parcel);
          } else {
            // Fetch parcel by coordinates
            fetchParcelAtCoordinates(result.lat, result.lng);
          }
        }}
      />
      {selectedParcel && (
        <ParcelDetailsCard parcel={selectedParcel} />
      )}
    </div>
  );
}
```

### Custom Error Handling

```tsx
<AddressSearch
  workspaceId={workspaceId}
  onSelect={(result) => {
    // Handle result
  }}
/>
```

## Future Enhancements

- [ ] Support multiple address providers (AGOL, MapBox)
- [ ] Recent searches cache
- [ ] Saved favorite addresses
- [ ] Bulk address import
- [ ] Address validation API
- [ ] Multi-region support
- [ ] Custom location biasing per workspace

## Support

For issues or questions:
1. Check [troubleshooting section](#troubleshooting)
2. Review error logs in workspace audit trail
3. Check Google Cloud Console for API quota
4. Open issue with workspace ID and search query
