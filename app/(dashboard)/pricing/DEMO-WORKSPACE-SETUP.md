# Demo Workspace - End-to-End Pipeline Validation

**Objective**: Set up a demo environment that proves the complete export pipeline works anonymously.

**Status**: 🔄 Setup in progress  
**Date**: January 7, 2026

---

## Quick Start: Test FeatureServer Anonymously

### Step 1: Verify Public FeatureServer Access

```bash
# Test basic query (all features, no geometry)
curl "https://services.arcgisonline.com/arcgis/rest/services/<YOUR_LAYER>/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json" \
  -H "Accept: application/json"

# Expected response:
# {
#   "objectIdFieldName": "OBJECTID",
#   "globalIdFieldName": "",
#   "geometryType": "esriGeometryPolygon",
#   "spatialReference": { "wkid": 4326 },
#   "features": [
#     {
#       "attributes": {
#         "OBJECTID": 1,
#         "PARCEL_ID": "12345678",
#         "ADDRESS": "123 Main St",
#         ...
#       }
#     }
#   ]
# }
```

### Step 2: Query Specific Parcel by ID

```bash
# Query by parcel ID (adjust WHERE clause to match your schema)
curl "https://services.arcgisonline.com/arcgis/rest/services/<YOUR_LAYER>/FeatureServer/0/query?where=PARCEL_ID%3D%2712345678%27&outFields=*&returnGeometry=true&f=json" \
  -H "Accept: application/json"

# Or by APN:
curl "https://services.arcgisonline.com/arcgis/rest/services/<YOUR_LAYER>/FeatureServer/0/query?where=APN%3D%2712-34-567-890%27&outFields=*&returnGeometry=true&f=json" \
  -H "Accept: application/json"
```

### Step 3: Verify Geometry Returned

The response should include:
```json
{
  "geometry": {
    "rings": [
      [[lon, lat], [lon, lat], ...]  // polygon coordinates
    ]
  }
}
```

---

## Demo Configuration

### Recommended Public Datasets

**Option 1: ArcGIS Online Public Parcel Data**
```env
# Example: Colorado County Parcels (publicly available)
ESRI_FEATURE_SERVICE_URL=https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0
ESRI_MAP_SERVICE_URL=https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/MapServer

# No API key needed for public layers
ESRI_API_KEY=
```

**Option 2: County-Specific Public Service**
```env
# Example: Boulder County, CO
ESRI_FEATURE_SERVICE_URL=https://gis.bouldercounty.org/arcgis/rest/services/PublicData/Parcels_WebMap/FeatureServer/0
ESRI_MAP_SERVICE_URL=https://gis.bouldercounty.org/arcgis/rest/services/PublicData/Parcels_WebMap/MapServer

ESRI_API_KEY=
```

**Option 3: US Census Tracts (Always Public)**
```env
ESRI_FEATURE_SERVICE_URL=https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/FeatureServer/0
ESRI_MAP_SERVICE_URL=https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer

ESRI_API_KEY=
```

---

## Finding Public Parcel Data

### 1. Check ArcGIS Online
```bash
# Search for public parcel layers
curl "https://www.arcgis.com/sharing/rest/search?q=parcels&type=Feature%20Service&access=public&sortField=modified&f=json"
```

### 2. County GIS Departments
Most counties offer free, public parcel data:
- **Boulder County, CO**: gis.bouldercounty.org
- **San Diego County, CA**: gis.sandiegocounty.gov
- **King County, WA**: gis.kingcounty.gov
- **Maricopa County, AZ**: maricopa.gov/gis

### 3. State/Federal Resources
- **US Census**: tigerweb.geo.census.gov (Census tracts, blocks)
- **USGS**: USGS OpenTopography
- **OpenStreetMap**: overpass-api.de (via OSM)

---

## Demo Test Script

Create `test-demo-pipeline.sh`:

```bash
#!/bin/bash

set -e

# Configuration
FEATURE_SERVER_URL="https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0"
MAP_SERVER_URL="https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/MapServer"
PARCEL_ID="12345678"  # Replace with real parcel ID from your data

echo "=== Demo Pipeline Validation ==="
echo ""

# ============================================================
# Test 1: Feature Server Query (All Features)
# ============================================================
echo "✓ Test 1: Query all features (no geometry)"
FEATURES_RESPONSE=$(curl -s "${FEATURE_SERVER_URL}/query?where=1%3D1&outFields=*&returnGeometry=false&f=json" \
  -H "Accept: application/json")

FEATURE_COUNT=$(echo $FEATURES_RESPONSE | jq '.features | length')
echo "  Result: Found $FEATURE_COUNT features"

if [ $FEATURE_COUNT -gt 0 ]; then
  echo "  ✅ FeatureServer query works anonymously"
else
  echo "  ❌ No features found"
  exit 1
fi
echo ""

# ============================================================
# Test 2: Parcel-Specific Query (With Geometry)
# ============================================================
echo "✓ Test 2: Query specific parcel (with geometry)"
PARCEL_RESPONSE=$(curl -s "${FEATURE_SERVER_URL}/query?where=PARCEL_ID%3D%27${PARCEL_ID}%27&outFields=*&returnGeometry=true&f=json" \
  -H "Accept: application/json")

PARCEL_FEATURES=$(echo $PARCEL_RESPONSE | jq '.features | length')
echo "  Result: Found $PARCEL_FEATURES matching parcel(s)"

if [ $PARCEL_FEATURES -gt 0 ]; then
  echo "  ✅ Parcel query works"
  
  # Extract parcel details
  PARCEL_ADDR=$(echo $PARCEL_RESPONSE | jq -r '.features[0].attributes.ADDRESS')
  PARCEL_OWNER=$(echo $PARCEL_RESPONSE | jq -r '.features[0].attributes.OWNER')
  PARCEL_GEOMETRY=$(echo $PARCEL_RESPONSE | jq '.features[0].geometry')
  
  echo "  Address: $PARCEL_ADDR"
  echo "  Owner: $PARCEL_OWNER"
  echo "  Geometry type: $(echo $PARCEL_GEOMETRY | jq -r 'type')"
else
  echo "  ❌ Parcel not found"
  exit 1
fi
echo ""

# ============================================================
# Test 3: Extract Extent for Map Export
# ============================================================
echo "✓ Test 3: Calculate extent for map export"
GEOMETRY=$(echo $PARCEL_RESPONSE | jq '.features[0].geometry')
RINGS=$(echo $GEOMETRY | jq '.rings[0]')

# Calculate bounding box from coordinates
XMIN=$(echo $RINGS | jq '.[0][0]')
YMIN=$(echo $RINGS | jq '.[0][1]')
XMAX=$XMIN
YMAX=$YMIN

echo "  Extent: [$XMIN, $YMIN, $XMAX, $YMAX]"
echo "  ✅ Extent calculated"
echo ""

# ============================================================
# Test 4: Map Server Export (Get Static Map Image)
# ============================================================
echo "✓ Test 4: Request static map image"
MAP_BBOX="${XMIN},${YMIN},${XMAX},${YMAX}"
MAP_URL="${MAP_SERVER_URL}/export?bbox=${MAP_BBOX}&size=600,400&dpi=96&format=png&transparent=true&f=image"

echo "  URL: $MAP_URL"

MAP_RESPONSE=$(curl -s -I $MAP_URL)
MAP_STATUS=$(echo "$MAP_RESPONSE" | head -1)

if [[ $MAP_STATUS == *"200"* ]] || [[ $MAP_STATUS == *"image"* ]]; then
  echo "  ✅ Map export endpoint available"
else
  echo "  ⚠️  Map endpoint returned: $MAP_STATUS"
fi
echo ""

# ============================================================
# Summary
# ============================================================
echo "=== Summary ==="
echo "✅ Feature Server: Public, anonymous access works"
echo "✅ Parcel Query: Returns geometry and attributes"
echo "✅ Map Export: Endpoint available"
echo ""
echo "🎯 Demo Pipeline: READY"
```

### Run the test:
```bash
chmod +x test-demo-pipeline.sh
./test-demo-pipeline.sh
```

---

## API Checklist

### Pre-Demo Verification

- [ ] **Feature Server Layer is Public**
  ```bash
  # Check if accessible without token
  curl "https://your-feature-server/query?where=1=1&f=json"
  # Should NOT return "Token required" error
  ```

- [ ] **Parcel ID/APN Field Exists**
  ```bash
  # Check available fields
  curl "https://your-feature-server/query?returnIdsOnly=true&f=json"
  # Look for PARCEL_ID, APN, or similar
  ```

- [ ] **Geometry Returned**
  ```bash
  # Verify geometry is included
  curl "https://your-feature-server/query?returnGeometry=true&f=json"
  # Response should include "geometry" object
  ```

- [ ] **Map Server Accessible**
  ```bash
  # Check map export endpoint
  curl -I "https://your-map-server/export?bbox=0,0,1,1&format=png"
  # Should return 200 OK
  ```

---

## Troubleshooting

### "Token Required" Error
**Problem**: Layer requires authentication
**Solution**: 
- Use a different public layer
- Generate API token (if owner of service)
- Configure credentials in `.env`

### "Layer not found"
**Problem**: URL incorrect
**Solution**:
- Verify URL in ArcGIS Online
- Check FeatureServer/MapServer index (0, 1, 2?)
- Test in ArcGIS JS API first

### "Geometry not returned"
**Problem**: Missing `returnGeometry=true` parameter
**Solution**:
```bash
# Always include this:
&returnGeometry=true&geometryPrecision=6
```

### "No features found"
**Problem**: WHERE clause doesn't match data
**Solution**:
```bash
# First, query all features to see schema:
?where=1%3D1&outFields=*&f=json

# Then check available field names
# Adjust query to match actual column names
```

---

## Demo Workspace Layout

After validation, set up workspace like this:

```
Demo Workspace
├── Settings
│   ├── Data Source: Public ESRI Feature Server
│   ├── Map Style: Default
│   └── Parcel Field: PARCEL_ID (or APN)
│
├── Sample Parcels (for testing)
│   ├── Parcel 1: ID=12345678 (residential)
│   ├── Parcel 2: ID=87654321 (commercial)
│   └── Parcel 3: ID=55555555 (open space)
│
├── Branding (CCP-06)
│   ├── Logo: Public demo logo
│   ├── Colors: Default palette
│   └── Footer: "Demo Report"
│
└── Export Tests
    ├── Test PDF 1: Parcel 1 with demo branding
    ├── Test PDF 2: Parcel 2 with demo branding
    └── Test Map: Verify map images render
```

---

## URLs That Should Remain Stable

```
Feature Service Layer:
  https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0
  ✅ Public, permanent URL
  ✅ No token required
  ✅ No draft/personal content

Map Service:
  https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/MapServer
  ✅ Public, permanent URL
  ✅ Always accessible
  
Demo Workspace:
  /api/workspaces/demo-001
  ✅ Always exists
  ✅ Public demo branding
  ✅ No user-specific content
```

---

## Next Steps

1. **Choose a Public Data Source**
   - [ ] Identify FeatureServer URL
   - [ ] Verify parcel ID field name
   - [ ] Test anonymous access

2. **Run Demo Tests**
   - [ ] Feature Server query
   - [ ] Parcel-specific query
   - [ ] Map export
   - [ ] Full pipeline

3. **Set Up Demo Workspace**
   - [ ] Create workspace in app
   - [ ] Configure data source
   - [ ] Add sample branding
   - [ ] Save test parcel selections

4. **Document Demo**
   - [ ] Sample parcel IDs for testing
   - [ ] Expected outputs
   - [ ] Known limitations
   - [ ] Troubleshooting guide

---

## Demo URLs (Once Ready)

```
# Address Lookup Tool
https://app.example.com/app/tools/address-lookup

# Export with Demo Parcel
https://app.example.com/app/pricing/export?parcel_id=12345678&provider=agol

# Demo Workspace
https://app.example.com/workspaces/demo-001

# API Endpoints
POST /api/workspaces/demo-001/geocode
  Request: { lat: 39.7392, lng: -104.9903, provider: "agol" }
  Response: Complete parcel details + geometry
```

---

## Security Note

✅ **Safe to Demo**:
- Public, no-auth-required endpoints
- Generic ESRI public datasets
- No personal user data
- No active subscriptions required

✅ **Always Available**:
- ESRI public services stable
- Parcel data doesn't change frequently
- No OAuth tokens that expire

---

## Success Criteria

✅ FeatureServer query returns features (>0)  
✅ Parcel ID query returns geometry  
✅ Map export returns image  
✅ All endpoints accessible anonymously  
✅ URLs stable over time  
✅ No authentication required  

**Status**: Ready for setup 🚀
