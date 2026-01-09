# Quick Demo Validation - Curl Commands

## Step 1: Test Anonymous FeatureServer Access

### 1a. Query All Features (No Geometry)
```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1" \
  -H "Accept: application/json" | jq '.'
```

**Expected Response**:
```json
{
  "objectIdFieldName": "OBJECTID",
  "geometryType": "esriGeometryPolygon",
  "spatialReference": { "wkid": 4326 },
  "features": [
    {
      "attributes": {
        "OBJECTID": 1,
        "APN": "...",
        "ADDRESS": "...",
        "OWNER": "...",
        ...
      }
    }
  ]
}
```

✅ **Success**: Got features back (San Miguel County parcels)
❌ **Failed**: "Token required" or "error" field

---

### 1b. Check Available Fields

```bash
curl "https://services.arcgis.com/aXqye4IXyXsdIpPb/arcgis/rest/services/TaxParcelsPublic/FeatureServer/0?f=json" \
  -H "Accept: application/json" | jq '.fields'
```

Look for fields like:
- `APN` (Assessor Parcel Number)
- `OBJECTID` (unique parcel ID)
- `ADDRESS` (address display)
- `OWNER` (owner name)
- Any zoning or area fields

---

## Step 2: Query by Parcel ID

### 2a. Using PARCEL_ID field

```bash
PARCEL_ID="12345678"  # Replace with real parcel ID from Step 1

curl "https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0/query?where=PARCEL_ID%3D%27${PARCEL_ID}%27&outFields=*&returnGeometry=true&f=json" \
  -H "Accept: application/json" | jq '.'
```

### 2b. Using APN field (if PARCEL_ID doesn't work)

```bash
APN="12-34-567-890"  # Replace with real APN

curl "https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0/query?where=APN%3D%27${APN}%27&outFields=*&returnGeometry=true&f=json" \
  -H "Accept: application/json" | jq '.'
```

**Expected Response:**
```json
{
  "features": [
    {
      "attributes": {
        "PARCEL_ID": "12345678",
        "ADDRESS": "123 Main St",
        "OWNER": "John Doe",
        ...
      },
      "geometry": {
        "rings": [
          [[lon, lat], [lon, lat], ...]  // polygon coordinates
        ]
      }
    }
  ]
}
```

✅ **Success**: Got geometry in response
❌ **Failed**: "features": [] (empty)

---

## Step 3: Extract Geometry and Calculate Extent

### 3a. Get Parcel Response and Extract Geometry

```bash
PARCEL_ID="12345678"

PARCEL=$(curl -s "https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0/query?where=PARCEL_ID%3D%27${PARCEL_ID}%27&outFields=*&returnGeometry=true&f=json")

# Extract geometry
GEOMETRY=$(echo $PARCEL | jq '.features[0].geometry')

echo "Geometry:"
echo $GEOMETRY | jq '.'
```

### 3b. Calculate Bounding Box from Polygon

```bash
GEOMETRY=$(echo $PARCEL | jq '.features[0].geometry')

# Get first ring (outer boundary)
RINGS=$(echo $GEOMETRY | jq '.rings[0]')

# Calculate min/max coordinates
XMIN=$(echo $RINGS | jq 'map(.[0]) | min')
YMIN=$(echo $RINGS | jq 'map(.[1]) | min')
XMAX=$(echo $RINGS | jq 'map(.[0]) | max')
YMAX=$(echo $RINGS | jq 'map(.[1]) | max')

echo "Extent: [$XMIN, $YMIN, $XMAX, $YMAX]"

# Create bbox parameter
BBOX="${XMIN},${YMIN},${XMAX},${YMAX}"
echo "Map bbox: $BBOX"
```

---

## Step 4: Request Map Image

### 4a. Generate Map Export URL

```bash
# Using extent from Step 3
BBOX="-104.99,39.73,-104.98,39.74"  # Replace with actual extent

MAP_SERVER="https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/MapServer"

MAP_EXPORT_URL="${MAP_SERVER}/export?bbox=${BBOX}&size=600,400&dpi=96&format=png&transparent=true&f=image"

echo "Map URL: $MAP_EXPORT_URL"
```

### 4b. Download Map Image

```bash
curl "$MAP_EXPORT_URL" \
  -H "Accept: image/png" \
  -o map-image.png \
  -v

# Check if file was created
file map-image.png

# Or view the image
# open map-image.png  (macOS)
# xdg-open map-image.png  (Linux)
# start map-image.png  (Windows)
```

✅ **Success**: PNG file created and is valid image
❌ **Failed**: File is empty or error message

---

## Step 5: Full Pipeline One-Liner

### 5a. Get Parcel Data

```bash
PARCEL_ID="12345678"

curl -s "https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0/query?where=PARCEL_ID%3D%27${PARCEL_ID}%27&outFields=*&returnGeometry=true&f=json" | \
  jq '{
    address: .features[0].attributes.ADDRESS,
    owner: .features[0].attributes.OWNER,
    geometry: .features[0].geometry,
    extent: {
      xmin: (.features[0].geometry.rings[0] | map(.[0]) | min),
      ymin: (.features[0].geometry.rings[0] | map(.[1]) | min),
      xmax: (.features[0].geometry.rings[0] | map(.[0]) | max),
      ymax: (.features[0].geometry.rings[0] | map(.[1]) | max)
    }
  }'
```

Output:
```json
{
  "address": "123 Main St",
  "owner": "John Doe",
  "geometry": { ... },
  "extent": {
    "xmin": -104.99,
    "ymin": 39.73,
    "xmax": -104.98,
    "ymax": 39.74
  }
}
```

### 5b. Get Map Image

```bash
# Set extent from above
BBOX="-104.99,39.73,-104.98,39.74"

curl -s "https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/MapServer/export?bbox=${BBOX}&size=600,400&format=png&transparent=true&f=image" \
  -o map.png

ls -lh map.png
```

---

## Troubleshooting

### "Token required" Error

```bash
# Error response:
{
  "error": {
    "code": 498,
    "message": "Invalid token",
    "details": []
  }
}
```

**Solution**: Use a public (no-token-required) layer
- Try: `https://services.arcgisonline.com/arcgis/rest/services/Public/`
- Or search ArcGIS Online for public parcel data

### "Layer not found" (404)

```bash
# Error response:
{
  "error": {
    "code": 404,
    "message": "Not Found",
    "details": []
  }
}
```

**Solution**: Verify URL is correct
```bash
# Test if Feature Server exists
curl "https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0?f=json"

# List available services
curl "https://services.arcgisonline.com/arcgis/rest/services?f=json"
```

### No Geometry Returned

```bash
# Missing geometry:
{
  "features": [
    {
      "attributes": { ... },
      "geometry": null
    }
  ]
}
```

**Solution**: Add `returnGeometry=true` parameter
```bash
# Make sure URL includes:
&returnGeometry=true&geometryPrecision=6
```

### Empty Features List

```bash
{
  "features": []
}
```

**Solution**: Check field names and query syntax
```bash
# First, list all available fields:
curl "https://services.arcgisonline.com/arcgis/rest/services/.../FeatureServer/0?f=json" | jq '.fields'

# Then verify field name in WHERE clause matches
# Common variations:
# - PARCEL_ID vs ParcelID vs parcel_id
# - APN vs Apn
# - ADDRESS vs Address vs address
```

---

## Demo Workspace Configuration

Once you verify these tests pass, set `.env`:

```env
# Public, no-auth-required ESRI services
ESRI_FEATURE_SERVICE_URL=https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/FeatureServer/0
ESRI_MAP_SERVICE_URL=https://services.arcgisonline.com/arcgis/rest/services/Public/NationalParcelData/MapServer

# No API key needed for public services
ESRI_API_KEY=

# Google Maps (for Address Lookup)
GOOGLE_MAPS_API_KEY=your-google-api-key-here
```

---

## Next Steps

- [ ] Find a public parcel FeatureServer (ArcGIS Online or county GIS)
- [ ] Run `curl` tests from this guide (Steps 1-4)
- [ ] Verify all return 200 OK with data
- [ ] Run `test-demo-pipeline.sh` script
- [ ] Update `.env` with URLs
- [ ] Test Address Lookup tool in app
- [ ] Create demo workspace
- [ ] Generate test PDFs

✅ **Ready to demo!**
