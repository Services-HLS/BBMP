import { describe, it, expect, beforeEach } from 'vitest';
import { createSeedData } from '../../data/seed';

/**
 * Lightweight complaint transition checks against seed shapes.
 * Full mockApi tests require browser localStorage; these validate data contracts.
 */
describe('complaint seed workflow states', () => {
  let complaints;

  beforeEach(() => {
    complaints = createSeedData().complaints;
  });

  it('seeds complaints across multiple lifecycle states', () => {
    const statuses = new Set(complaints.map((c) => c.status));
    expect(statuses.has('Submitted')).toBe(true);
    expect(statuses.has('Resolved')).toBe(true);
    expect(statuses.has('Assigned') || statuses.has('In Progress')).toBe(true);
  });

  it('includes history entries for each complaint', () => {
    complaints.forEach((c) => {
      expect(Array.isArray(c.history)).toBe(true);
      expect(c.history.length).toBeGreaterThan(0);
      expect(c.id).toMatch(/^CMP-/);
    });
  });

  it('allows reopen only from Resolved conceptually', () => {
    const resolved = complaints.find((c) => c.status === 'Resolved');
    const reopened = complaints.find((c) => c.status === 'Reopened');
    expect(resolved).toBeTruthy();
    expect(reopened).toBeTruthy();
    expect(reopened.history.some((h) => h.action === 'Reopened')).toBe(true);
  });
});

describe('seed scale vs proposal', () => {
  it('loads a manageable demo subset', () => {
    const data = createSeedData();
    expect(data.vehicles.length).toBeGreaterThan(10);
    expect(data.vehicles.length).toBeLessThan(100);
    expect(data._meta.demoRecordCounts.wards).toBe(data.wards.length);
  });
});
