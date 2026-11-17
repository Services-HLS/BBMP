/** Contract rules from the BSWML change spec: one issue register, SLA, proof, coverage. */

export const ISSUE_SOURCES = [
  { id: 'complaint', label: 'Citizen complaint' },
  { id: 'black_spot', label: 'Black spot' },
  { id: 'ai', label: 'Dashcam / AI' },
];

export const CLOSED_STATUSES = ['Resolved', 'Closed', 'Invalid'];

/**
 * slaMinutes null = no deadline (other department or suggestion).
 * sameDay = due at the end of the day the issue was assigned.
 */
export const CATEGORY_RULES = [
  { name: 'Skipped Household Pickup', kpi: '2, 12', sameDay: true, evidence: 'gps_or_photo', gpsDistanceM: 25, photoDistanceM: 10 },
  { name: 'Late Auto', kpi: '2, 12', sameDay: true, evidence: 'gps_or_photo', gpsDistanceM: 25, photoDistanceM: 10 },
  { name: 'Missed Dry Waste Collection', kpi: '2, 12', sameDay: true, evidence: 'gps_or_photo', gpsDistanceM: 25, photoDistanceM: 10 },
  { name: 'Mixed waste taken', kpi: '3', sameDay: true, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Market / public amenity / micro C&D', kpi: '4', slaMinutes: 180, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Dead animal', kpi: '5', slaMinutes: 240, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Sweeping waste not lifted', kpi: '6', slaMinutes: 240, evidence: 'gps_or_photo', gpsDistanceM: 25, photoDistanceM: 10 },
  { name: 'GVP / bin / GTP overflow', kpi: '7', slaMinutes: 240, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Black Spot / Illegal Dumping', kpi: '8', slaMinutes: 60, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Dumping / burning', kpi: '8', slaMinutes: 60, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Spillage / leachate', kpi: '10', sameDay: true, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Vehicle misuse', kpi: '11', sameDay: true, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Crew conduct / PPE', kpi: '15, 18', sameDay: true, evidence: 'photo', photoDistanceM: 10 },
  { name: 'New garbage spot', kpi: '19', slaMinutes: 240, evidence: 'photo', photoDistanceM: 10 },
  { name: 'Pothole', kpi: null, evidence: 'none', routesTo: 'Other dept' },
  { name: 'Debris', kpi: null, evidence: 'none', routesTo: 'Other dept' },
  { name: 'Suggestion', kpi: null, evidence: 'none' },
];

export function categoryRule(name) {
  return CATEGORY_RULES.find((rule) => rule.name === name) || null;
}

export function slaDeadlineFor(category, from = new Date()) {
  const rule = categoryRule(category);
  if (!rule || (rule.slaMinutes == null && !rule.sameDay)) return null;
  const start = from instanceof Date ? from : new Date(from);
  if (Number.isNaN(start.getTime())) return null;
  if (rule.sameDay) {
    const end = new Date(start);
    end.setHours(23, 59, 0, 0);
    return end.toISOString();
  }
  return new Date(start.getTime() + rule.slaMinutes * 60 * 1000).toISOString();
}

export function isClosedStatus(status) {
  return CLOSED_STATUSES.includes(status);
}

export function isOverdue(issue, now = Date.now()) {
  if (!issue?.slaDeadline || isClosedStatus(issue.status)) return false;
  return new Date(issue.slaDeadline).getTime() < now;
}

export function timeLeftLabel(deadline, now = Date.now(), status) {
  if (isClosedStatus(status)) return 'Closed';
  if (!deadline) return 'No SLA';
  const mins = Math.round((new Date(deadline).getTime() - now) / 60000);
  const abs = Math.abs(mins);
  const text = abs < 60 ? `${abs}m` : `${Math.round(abs / 60)}h`;
  return mins < 0 ? `${text} overdue` : `${text} left`;
}

/** Assigned means only Assigned. In progress is its own tab. Overdue is a flag. */
export function matchesIssueTab(issue, tabId, now = Date.now()) {
  switch (tabId) {
    case 'submitted':
      return issue.status === 'Submitted' || issue.status === 'Verification Pending';
    case 'assigned':
      return issue.status === 'Assigned';
    case 'onsite':
      return ['On site', 'In Progress', 'Acknowledged', 'Closure submitted', 'Proof rejected'].includes(issue.status);
    case 'overdue':
      return isOverdue(issue, now);
    case 'closed':
      return issue.status === 'Resolved' || issue.status === 'Closed' || issue.status === 'Pending citizen';
    case 'reopened':
      return issue.status === 'Reopened';
    default:
      return true;
  }
}

export function validateClosureProof(issue, proof) {
  const rule = categoryRule(issue?.category);
  if (!rule || rule.evidence === 'none') return { ok: true };
  if (!proof || String(proof.id || '').startsWith('demo-evidence')) {
    return { ok: false, reason: 'Closure needs a camera photo or a GPS stop. A demo-evidence checkbox is not proof.' };
  }
  if (proof.kind === 'gps') {
    if (rule.evidence !== 'gps_or_photo') {
      return { ok: false, reason: 'This category closes with a photo, not a GPS stop.' };
    }
    const max = rule.gpsDistanceM ?? 25;
    if (Number(proof.distanceM) > max) {
      return { ok: false, reason: `GPS stop must be within ${max} m of the building.` };
    }
    return { ok: true };
  }
  if (proof.source === 'gallery') {
    return { ok: false, reason: 'Gallery photos are not accepted. Take the photo in the app camera.' };
  }
  if (proof.source !== 'camera') {
    return { ok: false, reason: 'Take the after-photo with the in-app camera.' };
  }
  const captured = new Date(proof.capturedAt).getTime();
  if (!captured || Number.isNaN(captured)) {
    return { ok: false, reason: 'Photo is missing a capture time.' };
  }
  const ageMin = (Date.now() - captured) / 60000;
  if (ageMin > 30) {
    return { ok: false, reason: 'Photo must be no more than 30 minutes old.' };
  }
  const maxPhoto = rule.photoDistanceM ?? 10;
  if (Number(proof.distanceM) > maxPhoto) {
    return { ok: false, reason: `Photo must be within ${maxPhoto} m of the issue pin.` };
  }
  return { ok: true };
}

/** Households with a valid collection stop, divided by households on that block. */
export function blockCoveragePercent(households) {
  const list = households || [];
  if (!list.length) return null;
  const served = list.filter((h) => h.coverageStatus === 'Collected').length;
  return Math.round((served / list.length) * 100);
}

export function applyHouseholdCoverage(vehicles, routes, blocks, households) {
  (blocks || []).forEach((block) => {
    const rows = (households || []).filter((h) => h.blockId === block.id);
    const pct = blockCoveragePercent(rows);
    if (pct == null) return;
    block.coveragePct = pct;
    const route = (routes || []).find((r) => r.blockId === block.id);
    if (route) route.householdCoverage = pct;
    const vehicle = (vehicles || []).find((v) => v.blockId === block.id);
    if (vehicle) vehicle.coveragePct = pct;
  });
}

function spotStatus(status) {
  if (status === 'Cleared') return 'Closed';
  if (status === 'In Progress Cleanup') return 'On site';
  return 'Assigned';
}

function aiStatus(status) {
  if (status === 'Resolved') return 'Closed';
  if (status === 'False Positive') return 'Invalid';
  if (status === 'New') return 'Submitted';
  if (status === 'Escalated') return 'Assigned';
  if (status === 'Confirmed' || status === 'Assigned') return 'Assigned';
  return status || 'Submitted';
}

export function buildIssueRegister(data) {
  const complaints = (data?.complaints || []).map((c) => ({
    ...c,
    source: c.source || 'complaint',
    registerKind: 'complaint',
  }));
  const spots = (data?.blackSpots || []).map((spot) => ({
    id: spot.id,
    source: 'black_spot',
    registerKind: 'black_spot',
    readOnly: true,
    category: spot.category === 'Overflowing Bin' ? 'GVP / bin / GTP overflow' : 'Black Spot / Illegal Dumping',
    title: spot.location,
    description: spot.location,
    wardId: spot.wardId,
    blockId: spot.blockId,
    status: spotStatus(spot.status),
    priority: spot.severity || 'Medium',
    reporterName: 'Black spot register',
    createdAt: spot.firstReported,
    slaDeadline: slaDeadlineFor(
      spot.category === 'Overflowing Bin' ? 'GVP / bin / GTP overflow' : 'Black Spot / Illegal Dumping',
      spot.firstReported,
    ),
    history: spot.history || [],
    link: '/sweeping',
  }));
  const events = (data?.aiEvents || []).map((event) => ({
    id: event.id,
    source: 'ai',
    registerKind: 'ai',
    readOnly: true,
    category: event.type === 'Suspected Illegal Dumping' ? 'Dumping / burning' : (event.type || 'Dashcam'),
    title: `${event.type || 'AI event'} ${event.id}`,
    description: event.history?.[0]?.note || event.type,
    wardId: event.wardId,
    blockId: null,
    status: aiStatus(event.status),
    priority: event.severity || 'Medium',
    reporterName: 'Dashcam',
    createdAt: event.timestamp,
    slaDeadline: event.type === 'Suspected Illegal Dumping'
      ? slaDeadlineFor('Dumping / burning', event.timestamp)
      : null,
    history: event.history || [],
    link: '/dashcam',
  }));
  return [...complaints, ...spots, ...events];
}
