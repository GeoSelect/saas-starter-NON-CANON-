/**
 * Map utility functions for Esri/ArcGIS operations
 * Includes geocoding, reverse geocoding, spatial queries, and calculations
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: { wkid: number };
}

export interface MapExtent {
  center: LatLng;
  zoom: number;
  boundingBox?: BoundingBox;
}

export interface SpatialReference {
  wkid: number;
  name: string;
}

/**
 * Calculate distance between two points in miles
 * Uses Haversine formula
 */
export function calculateDistance(
  point1: LatLng,
  point2: LatLng
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Create a bounding box from a center point and radius in miles
 */
export function createBoundingBox(
  center: LatLng,
  radiusMiles: number
): BoundingBox {
  // Approximate degrees per mile (varies by latitude)
  const degreesPerMile = 0.01449; // ~1 mile at 40°N latitude
  const degrees = radiusMiles * degreesPerMile;

  return {
    xmin: center.longitude - degrees,
    ymin: center.latitude - degrees,
    xmax: center.longitude + degrees,
    ymax: center.latitude + degrees,
    spatialReference: { wkid: 4326 }, // WGS84
  };
}

/**
 * Calculate map zoom level based on bounding box
 */
export function calculateZoomLevel(boundingBox: BoundingBox): number {
  const width = boundingBox.xmax - boundingBox.xmin;
  const height = boundingBox.ymax - boundingBox.ymin;
  const maxDegrees = Math.max(width, height);

  // Empirical formula for zoom level
  const zoom = Math.round(-Math.log(maxDegrees / 360) / Math.log(2) + 8);
  return Math.max(1, Math.min(zoom, 20)); // Clamp between 1 and 20
}

/**
 * Pan map to center coordinates with optional zoom
 */
export function createPanExtent(
  center: LatLng,
  zoom?: number
): MapExtent {
  return {
    center,
    zoom: zoom || 15,
  };
}

/**
 * Create extent from two points (useful for zoom-to-extent)
 */
export function extentFromPoints(
  point1: LatLng,
  point2: LatLng,
  padding: number = 0.1
): MapExtent {
  const minLat = Math.min(point1.latitude, point2.latitude);
  const maxLat = Math.max(point1.latitude, point2.latitude);
  const minLng = Math.min(point1.longitude, point2.longitude);
  const maxLng = Math.max(point1.longitude, point2.longitude);

  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;

  const bbox: BoundingBox = {
    xmin: minLng - lngPadding,
    ymin: minLat - latPadding,
    xmax: maxLng + lngPadding,
    ymax: maxLat + latPadding,
    spatialReference: { wkid: 4326 },
  };

  const center: LatLng = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  };

  return {
    center,
    zoom: calculateZoomLevel(bbox),
    boundingBox: bbox,
  };
}

/**
 * Convert coordinates between Web Mercator and WGS84
 */
export function webMercatorToWgs84(x: number, y: number): LatLng {
  const latitude = (Math.atan(Math.sinh(y / 20037508.34)) * 180) / Math.PI;
  const longitude = (x / 20037508.34) * 180;

  return { latitude, longitude };
}

export function wgs84ToWebMercator(latitude: number, longitude: number): LatLng {
  const x = (longitude * 20037508.34) / 180;
  const y = Math.log(Math.tan(((90 + latitude) * Math.PI) / 360)) * 20037508.34;

  return { latitude: y, longitude: x };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  latitude: number | undefined,
  longitude: number | undefined,
  format: 'decimal' | 'dms' = 'decimal'
): string {
  // Handle undefined or null coordinates
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return 'Coordinates unavailable';
  }

  if (format === 'decimal') {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  // Decimal Degrees to Degrees, Minutes, Seconds
  const latDMS = decimalToDMS(latitude, 'N', 'S');
  const lngDMS = decimalToDMS(longitude, 'E', 'W');

  return `${latDMS}, ${lngDMS}`;
}

function decimalToDMS(
  value: number,
  positive: string,
  negative: string
): string {
  const direction = value >= 0 ? positive : negative;
  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.floor((absValue - degrees) * 60);
  const seconds = ((absValue - degrees - minutes / 60) * 3600).toFixed(2);

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBoundingBox(
  point: LatLng,
  bbox: BoundingBox
): boolean {
  return (
    point.longitude >= bbox.xmin &&
    point.longitude <= bbox.xmax &&
    point.latitude >= bbox.ymin &&
    point.latitude <= bbox.ymax
  );
}

/**
 * Get center of bounding box
 */
export function getBoundingBoxCenter(bbox: BoundingBox): LatLng {
  return {
    latitude: (bbox.ymin + bbox.ymax) / 2,
    longitude: (bbox.xmin + bbox.xmax) / 2,
  };
}

/**
 * Common bounding boxes for different regions
 */
export const COMMON_BOUNDS = {
  USA: {
    xmin: -125.0,
    ymin: 24.5,
    xmax: -66.9,
    ymax: 49.4,
    spatialReference: { wkid: 4326 },
  },
  COLORADO: {
    xmin: -109.06,
    ymin: 36.99,
    xmax: -102.04,
    ymax: 41.0,
    spatialReference: { wkid: 4326 },
  },
  TELLURIDE: {
    xmin: -107.85,
    ymin: 37.92,
    xmax: -107.78,
    ymax: 37.97,
    spatialReference: { wkid: 4326 },
  },
} as const;

/**
 * Get initial map extent for a region
 */
export function getInitialExtent(
  region: keyof typeof COMMON_BOUNDS = 'USA'
): MapExtent {
  const bbox = COMMON_BOUNDS[region];
  const center = getBoundingBoxCenter(bbox);
  const zoom = calculateZoomLevel(bbox);

  return {
    center,
    zoom,
    boundingBox: bbox,
  };
}

/**
 * Create geometry for drawing on map
 */
export interface PolygonGeometry {
  type: 'polygon';
  rings: Array<Array<[number, number]>>;
  spatialReference?: SpatialReference;
}

export interface CircleGeometry {
  type: 'circle';
  center: [number, number];
  radius: number;
  spatialReference?: SpatialReference;
}

export type Geometry = PolygonGeometry | CircleGeometry;

/**
 * Create a circle geometry
 */
export function createCircleGeometry(
  center: LatLng,
  radiusMiles: number
): CircleGeometry {
  // Convert miles to meters for Esri (typically uses meters)
  const radiusMeters = radiusMiles * 1609.34;

  return {
    type: 'circle',
    center: [center.longitude, center.latitude],
    radius: radiusMeters,
    spatialReference: { wkid: 4326, name: 'WGS84' },
  };
}

/**
 * Create a rectangular polygon from bounding box
 */
export function createRectangleGeometry(bbox: BoundingBox): PolygonGeometry {
  return {
    type: 'polygon',
    rings: [
      [
        [bbox.xmin, bbox.ymin],
        [bbox.xmin, bbox.ymax],
        [bbox.xmax, bbox.ymax],
        [bbox.xmax, bbox.ymin],
        [bbox.xmin, bbox.ymin],
      ],
    ],
    spatialReference: bbox.spatialReference,
  };
}

/**
 * Get extent query string for Esri REST API
 */
export function getExtentQueryString(bbox: BoundingBox): string {
  return `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`;
}

/**
 * Parse extent query string from Esri API response
 */
export function parseExtentString(extentString: string): BoundingBox | null {
  const parts = extentString.split(',');
  if (parts.length !== 4) return null;

  const [xmin, ymin, xmax, ymax] = parts.map(Number);
  return { xmin, ymin, xmax, ymax, spatialReference: { wkid: 4326 } };
}
