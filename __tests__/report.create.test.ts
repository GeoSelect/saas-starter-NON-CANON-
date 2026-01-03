import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../app/api/report/create/route';

describe('POST /api/report/create', () => {
  beforeEach(() => {
    const g = globalThis as any;
    if (g.__AUDIT_EVENTS) delete g.__AUDIT_EVENTS;
  });

  it('creates a report and emits an audit event', async () => {
    const req = new Request('http://localhost/api/report/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcel_context: { parcel: 'x' }, intent: 'investigate', report_id: 'r1', request_id: 'req1' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    const report = json.report;
    expect(report).toBeDefined();
    expect(report.id).toBe('r1');
    expect(report.request_id).toBe('req1');
    expect(report.status).toBe('created');

    const g = globalThis as any;
    expect(Array.isArray(g.__AUDIT_EVENTS)).toBe(true);
    expect(g.__AUDIT_EVENTS.length).toBeGreaterThan(0);
    const ev = g.__AUDIT_EVENTS[g.__AUDIT_EVENTS.length - 1];
    expect(ev.type).toBe('report.created');
    expect(ev.report_id).toBe('r1');
  });

  it('validates missing fields', async () => {
    const req = new Request('http://localhost/api/report/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'no-parcel' }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe('REPORT_CREATE_CONTRACT');
    expect(json.code).toBe('MISSING_PARCEL');
  });
});
