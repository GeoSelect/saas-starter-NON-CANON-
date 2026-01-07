// lib/config/esri.ts
// ESRI API Configuration for Free Tier (125 credits/day)

export const ESRI_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_ESRI_API_KEY || '',
  
  // Credit costs per operation (for usage tracking)
  credits: {
    geocode: 0.04,           // 4 credits per 100 requests
    reverseGeocode: 0.04,
    basemap: 0.02,           // 2 credits per 100 tiles
    routing: 0.5,            // 50 credits per 100 routes
  },
  
  // Free tier limits
  limits: {
    dailyCredits: 125,
    requestsPerSecond: 50,
    geocodePerDay: 3125,     // ~125 credits / 0.04
  },
  
  // Service URLs
  services: {
    geocode: 'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer',
    basemap: 'https://basemaps-api.arcgis.com/arcgis/rest/services',
    routing: 'https://route-api.arcgis.com/arcgis/rest/services/World/Route',
  },
};

// Validate API key exists
export function validateESRIConfig(): boolean {
  if (! ESRI_CONFIG.apiKey) {
    console.warn('⚠️ ESRI API key not configured. Set NEXT_PUBLIC_ESRI_API_KEY in .env. local');
    return false;
  }
  return true;
}

// Check if credentials are properly configured
export function getESRIStatus() {
  return {
    configured: !!ESRI_CONFIG.apiKey,
    apiKey: ESRI_CONFIG. apiKey ?  `${ESRI_CONFIG.apiKey. slice(0, 8)}...` : 'Not set',
    dailyLimit: ESRI_CONFIG.limits.dailyCredits,
    services: Object.keys(ESRI_CONFIG.services),
  };
}