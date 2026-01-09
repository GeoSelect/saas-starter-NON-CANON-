# GIS Data Sources Registry

**Last Updated**: January 7, 2026  
**Maintainer**: Development Team  
**Status**: 🟢 **San Miguel County - Ready for Demo**

---

## Overview

This document catalogs all GIS datasets used in the application for demo, testing, and development. All datasets are public and require no authentication.

---

## Active Datasets

### 🟢 San Miguel County Tax Parcels (ACTIVE - DEMO READY)

**Best For**: Production demo, development, testing

```
📍 Location: San Miguel County, Colorado, USA
🏢 Owner: San Miguel County GIS Department
✅ Public Access: Yes (no auth required)
📅 Data Updated: January 6, 2026
```

#### URLs

**Feature Server** (Query, retrieve geometry):
```
https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0
```

**Map Server** (Export maps, get images):
```
https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/MapServer
```

**ArcGIS Online Item** (Metadata):
```
https://www.arcgis.com/home/item.html?id=eea65c8c64fd40919fc8bed6678c7901&sublayer=0
```

#### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `OBJECTID` | OID | Unique identifier (primary key) |
| `APN` | String | Assessor Parcel Number |
| `ADDRESS` | String | Street address |
| `OWNER` | String | Property owner name |
| `ACREAGE` | Double | Parcel size in acres |

#### Extent

```
North: 38.2°
South: 38.0°
East: -108.3°
West: -108.5°
```

#### Quick Test

**Get 1 feature (no geometry)**:
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0/query?where=1=1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1"
```

**Get parcel with geometry**:
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0/query?where=OBJECTID=1&outFields=*&returnGeometry=true&f=json"
```

**Export map image**:
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/MapServer/export?bbox=-108.5,38.0,-108.3,38.2&size=600,400&format=png&f=image" -o map.png
```

---

### 🟡 San Miguel County Open Data Hub (RESEARCH)

**Best For**: Discovering additional datasets, exploring other layers

```
📍 Location: San Miguel County, Colorado, USA
🏢 Owner: San Miguel County GIS/IT Department
✅ Public Access: Yes (no auth required)
🔗 Hub URL: https://data-hub-sanmiguelco.opendata.arcgis.com/
```

This is the **official source** for all San Miguel County GIS data. It may contain:
- Additional parcel datasets
- Zoning information
- Infrastructure layers
- Property assessor data
- Land use classifications
- Subdivision boundaries
- Hazard overlays (fire, flood, etc.)
- **Address Points** (found: Dataset ID ccce2230e5a540b8b418bcb105978e13_5)

#### How to Discover Layers

1. Visit: https://data-hub-sanmiguelco.opendata.arcgis.com/
2. Click **"Data"** to browse all datasets
3. Click **"Maps"** to browse all maps and visualizations
4. Find a dataset you want to use
5. Click the dataset to view details
6. Right-click the layer in legend → **"View item details"**
7. Copy the Feature Server URL
8. Add it to this registry using the template below

---

### 🟢 San Miguel County Addresses - Structure Points (ACTIVE - VERIFIED)

**Best For**: Reverse geocoding, address lookup, linking addresses to parcels

```
📍 Location: San Miguel County, Colorado, USA
🏢 Owner: San Miguel County GIS Department
✅ Public Access: Yes (no auth required)
📅 Data Updated: Real-time (edited by county)
🔗 Type: Point geometry (building centroids)
```

#### URLs

**Feature Server** (Query address points):
```
https://services.arcgis.com/aXqye4IXyXsdIpPb/ArcGIS/rest/services/Addresses_Public/FeatureServer/0
```

**ArcGIS Open Data Record** (Metadata & Downloads):
```
https://data-hub-sanmiguelco.opendata.arcgis.com/datasets/ccce2230e5a540b8b418bcb105978e13_5
```

#### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `OBJECTID` | OID | Unique identifier |
| `FSAN` | String | Full Site Address Number (display field) |
| `FSA` | String | Full Street Address |
| `NAME1` | String | Owner Name |
| `PIN` | String | Parcel ID (links to parcel layer!) |
| `MCN` | String | MSAG Community (city/town name) |
| `LAT` | Double | Latitude |
| `LON` | Double | Longitude |

#### Quick Test

**Get 1 address point**:
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/ArcGIS/rest/services/Addresses_Public/FeatureServer/0/query?where=1=1&outFields=OBJECTID,FSAN,FSA,NAME1,PIN,MCN&returnGeometry=true&f=json&resultRecordCount=1"
```

**Search by address**:
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/ArcGIS/rest/services/Addresses_Public/FeatureServer/0/query?where=FSA%20LIKE%20'%Main%'&outFields=*&returnGeometry=true&f=json"
```

**Get all addresses in Telluride**:
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/ArcGIS/rest/services/Addresses_Public/FeatureServer/0/query?where=MCN='TELLURIDE'&outFields=*&returnGeometry=true&f=json&resultRecordCount=100"
```

#### Why This Matters

- **PIN field** links directly to parcel data (allows address → parcel lookup)
- **Point geometry** is ideal for map markers, reverse geocoding
- **Owner name** matches parcel owner information
- **Web Mercator projection** (3857) compatible with MapLibre GL
- **Real-time updates** from county assessment system

---

## Status Summary

| Dataset | Status | Demo Ready | Type | Geometry |
|---------|--------|-----------|------|----------|
| San Miguel County Tax Parcels | 🟢 Active | ✅ Yes | Parcels | Polygon |
| **San Miguel County Addresses** | 🟢 **Active** | ✅ **Yes** | **Buildings** | **Point** |
| San Miguel County Open Data Hub | 🟡 Catalog | ❌ No | Multi | Various |
| Placeholder (Template) | ⚪ Template | ❌ No | Template | Template |

---

**Both primary datasets ready to use!** Parcel lookup + Address search = complete location-based workflow.

---

## Configuration

### Environment Variables

Add to `.env` or `.env.local`:

```env
# Primary GIS data source (San Miguel County Tax Parcels)
ESRI_FEATURE_SERVICE_URL=https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0
ESRI_MAP_SERVICE_URL=https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/MapServer

# No API key needed for public services
ESRI_API_KEY=
```

### Test Script

Run the demo validation script:

```bash
./scripts/test-demo-pipeline.sh \
  --feature-server "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0" \
  --map-server "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/MapServer"
```

---

## Adding New Datasets

### Step 1: Find a Public GIS Dataset

Options:
- **ArcGIS Online**: https://arcgis.com/home/search.html (search "public parcel data")
- **County GIS Departments**: Most publish public parcel data
- **State Resources**: USGS, state GIS offices
- **Federal Resources**: Census Bureau, NOAA

### Step 2: Verify Public Access

```bash
# Test Feature Server (no token required)
curl "https://services.arcgis.com/YOUR_ORG/arcgis/rest/services/YOUR_SERVICE/FeatureServer/0?f=json"

# If you get JSON back (no error), it's public
# If you get "Token required", it needs authentication
```

### Step 3: Get Metadata

```bash
# Fetch all layer information
curl "https://services.arcgis.com/YOUR_ORG/arcgis/rest/services/YOUR_SERVICE/FeatureServer/0?f=json" | jq '.'

# Get field definitions
curl "https://services.arcgis.com/YOUR_ORG/arcgis/rest/services/YOUR_SERVICE/FeatureServer/0?f=json" | jq '.fields'

# Get extent
curl "https://services.arcgis.com/YOUR_ORG/arcgis/rest/services/YOUR_SERVICE/FeatureServer/0?f=json" | jq '.extent'
```

### Step 4: Add to Registry

Edit `gis-data-registry.json` and add entry:

```json
{
  "id": "unique-dataset-id",
  "name": "Display Name",
  "type": "Tax Parcels",
  "location": "County, State",
  "owner": "Source Organization",
  "sourceUrl": "https://arcgis.com/home/item.html?id=...",
  "services": {
    "featureServer": {
      "url": "https://services.arcgis.com/...",
      "type": "FeatureServer",
      "layer": 0
    },
    "mapServer": {
      "url": "https://services.arcgis.com/.../MapServer",
      "type": "MapServer"
    }
  },
  "fields": [
    {
      "name": "FIELDNAME",
      "type": "esriFieldTypeString",
      "description": "What this field contains"
    }
  ],
  "extent": {
    "xmin": -x,
    "ymin": -y,
    "xmax": -x,
    "ymax": -y
  },
  "status": "active",
  "demoReady": true
}
```

### Step 5: Test

```bash
# Test feature retrieval
curl "https://your-feature-server/query?where=1=1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1"

# Test map export
curl "https://your-map-server/export?bbox=-x,y,-x,y&size=600,400&format=png&f=image" -o test.png
```

### Step 6: Update Environment

If this is your new primary dataset:

```env
ESRI_FEATURE_SERVICE_URL=https://your-feature-server/0
ESRI_MAP_SERVICE_URL=https://your-map-server
```

---

## Dataset Requirements

For a dataset to be "demo ready", it must have:

✅ **Public Access** - No authentication required  
✅ **Feature Server** - Can query and get geometry  
✅ **Map Server** - Can export map images  
✅ **Polygon Geometry** - Parcel boundaries  
✅ **Key Fields**:
  - Unique ID (OBJECTID or APN)
  - Address field
  - Owner field (optional but valuable)

---

## Troubleshooting

### "Token required" Error

```json
{
  "error": {
    "code": 498,
    "message": "Invalid token",
    "details": []
  }
}
```

**Solution**: Dataset requires authentication. Find a different public dataset.

### "No features found"

```json
{
  "features": []
}
```

**Solution**: Check field names in your WHERE clause. Run this to see available fields:

```bash
curl "https://your-feature-server/0?f=json" | jq '.fields[].name'
```

### Map Export Returns Error

**Solution**: Verify bbox format and extent values:
```bash
# Format: bbox=xmin,ymin,xmax,ymax
# Example: bbox=-108.5,38.0,-108.3,38.2
```

### Geometry Not Returned

**Add** `&returnGeometry=true` to query:

```bash
curl "https://your-feature-server/0/query?where=OBJECTID=1&outFields=*&returnGeometry=true&f=json"
```

---

## Demo Workflow

**1. Pick a dataset** (San Miguel County is pre-configured)

**2. Update environment**:
```bash
# Copy to .env.local
ESRI_FEATURE_SERVICE_URL=...
ESRI_MAP_SERVICE_URL=...
```

**3. Run tests**:
```bash
./scripts/test-demo-pipeline.sh
```

**4. Start app**:
```bash
pnpm dev
```

**5. Test Address Lookup**:
- Open: http://localhost:3000/app/tools/address-lookup
- Click on map to select parcel
- View parcel details card

**6. Test Export**:
- Open: http://localhost:3000/app/pricing/export
- Auto-load address from Address Lookup tool
- Generate PDF

---

## Reference Files

- `gis-data-registry.json` - Structured dataset catalog (JSON)
- `DEMO-WORKSPACE-SETUP.md` - Demo workspace configuration guide
- `DEMO-CURL-COMMANDS.md` - Ready-to-copy curl examples
- `scripts/test-demo-pipeline.sh` - Automated end-to-end validation
- `app/lib/integrations/esri.ts` - API integration code
- `app/lib/integrations/google-geocoding.ts` - Reverse geocoding helper

---

## Status Summary

| Dataset | Status | Demo Ready | Tested |
|---------|--------|-----------|--------|
| San Miguel County Parcels | 🟢 Active | ✅ Yes | ✅ Yes |
| Placeholder (Template) | ⚪ Template | ❌ No | ❌ No |

---

**Ready to use**! Pick San Miguel County or add your own datasets following the guide above.
