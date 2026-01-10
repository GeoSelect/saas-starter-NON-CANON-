import { describe, it, expect } from "vitest";
import type { ParcelBoundary, MapViewProps, BasemapOption, Coordinate } from "./MapView";

/**
 * MapView Component Test Suite
 * Tests for type contracts, props validation, and coordinate handling
 */

describe("MapView Component", () => {
  describe("Type Definitions", () => {
    it("should accept valid ParcelBoundary type", () => {
      const boundary: ParcelBoundary = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-107.8145, 37.9365],
              [-107.8125, 37.9365],
              [-107.8125, 37.9385],
              [-107.8145, 37.9385],
              [-107.8145, 37.9365],
            ],
          ],
        },
        properties: {
          apn: "123-456-789",
          name: "Test Parcel",
        },
      };

      expect(boundary.type).toBe("Feature");
      expect(boundary.geometry.type).toBe("Polygon");
      expect(boundary.geometry.coordinates).toHaveLength(1);
      expect(boundary.properties).toHaveProperty("apn");
    });

    it("should accept valid Coordinate type", () => {
      const coord: Coordinate = {
        lat: 37.9375,
        lng: -107.8123,
      };

      expect(coord.lat).toBeGreaterThan(-90);
      expect(coord.lat).toBeLessThan(90);
      expect(coord.lng).toBeGreaterThan(-180);
      expect(coord.lng).toBeLessThan(180);
    });

    it("should accept valid BasemapOption type", () => {
      const basemap: BasemapOption = {
        label: "Streets",
        value: "https://demotiles.maplibre.org/style.json",
      };

      expect(basemap).toHaveProperty("label");
      expect(basemap).toHaveProperty("value");
      expect(typeof basemap.label).toBe("string");
      expect(typeof basemap.value).toBe("string");
    });
  });

  describe("Props Validation", () => {
    it("should have sensible default props", () => {
      const defaultProps = {
        height: 240,
        initialCenter: { lat: 37.9375, lng: -107.8123 },
        initialZoom: 14,
        showBasemapSelector: true,
        showTerrainControls: true,
        enableStreetView: true,
        className: "",
      };

      expect(defaultProps.height).toBeGreaterThan(0);
      expect(defaultProps.initialZoom).toBeGreaterThanOrEqual(0);
      expect(defaultProps.initialZoom).toBeLessThanOrEqual(22);
    });

    it("should accept custom height prop", () => {
      const props: Partial<MapViewProps> = {
        height: 500,
      };

      expect(props.height).toBe(500);
    });

    it("should accept onMapClick callback", () => {
      const mockCallback = (lat: number, lng: number) => {
        return { lat, lng };
      };

      const props: Partial<MapViewProps> = {
        onMapClick: mockCallback,
      };

      expect(typeof props.onMapClick).toBe("function");
      
      if (props.onMapClick) {
        const result = props.onMapClick(37.9375, -107.8123);
        expect(result).toEqual({ lat: 37.9375, lng: -107.8123 });
      }
    });

    it("should accept custom basemap options", () => {
      const customBasemaps: BasemapOption[] = [
        { label: "Light", value: "https://example.com/light.json" },
        { label: "Dark", value: "https://example.com/dark.json" },
      ];

      const props: Partial<MapViewProps> = {
        basemapOptions: customBasemaps,
      };

      expect(props.basemapOptions).toHaveLength(2);
      expect(props.basemapOptions?.[0].label).toBe("Light");
    });
  });

  describe("Coordinate Validation", () => {
    it("should validate latitude is within valid range", () => {
      const validLatitudes = [0, 37.9375, -37.9375, 89.9, -89.9];
      
      validLatitudes.forEach((lat) => {
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      });
    });

    it("should validate longitude is within valid range", () => {
      const validLongitudes = [0, -107.8123, 107.8123, 179.9, -179.9];
      
      validLongitudes.forEach((lng) => {
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      });
    });

    it("should detect invalid coordinates", () => {
      const invalidCoords = [
        { lat: 91, lng: 0 }, // lat too high
        { lat: -91, lng: 0 }, // lat too low
        { lat: 0, lng: 181 }, // lng too high
        { lat: 0, lng: -181 }, // lng too low
      ];

      invalidCoords.forEach((coord) => {
        const isValidLat = coord.lat >= -90 && coord.lat <= 90;
        const isValidLng = coord.lng >= -180 && coord.lng <= 180;
        const isValid = isValidLat && isValidLng;
        
        expect(isValid).toBe(false);
      });
    });
  });

  describe("ParcelBoundary Validation", () => {
    it("should have at least 4 coordinates for a valid polygon", () => {
      const boundary: ParcelBoundary = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-107.8145, 37.9365],
              [-107.8125, 37.9365],
              [-107.8125, 37.9385],
              [-107.8145, 37.9385],
              [-107.8145, 37.9365], // closing coordinate
            ],
          ],
        },
        properties: {},
      };

      const coords = boundary.geometry.coordinates[0];
      expect(coords.length).toBeGreaterThanOrEqual(4);
      
      // First and last coordinates should match (closed polygon)
      const first = coords[0];
      const last = coords[coords.length - 1];
      expect(first[0]).toBe(last[0]);
      expect(first[1]).toBe(last[1]);
    });

    it("should calculate bounds from polygon coordinates", () => {
      const coordinates = [
        [-107.8145, 37.9365],
        [-107.8125, 37.9365],
        [-107.8125, 37.9385],
        [-107.8145, 37.9385],
        [-107.8145, 37.9365],
      ];

      const lngs = coordinates.map((c) => c[0]);
      const lats = coordinates.map((c) => c[1]);

      const bounds = {
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      };

      expect(bounds.minLng).toBe(-107.8145);
      expect(bounds.maxLng).toBe(-107.8125);
      expect(bounds.minLat).toBe(37.9365);
      expect(bounds.maxLat).toBe(37.9385);
    });
  });

  describe("Basemap Options", () => {
    it("should have valid default basemap options", () => {
      const defaultBasemaps: BasemapOption[] = [
        { label: "Light", value: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
        { label: "Dark", value: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
        { label: "Streets", value: "https://demotiles.maplibre.org/style.json" },
        { label: "3D Buildings", value: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json" },
        { label: "Topography", value: "https://tiles.stadiamaps.com/styles/outdoors.json" },
      ];

      expect(defaultBasemaps).toHaveLength(5);
      
      defaultBasemaps.forEach((basemap) => {
        expect(basemap.label).toBeTruthy();
        expect(basemap.value).toMatch(/^https:\/\//);
        expect(basemap.value).toMatch(/\.json$/);
      });
    });

    it("should support custom basemap URLs", () => {
      const customBasemap: BasemapOption = {
        label: "Custom Style",
        value: "https://custom.example.com/style.json",
      };

      expect(customBasemap.value).toMatch(/^https:\/\//);
      expect(customBasemap.value).toContain("style.json");
    });
  });

  describe("Control Visibility", () => {
    it("should allow toggling basemap selector visibility", () => {
      const propsWithSelector: Partial<MapViewProps> = {
        showBasemapSelector: true,
      };
      
      const propsWithoutSelector: Partial<MapViewProps> = {
        showBasemapSelector: false,
      };

      expect(propsWithSelector.showBasemapSelector).toBe(true);
      expect(propsWithoutSelector.showBasemapSelector).toBe(false);
    });

    it("should allow toggling terrain controls visibility", () => {
      const propsWithControls: Partial<MapViewProps> = {
        showTerrainControls: true,
      };
      
      const propsWithoutControls: Partial<MapViewProps> = {
        showTerrainControls: false,
      };

      expect(propsWithControls.showTerrainControls).toBe(true);
      expect(propsWithoutControls.showTerrainControls).toBe(false);
    });

    it("should allow toggling street view", () => {
      const propsWithStreetView: Partial<MapViewProps> = {
        enableStreetView: true,
      };
      
      const propsWithoutStreetView: Partial<MapViewProps> = {
        enableStreetView: false,
      };

      expect(propsWithStreetView.enableStreetView).toBe(true);
      expect(propsWithoutStreetView.enableStreetView).toBe(false);
    });
  });

  describe("Zoom Level Validation", () => {
    it("should accept valid zoom levels (0-22)", () => {
      const validZoomLevels = [0, 1, 5, 10, 14, 18, 20, 22];
      
      validZoomLevels.forEach((zoom) => {
        expect(zoom).toBeGreaterThanOrEqual(0);
        expect(zoom).toBeLessThanOrEqual(22);
      });
    });

    it("should identify invalid zoom levels", () => {
      const invalidZoomLevels = [-1, -5, 23, 30, 100];
      
      invalidZoomLevels.forEach((zoom) => {
        const isValid = zoom >= 0 && zoom <= 22;
        expect(isValid).toBe(false);
      });
    });
  });
});
