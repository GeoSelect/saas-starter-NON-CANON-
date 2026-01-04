import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/parcel/resolve/route';

describe('POST /api/parcel/resolve', () => {
  it('resolves parcel by text query', async () => {
    const req = new Request('http://localhost/api/parcel/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: '4127 Linden St', 
        mode: 'text',
        limit: 20 
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toBeDefined();
    expect(Array.isArray(json.results)).toBe(true);
    expect(json.results.length).toBeGreaterThan(0);
    expect(json.meta.stubbed).toBe(true);
  });

  it('resolves parcel by lat/lng coordinates', async () => {
    const lat = 40.7128;
    const lng = -74.0060;
    
    const req = new Request('http://localhost/api/parcel/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lat,
        lng,
        mode: 'latlng',
        limit: 20 
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toBeDefined();
    expect(Array.isArray(json.results)).toBe(true);
    expect(json.results.length).toBeGreaterThan(0);
    expect(json.meta.mode).toBe('latlng');
    expect(json.meta.stubbed).toBe(true);
    
    // Verify coordinates are included in response
    const firstResult = json.results[0];
    expect(firstResult.lat).toBe(lat);
    expect(firstResult.lng).toBe(lng);
  });

  it('validates missing query and coordinates', async () => {
    const req = new Request('http://localhost/api/parcel/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'text' }),
    });

    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
    expect(json.message).toBe('Provide either query or lat/lng');
  });

  it('validates request body schema', async () => {
    const req = new Request('http://localhost/api/parcel/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: '',  // Empty string should fail min(1) validation
        mode: 'text' 
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });
});
