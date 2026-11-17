import { describe, expect, it } from 'vitest';
import {
  etaMinutes, formatDistance, haversineKm, insertOnPath, kmBetweenFractions, pathDistanceKm, pointAt,
  shiftStartClear,
} from '../routeTrack';

describe('routeTrack', () => {
  const path = [
    [12.97, 77.64],
    [12.98, 77.64],
    [12.98, 77.65],
  ];

  it('measures a short city leg in kilometres', () => {
    const km = haversineKm(path[0], path[1]);
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(1.2);
    expect(pathDistanceKm(path)).toBeGreaterThan(km);
  });

  it('places a point part-way along the route', () => {
    const mid = pointAt(path, 0);
    expect(mid.point[0]).toBeCloseTo(12.97, 4);
    const end = pointAt(path, 1);
    expect(end.point[1]).toBeCloseTo(77.65, 4);
  });

  it('inserts the house stop onto the nearest leg', () => {
    const house = [12.975, 77.64];
    const built = insertOnPath(path, house);
    expect(built.path).toHaveLength(4);
    expect(built.path[built.index]).toEqual(house);
  });

  it('turns remaining distance into a ride-style label', () => {
    const km = kmBetweenFractions(path, 0.2, 0.6);
    expect(km).toBeGreaterThan(0);
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(1.24)).toBe('1.2 km');
    expect(etaMinutes(1.5, 18)).toBe(5);
    expect(etaMinutes(0, 18)).toBe(0);
  });

  it('moves a start pin that sits on the house', () => {
    const path = [[12.97, 77.64], [12.9704, 77.6404], [12.98, 77.65]];
    const shifted = shiftStartClear(path, 1, 0.8);
    expect(shifted.houseIndex).toBe(2);
    expect(haversineKm(shifted.path[0], shifted.path[shifted.houseIndex])).toBeGreaterThanOrEqual(0.8);
  });
});
