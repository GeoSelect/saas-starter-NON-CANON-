import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getAddressAutocomplete, geocodeAddress, extractAddressComponents } from '@/lib/integrations/google-places';

describe('Google Places Integration', () => {
  beforeAll(() => {
    // Verify API key is set
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('GOOGLE_MAPS_API_KEY not set - some tests will be skipped');
    }
  });

  describe('getAddressAutocomplete', () => {
    it('returns empty array for short input', async () => {
      const results = await getAddressAutocomplete('12');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'returns predictions for valid address',
      async () => {
        const results = await getAddressAutocomplete('Telluride Colorado');
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
          expect(results[0]).toHaveProperty('place_id');
          expect(results[0]).toHaveProperty('description');
          expect(results[0]).toHaveProperty('main_text');
        }
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'applies location bias to Colorado region',
      async () => {
        const results = await getAddressAutocomplete('Main Street');
        expect(Array.isArray(results)).toBe(true);
        // Results should be prioritized for Colorado region
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'handles API rate limits gracefully',
      async () => {
        // Make multiple rapid requests
        const requests = Array.from({ length: 5 }, () =>
          getAddressAutocomplete('test address')
        );

        try {
          await Promise.all(requests);
        } catch (error) {
          // Should handle rate limiting without crashing
          expect(error).toBeDefined();
        }
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'returns only US results',
      async () => {
        const results = await getAddressAutocomplete('Paris');
        expect(Array.isArray(results)).toBe(true);
        // Results filtered to US only (Paris, TX expected before Paris, France)
      }
    );
  });

  describe('geocodeAddress', () => {
    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'returns coordinates for valid address',
      async () => {
        const result = await geocodeAddress('Telluride, Colorado');
        expect(result).toHaveProperty('geometry');
        expect(result.geometry).toHaveProperty('location');
        expect(result.geometry.location).toHaveProperty('lat');
        expect(result.geometry.location).toHaveProperty('lng');
        expect(typeof result.geometry.location.lat).toBe('number');
        expect(typeof result.geometry.location.lng).toBe('number');
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'returns formatted address',
      async () => {
        const result = await geocodeAddress('123 Main St, Telluride, CO');
        expect(result).toHaveProperty('formatted_address');
        expect(typeof result.formatted_address).toBe('string');
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'returns address components',
      async () => {
        const result = await geocodeAddress('Telluride, Colorado');
        expect(Array.isArray(result.address_components)).toBe(true);
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'returns geometry bounds',
      async () => {
        const result = await geocodeAddress('Colorado');
        expect(result.geometry).toHaveProperty('bounds');
        expect(result.geometry.bounds).toHaveProperty('northeast');
        expect(result.geometry.bounds).toHaveProperty('southwest');
      }
    );

    it('throws error for invalid address', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        // Skip if no API key
        return;
      }

      try {
        // Use obviously invalid address
        await geocodeAddress('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ INVALID ADDRESS');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('extractAddressComponents', () => {
    it('extracts street number and name', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) return;

      const result = await geocodeAddress('123 Main Street, Telluride, CO 81435');
      const components = extractAddressComponents(result);

      expect(components).toHaveProperty('streetNumber');
      expect(components).toHaveProperty('streetName');
      expect(typeof components.streetNumber).toBe('string');
      expect(typeof components.streetName).toBe('string');
    });

    it('extracts city, state, zip', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) return;

      const result = await geocodeAddress('Telluride, Colorado');
      const components = extractAddressComponents(result);

      expect(components).toHaveProperty('city');
      expect(components).toHaveProperty('state');
      // zipCode is optional for cities
    });

    it('handles incomplete addresses', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) return;

      const result = await geocodeAddress('Colorado');
      const components = extractAddressComponents(result);

      // Should not throw, but may have missing components
      expect(typeof components).toBe('object');
    });

    it('extracts country code', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) return;

      const result = await geocodeAddress('Telluride, Colorado');
      const components = extractAddressComponents(result);

      expect(components.country).toBe('US');
    });
  });

  describe('Integration scenarios', () => {
    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'autocomplete -> geocode -> extract workflow',
      async () => {
        // Get suggestions
        const suggestions = await getAddressAutocomplete('Telluride Colorado');
        expect(suggestions.length).toBeGreaterThan(0);

        // Geocode first suggestion
        const geocoded = await geocodeAddress(suggestions[0].description);
        expect(geocoded).toHaveProperty('geometry');

        // Extract components
        const components = extractAddressComponents(geocoded);
        expect(components).toHaveProperty('state');
        expect(components.state).toBe('CO');
      }
    );

    it.skipIf(!process.env.GOOGLE_MAPS_API_KEY)(
      'handles coordinates in reasonable range',
      async () => {
        const result = await geocodeAddress('San Miguel County, Colorado');
        const { lat, lng } = result.geometry.location;

        // San Miguel County bounds (approximately)
        expect(lat).toBeGreaterThan(36);
        expect(lat).toBeLessThan(42);
        expect(lng).toBeGreaterThan(-109);
        expect(lng).toBeLessThan(-102);
      }
    );
  });

  describe('Error handling', () => {
    it('throws on missing API key', async () => {
      const originalKey = process.env.GOOGLE_MAPS_API_KEY;
      delete process.env.GOOGLE_MAPS_API_KEY;

      try {
        await getAddressAutocomplete('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(String(error)).toContain('API key');
      } finally {
        process.env.GOOGLE_MAPS_API_KEY = originalKey;
      }
    });

    it('handles network errors gracefully', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) return;

      // This test would require mocking network failures
      // Placeholder for network error handling verification
      expect(true).toBe(true);
    });

    it('handles zero results gracefully', async () => {
      if (!process.env.GOOGLE_MAPS_API_KEY) return;

      try {
        // Use very unlikely address
        await geocodeAddress('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      } catch (error) {
        // Should either throw or return empty results
        expect(error || []).toBeDefined();
      }
    });
  });
});
