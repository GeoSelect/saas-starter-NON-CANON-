# Esri/ArcGIS Integration Guide

**Last Updated:** January 6, 2026  
**Status:** Ready for Integration

---

## 📋 Overview

You now have Esri API credentials configured in `.env.local`. This guide shows how to integrate Esri services into GeoSelect.It for real property data, mapping, and geospatial analysis.

## 🔐 Credentials Configured

✅ **API Key** (NEXT_PUBLIC_ESRI_API_KEY) - For public API requests  
✅ **Client ID** (ESRI_CLIENT_ID) - For OAuth/application authentication  
✅ **Client Secret** (ESRI_CLIENT_SECRET) - For server-side authentication  
✅ **API URL** (NEXT_PUBLIC_ESRI_API_URL) - ArcGIS REST API endpoint  

---

## 📦 Installation Steps

### Step 1: Install ArcGIS JavaScript SDK

```bash
pnpm add @arcgis/core @arcgis/mapping-library-core
pnpm add -D @types/arcgis-js-api
```

### Step 2: Add ArcGIS Styles to `app/globals.css`

```css
/* ArcGIS JavaScript Styles */
@import url("https://js.arcgis.com/4.27/esri/themes/dark/main.css");
```

### Step 3: Update `.env.local` ✅ (Already Done)

Credentials are configured. You can now use:
- `process.env.NEXT_PUBLIC_ESRI_API_KEY` in client components
- `process.env.ESRI_CLIENT_ID` and `ESRI_CLIENT_SECRET` server-side

---

## 🗺️ Available Esri Services

### 1. **Geocoding & Reverse Geocoding**
- Convert addresses to coordinates
- Convert coordinates to addresses
- **Function:** `geocodeAddress()`, `reverseGeocode()`
- **File:** `lib/esri/client.ts`
- **Use Case:** Address validation, property lookup

### 2. **Parcel Data Queries**
- Query parcel boundaries by location
- Get property attributes (lot size, year built, zoning, etc.)
- **Function:** `getParcelData()`
- **File:** `lib/esri/client.ts`
- **Use Case:** Property overview section

### 3. **Demographic & Market Data**
- Population statistics within radius
- Median income, education, employment
- Market trends and property valuations
- **Function:** `getPropertyDemographics()`
- **File:** `lib/esri/client.ts`
- **Use Case:** Market analysis, comparable properties

### 4. **Interactive Mapping**
- Display property on web map
- Show parcel boundaries
- Overlay risk layers (flood, wildfire, earthquake)
- **Component:** `EsriPropertyMap`, `ArcGISMapCore`
- **Files:** `components/EsriPropertyMap.tsx`, `components/ArcGISMapCore.tsx`
- **Use Case:** Replace Three.js globe with real property mapping

---

## 🚀 Integration Examples

### Example 1: Update Parcel Summary Page

Current file: `app/parcel/summary/page.tsx`

**Before (Mock Data):**
```tsx
const property = {
  address: '123 Main Street',
  bedrooms: 4,
  bathrooms: 3,
  // ... mock values
};
```

**After (Esri Data):**
```tsx
import { getParcelData, geocodeAddress } from '@/lib/esri/client';

export default async function ParcelSummaryPage() {
  // Get real data from Esri
  const geocoded = await geocodeAddress('123 Main Street, Telluride, CO');
  const parcelData = await getParcelData(
    geocoded?.location.y || 37.937,
    geocoded?.location.x || -107.811
  );
  
  const property = {
    address: parcelData?.address || '123 Main Street',
    bedrooms: parcelData?.properties.bedrooms,
    bathrooms: parcelData?.properties.bathrooms,
    // ... real data from Esri
  };
}
```

### Example 2: Replace 3D Globe with Esri Map

Current file: `components/InteractiveMapHero.tsx`

**Alternative:** Use `EsriPropertyMap` component

```tsx
import { EsriPropertyMap } from '@/components/EsriPropertyMap';

export default function PropertyHero() {
  return (
    <EsriPropertyMap
      latitude={37.937}
      longitude={-107.811}
      zoom={18}
      showParcelBoundary={true}
      height="h-96"
    />
  );
}
```

### Example 3: Add Market Analysis Section

Create new file: `app/parcel/market-analysis/page.tsx`

```tsx
import { getPropertyDemographics } from '@/lib/esri/client';

export default async function MarketAnalysisPage() {
  const demographics = await getPropertyDemographics(37.937, -107.811);
  
  return (
    <div>
      <h2>Market Analysis</h2>
      <p>Population (1 mile): {demographics.features[0].attributes['Wealth.TOTPOP_CY']}</p>
      <p>Median Income: ${demographics.features[0].attributes['Wealth.MEDHINC_CY']}</p>
    </div>
  );
}
```

---

## 📊 Next Steps

### Phase 1: Map Integration (Week 1)
- [ ] Install @arcgis/core
- [ ] Test basic map rendering on parcel summary page
- [ ] Replace Three.js globe with Esri map (optional)

### Phase 2: Property Data (Week 2)
- [ ] Connect parcel queries for real property data
- [ ] Update property overview section with Esri results
- [ ] Add parcel boundary visualization

### Phase 3: Enhanced Features (Week 3)
- [ ] Add flood zone/risk layer overlays
- [ ] Implement demographic analysis section
- [ ] Create market comparison reports
- [ ] Add property timeline (sales history)

### Phase 4: Advanced Features (Week 4+)
- [ ] Integrate Esri's Living Atlas data layers
- [ ] Add routing/drive-time analysis
- [ ] Implement neighborhood analysis
- [ ] Create heat maps for property values

---

## 🔗 API Endpoints Available

### Public APIs (Client-Side)
```
Geocoding:
https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/

Parcel Data:
https://services.arcgisonline.com/ArcGIS/rest/services/USA_Parcel_Locator/FeatureServer/

Geoenrichment:
https://geoenrichment.arcgis.com/arcgis/rest/services/GeoEnrichment/Enrich
```

### Authentication
All requests should include:
```
?token=YOUR_ESRI_API_KEY&f=json
```

---

## 🛠️ Troubleshooting

### "ArcGIS Core not installed"
```bash
pnpm add @arcgis/core
```

### "Invalid API Key"
- Check `.env.local` for correct `NEXT_PUBLIC_ESRI_API_KEY`
- Verify key is not expired in Esri Dashboard
- Ensure key has correct service permissions

### Rate Limiting
- Free tier: Limited API calls
- Monitor usage in Esri Dashboard
- Consider upgrade plan if limits exceeded

### CORS Issues
- API key must have CORS origins configured
- Add your domain to Esri Security settings

---

## 📚 Resources

- [Esri Documentation](https://developers.arcgis.com/)
- [ArcGIS JavaScript API](https://developers.arcgis.com/javascript/latest/)
- [Geocoding Service](https://developers.arcgis.com/rest/geocoding/api-reference/)
- [Feature Service Query](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service/)
- [Geoenrichment Service](https://developers.arcgis.com/rest/geoenrichment/api-reference/)

---

## 💰 Cost Tracking

**Current Usage:**
- API Key: Free tier (limited credits)
- Parcel data: Included in standard service
- Demographics: Requires Living Atlas subscription

**To Monitor:**
- Check Esri Dashboard for credit usage
- Track API requests in application logs
- Upgrade plan if approaching limits

---

## 🎯 Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Credentials | ✅ Configured | Ready to use |
| Client SDK | 📦 Not Installed | `pnpm add @arcgis/core` |
| Geocoding | 🎯 Ready | Can use immediately |
| Mapping | 🎯 Ready | Needs @arcgis/core |
| Parcel Data | 🎯 Ready | May need custom layer |
| Demographics | 🎯 Ready | Needs Living Atlas subscription |

---

**Next Action:** Run `pnpm add @arcgis/core` to enable interactive mapping features.
