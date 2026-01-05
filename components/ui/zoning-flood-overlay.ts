// Example GeoJSON overlays for zoning and flooding
export const zoningOverlay = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-122.43, 37.77],
          [-122.41, 37.77],
          [-122.41, 37.78],
          [-122.43, 37.78],
          [-122.43, 37.77]
        ]]
      },
      "properties": { "zone": "Commercial" }
    }
  ]
};

export const floodOverlay = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-122.42, 37.775],
          [-122.415, 37.775],
          [-122.415, 37.78],
          [-122.42, 37.78],
          [-122.42, 37.775]
        ]]
      },
      "properties": { "flood": "100-year" }
    }
  ]
};
