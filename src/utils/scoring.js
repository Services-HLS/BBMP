import { DEFAULT_SCORE_WEIGHTS, DEFAULT_SCORE_THRESHOLDS, PAYMENT_BANDS } from '../constants';

/**
 * Calculate 100-point daily performance score.
 * Proposed demonstration rules — not approved BBMP payment policy.
 */
export function calculateDailyScore(inputs, weights = DEFAULT_SCORE_WEIGHTS, thresholds = DEFAULT_SCORE_THRESHOLDS) {
  const w = { ...DEFAULT_SCORE_WEIGHTS, ...weights };
  const t = { ...DEFAULT_SCORE_THRESHOLDS, ...thresholds };

  const expectedStops = Math.max(1, Number(inputs.expectedStops) || 1);
  const completedStops = Math.max(0, Number(inputs.completedStops) || 0);
  const housesExpected = Math.max(1, Number(inputs.housesExpected) || 1);
  const housesCovered = Math.max(0, Number(inputs.housesCovered) || 0);
  const dwcVisited = Boolean(inputs.dwcVisited);
  const routeMinutes = Number(inputs.routeMinutes) || 0;
  const plannedMinutes = Number(inputs.plannedMinutes) || 180;
  const speedAlerts = Math.max(0, Number(inputs.speedAlerts) || 0);
  const stoppages = Math.max(0, Number(inputs.unnecessaryStoppages) || 0);
  const deviceUptimePct = Math.min(100, Math.max(0, Number(inputs.deviceUptimePct) ?? 100));

  const stopRatio = completedStops / expectedStops;
  const stopsScore = Math.min(w.stopsVsNormal, Math.round(stopRatio * w.stopsVsNormal));

  const coverageRatio = housesCovered / housesExpected;
  const housesScore = Math.min(w.housesCovered, Math.round(coverageRatio * w.housesCovered));

  const dwcScore = dwcVisited ? w.dryWasteCentreVisit : 0;

  const overtime = Math.max(0, routeMinutes - plannedMinutes - (t.routeTimeToleranceMinutes || 0));
  const timePenalty = Math.min(w.routeCompletionTime, Math.ceil(overtime / 15) * 2);
  const timeScore = Math.max(0, w.routeCompletionTime - timePenalty);

  const speedPenalty = Math.min(w.speedAlerts, speedAlerts * Math.ceil(w.speedAlerts / Math.max(1, (t.maxSpeedAlerts || 0) + 1)));
  const speedScore = Math.max(0, w.speedAlerts - speedPenalty);

  const allowedStoppages = t.maxStoppages ?? 2;
  const excessStoppages = Math.max(0, stoppages - allowedStoppages);
  const stoppageScore = Math.max(0, w.unnecessaryStoppages - excessStoppages);

  const uptimeScore = Math.round((deviceUptimePct / 100) * w.deviceUptime);

  const components = {
    stopsVsNormal: { earned: stopsScore, max: w.stopsVsNormal, input: { completedStops, expectedStops, ratio: Number(stopRatio.toFixed(3)) } },
    housesCovered: { earned: housesScore, max: w.housesCovered, input: { housesCovered, housesExpected, ratio: Number(coverageRatio.toFixed(3)) } },
    dryWasteCentreVisit: { earned: dwcScore, max: w.dryWasteCentreVisit, input: { dwcVisited } },
    routeCompletionTime: { earned: timeScore, max: w.routeCompletionTime, input: { routeMinutes, plannedMinutes, overtime } },
    speedAlerts: { earned: speedScore, max: w.speedAlerts, input: { speedAlerts } },
    unnecessaryStoppages: { earned: stoppageScore, max: w.unnecessaryStoppages, input: { stoppages, allowedStoppages } },
    deviceUptime: { earned: uptimeScore, max: w.deviceUptime, input: { deviceUptimePct } },
  };

  const total = Object.values(components).reduce((sum, c) => sum + c.earned, 0);
  const band = getPaymentBand(total, t);

  return {
    total,
    maxTotal: 100,
    band,
    components,
    weights: w,
    thresholds: t,
    calculatedAt: new Date().toISOString(),
  };
}

export function getPaymentBand(score, thresholds = DEFAULT_SCORE_THRESHOLDS) {
  const t = { ...DEFAULT_SCORE_THRESHOLDS, ...thresholds };
  if (score >= t.fullPaymentMin) return PAYMENT_BANDS.FULL;
  if (score >= t.reducedPaymentMin) return PAYMENT_BANDS.REDUCED;
  return PAYMENT_BANDS.REVIEW;
}

export function validateWeights(weights) {
  const total = Object.values(weights).reduce((s, v) => s + Number(v || 0), 0);
  return {
    valid: total === 100,
    total,
    message: total === 100 ? 'Weights total 100' : `Weights must total 100 (currently ${total})`,
  };
}

export function averageDailyScores(dailyScores) {
  if (!dailyScores?.length) return null;
  const total = dailyScores.reduce((s, d) => s + (d.total ?? d.score ?? 0), 0);
  const avg = Math.round((total / dailyScores.length) * 10) / 10;
  return {
    average: avg,
    days: dailyScores.length,
    band: getPaymentBand(avg),
  };
}

export function monthlyScoreFromDaily(dailyScores) {
  const summary = averageDailyScores(dailyScores);
  if (!summary) return null;
  return {
    ...summary,
    source: 'Calculated from daily scores',
    scores: dailyScores.map((d) => ({ date: d.date, total: d.total ?? d.score })),
  };
}
