import { describe, it, expect } from 'vitest';
import { parse } from '../lib/contracts/ccp03';
import { ccp03Fixture } from '../lib/contracts/ccp03.fixture';

describe('ccp03 contract', () => {
  it('parses fixture', () => {
    const out = parse(ccp03Fixture[0]);
    expect(out).toHaveProperty('id');
    expect(out.lat).toBeCloseTo(39.7392);
    expect(out.lng).toBeCloseTo(-105.0844);
    expect(out.note).toBe('smoke');
  });
});
