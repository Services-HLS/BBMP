import { describe, it, expect } from 'vitest';
import {
  calculateDailyScore,
  getPaymentBand,
  validateWeights,
  monthlyScoreFromDaily,
} from '../scoring';
import { DEFAULT_SCORE_WEIGHTS, PAYMENT_BANDS } from '../../constants';

describe('calculateDailyScore', () => {
  it('returns 100 for perfect inputs', () => {
    const result = calculateDailyScore({
      expectedStops: 40,
      completedStops: 40,
      housesExpected: 60,
      housesCovered: 60,
      dwcVisited: true,
      routeMinutes: 170,
      plannedMinutes: 180,
      speedAlerts: 0,
      unnecessaryStoppages: 1,
      deviceUptimePct: 100,
    });
    expect(result.total).toBe(100);
    expect(result.band).toBe(PAYMENT_BANDS.FULL);
  });

  it('scores 0 when the vehicle has no GPS', () => {
    const result = calculateDailyScore({
      expectedStops: 40,
      completedStops: 40,
      housesExpected: 60,
      housesCovered: 60,
      dwcVisited: true,
      routeMinutes: 170,
      plannedMinutes: 180,
      speedAlerts: 0,
      unnecessaryStoppages: 1,
      deviceUptimePct: 0,
      offline: true,
    });
    expect(result.total).toBe(0);
    expect(result.band).toBe(PAYMENT_BANDS.REVIEW);
  });

  it('penalises missed DWC and low coverage', () => {
    const result = calculateDailyScore({
      expectedStops: 40,
      completedStops: 20,
      housesExpected: 60,
      housesCovered: 30,
      dwcVisited: false,
      routeMinutes: 250,
      plannedMinutes: 180,
      speedAlerts: 2,
      unnecessaryStoppages: 5,
      deviceUptimePct: 80,
    });
    expect(result.total).toBeLessThan(70);
    expect(result.band).toBe(PAYMENT_BANDS.REVIEW);
    expect(result.components.dryWasteCentreVisit.earned).toBe(0);
  });

  it('handles boundaries for payment bands', () => {
    expect(getPaymentBand(85)).toBe(PAYMENT_BANDS.FULL);
    expect(getPaymentBand(84)).toBe(PAYMENT_BANDS.REDUCED);
    expect(getPaymentBand(70)).toBe(PAYMENT_BANDS.REDUCED);
    expect(getPaymentBand(69)).toBe(PAYMENT_BANDS.REVIEW);
  });
});

describe('validateWeights', () => {
  it('accepts default weights totaling 100', () => {
    expect(validateWeights(DEFAULT_SCORE_WEIGHTS).valid).toBe(true);
  });

  it('rejects weights that do not total 100', () => {
    expect(validateWeights({ ...DEFAULT_SCORE_WEIGHTS, stopsVsNormal: 30 }).valid).toBe(false);
  });
});

describe('monthlyScoreFromDaily', () => {
  it('averages daily scores', () => {
    const monthly = monthlyScoreFromDaily([{ date: '2026-01-01', total: 80 }, { date: '2026-01-02', total: 90 }]);
    expect(monthly.average).toBe(85);
    expect(monthly.source).toContain('daily');
  });
});
