import { describe, it, expect } from 'vitest';
import {
  blockCoveragePercent,
  isOverdue,
  matchesIssueTab,
  slaDeadlineFor,
  validateClosureProof,
} from '../issues';

describe('issue tabs', () => {
  it('counts Assigned separately from On site', () => {
    const assigned = { status: 'Assigned', slaDeadline: null };
    const onSite = { status: 'On site', slaDeadline: null };
    expect(matchesIssueTab(assigned, 'assigned')).toBe(true);
    expect(matchesIssueTab(onSite, 'assigned')).toBe(false);
    expect(matchesIssueTab(onSite, 'onsite')).toBe(true);
  });
});

describe('SLA', () => {
  it('gives skipped pickup a same-day deadline and potholes none', () => {
    const start = new Date('2026-11-13T07:30:00.000Z');
    const due = new Date(slaDeadlineFor('Skipped Household Pickup', start));
    expect(due.getDate()).toBe(start.getDate());
    expect(slaDeadlineFor('Pothole', start)).toBeNull();
    expect(slaDeadlineFor('Suggestion', start)).toBeNull();
  });

  it('treats overdue as a flag on an open issue', () => {
    expect(isOverdue({ status: 'Assigned', slaDeadline: '2020-01-01T00:00:00.000Z' })).toBe(true);
    expect(isOverdue({ status: 'Closed', slaDeadline: '2020-01-01T00:00:00.000Z' })).toBe(false);
    expect(isOverdue({ status: 'Assigned', slaDeadline: null })).toBe(false);
  });
});

describe('closure proof', () => {
  const issue = { category: 'Skipped Household Pickup' };

  it('rejects a demo-evidence checkbox', () => {
    const result = validateClosureProof(issue, { id: 'demo-evidence-CMP-1', kind: 'photo' });
    expect(result.ok).toBe(false);
  });

  it('accepts a fresh camera photo within 10 m', () => {
    const result = validateClosureProof(issue, {
      id: 'photo-1',
      kind: 'photo',
      source: 'camera',
      distanceM: 6,
      capturedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a photo farther than 10 m', () => {
    const result = validateClosureProof(issue, {
      id: 'photo-2',
      kind: 'photo',
      source: 'camera',
      distanceM: 40,
      capturedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(false);
  });
});

describe('coverage', () => {
  it('uses households served divided by households on the block', () => {
    const houses = [
      { coverageStatus: 'Collected' },
      { coverageStatus: 'Collected' },
      { coverageStatus: 'Pending' },
      { coverageStatus: 'Pending' },
    ];
    expect(blockCoveragePercent(houses)).toBe(50);
    expect(blockCoveragePercent([])).toBeNull();
  });
});
