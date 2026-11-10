import { createSeedData } from '../data/seed';
import { loadAppData, saveAppData, clearAppData } from '../utils/storage';
import { uid, complaintId, eventId } from '../utils/id';
import { nowISO, todayISO } from '../utils/date';
import { calculateDailyScore, monthlyScoreFromDaily, validateWeights } from '../utils/scoring';
import { DEFAULT_SCORE_WEIGHTS, DEFAULT_SCORE_THRESHOLDS } from '../constants';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

let memory = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try { fn(memory); } catch (e) { console.error(e); }
  });
}

function persist() {
  saveAppData(memory);
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDataSync() {
  return memory;
}

export async function initStore() {
  await delay(50);
  const existing = loadAppData();
  if (existing && existing.vehicles) {
    memory = existing;
  } else {
    memory = createSeedData();
    persist();
  }
  return memory;
}

export async function resetDemoData() {
  await delay(200);
  clearAppData();
  memory = createSeedData();
  persist();
  return memory;
}

export async function restoreSampleData() {
  return resetDemoData();
}

function ensure() {
  if (!memory) throw new Error('Store not initialised');
  return memory;
}

function pushAudit(actor, action, entityType, entityId, detail) {
  memory.auditLog.unshift({
    id: uid('audit'),
    at: nowISO(),
    actor,
    action,
    entityType,
    entityId,
    detail,
  });
}

function pushNotification(partial) {
  memory.notifications.unshift({
    id: uid('notif'),
    read: false,
    createdAt: nowISO(),
    priority: 'Medium',
    ...partial,
  });
}

/* ---------- Lookups ---------- */
export async function getDashboardStats({ wardId, corporationId, dateFilter } = {}) {
  await delay();
  const data = ensure();
  let vehicles = [...data.vehicles];
  let complaints = [...data.complaints];
  let routes = [...data.routes];
  let aiEvents = [...data.aiEvents];
  let sweeping = [...data.sweepingStretches];

  if (wardId) {
    vehicles = vehicles.filter((v) => v.wardId === wardId);
    complaints = complaints.filter((c) => c.wardId === wardId);
    routes = routes.filter((r) => r.wardId === wardId);
    aiEvents = aiEvents.filter((e) => e.wardId === wardId);
    sweeping = sweeping.filter((s) => s.wardId === wardId);
  }
  if (corporationId) {
    vehicles = vehicles.filter((v) => v.corporationId === corporationId);
    const wardIds = new Set(data.wards.filter((w) => w.corporationId === corporationId).map((w) => w.id));
    complaints = complaints.filter((c) => wardIds.has(c.wardId));
    routes = routes.filter((r) => r.corporationId === corporationId);
  }

  const onRoute = vehicles.filter((v) => v.status === 'On Route').length;
  const stopsCompleted = vehicles.reduce((s, v) => s + (v.completedStops || 0), 0);
  const stopsExpected = vehicles.reduce((s, v) => s + (v.expectedStops || 0), 0);
  const coverage = stopsExpected ? Math.round((stopsCompleted / stopsExpected) * 100) : 0;
  const openComplaints = complaints.filter((c) => !['Resolved'].includes(c.status)).length;
  const unresolvedAi = aiEvents.filter((e) => !['Resolved', 'False Positive'].includes(e.status)).length;
  const speedAlerts = aiEvents.filter((e) => e.type === 'Speeding' && e.status !== 'False Positive').length;
  const sweepingDone = sweeping.filter((s) => s.status === 'Completed').length;
  const dwcPending = data.dryWasteCentres.filter((d) => d.visitStatus === 'Pending').length;
  const dwcVisited = data.dryWasteCentres.filter((d) => d.visitStatus === 'Completed').length;

  const complaintsByCategory = {};
  complaints.forEach((c) => {
    complaintsByCategory[c.category] = (complaintsByCategory[c.category] || 0) + 1;
  });

  const vehicleStatus = {};
  vehicles.forEach((v) => {
    vehicleStatus[v.status] = (vehicleStatus[v.status] || 0) + 1;
  });

  const wardPerf = data.wards.map((w) => {
    const wv = data.vehicles.filter((v) => v.wardId === w.id);
    const done = wv.reduce((s, v) => s + v.completedStops, 0);
    const exp = wv.reduce((s, v) => s + v.expectedStops, 0);
    return {
      wardId: w.id,
      name: w.name,
      coverage: exp ? Math.round((done / exp) * 100) : 0,
      vehicles: wv.length,
      openComplaints: data.complaints.filter((c) => c.wardId === w.id && c.status !== 'Resolved').length,
    };
  });

  return {
    dateFilter: dateFilter || 'daily',
    kpis: {
      totalAutos: vehicles.length,
      autosOnRoute: onRoute,
      stopsCompleted,
      householdCoverage: coverage,
      avgRouteDuration: 178,
      activeSpeedAlerts: speedAlerts,
      sweepingPointsCompleted: sweepingDone,
      dryWasteCentreVisits: dwcVisited,
      openComplaints,
      unresolvedAiEvents: unresolvedAi,
      dwcPending,
    },
    charts: {
      complaintsByCategory: Object.entries(complaintsByCategory).map(([name, value]) => ({ name, value })),
      vehicleStatus: Object.entries(vehicleStatus).map(([name, value]) => ({ name, value })),
      coverageTrend: Array.from({ length: 7 }, (_, i) => ({
        day: `D-${6 - i}`,
        coverage: 78 + Math.round(Math.sin(i) * 8) + i,
        completion: 80 + Math.round(Math.cos(i) * 6) + i,
      })),
      routePerformance: routes.slice(0, 8).map((r) => ({
        name: r.name,
        coverage: r.householdCoverage,
        stops: r.completedStops,
      })),
    },
    alerts: buildAlerts(data, vehicles, complaints),
    wardPerformance: wardPerf,
    recentActivity: data.auditLog.slice(0, 12),
    meta: data._meta,
  };
}

function buildAlerts(data, vehicles, complaints) {
  const alerts = [];
  vehicles.filter((v) => v.status === 'Delayed').forEach((v) => {
    alerts.push({ id: `alert-late-${v.id}`, type: 'Late Vehicle', severity: 'High', message: `${v.displayName} is delayed`, link: '/vehicles', relatedId: v.id });
  });
  data.aiEvents.filter((e) => e.type === 'Unusual Stoppage' && e.status === 'New').forEach((e) => {
    alerts.push({ id: `alert-stop-${e.id}`, type: 'Unusual Stoppage', severity: 'Medium', message: `Unusual stoppage ${e.id}`, link: '/dashcam', relatedId: e.id });
  });
  data.aiEvents.filter((e) => e.type === 'Route Deviation' && !['False Positive', 'Resolved'].includes(e.status)).forEach((e) => {
    alerts.push({ id: `alert-dev-${e.id}`, type: 'Route Deviation', severity: 'Low', message: `Route deviation ${e.id}`, link: '/dashcam', relatedId: e.id });
  });
  vehicles.filter((v) => v.coveragePct < 70 && v.status !== 'Offline').forEach((v) => {
    alerts.push({ id: `alert-cov-${v.id}`, type: 'Low Coverage', severity: 'High', message: `${v.displayName} coverage ${v.coveragePct}%`, link: '/coverage', relatedId: v.id });
  });
  data.dryWasteCentres.filter((d) => d.visitStatus === 'Pending').forEach((d) => {
    alerts.push({ id: `alert-dwc-${d.id}`, type: 'Pending Centre Visit', severity: 'Medium', message: `${d.name} visit pending`, link: '/dry-waste-centres', relatedId: d.id });
  });
  complaints.filter((c) => !['Resolved'].includes(c.status)).slice(0, 5).forEach((c) => {
    alerts.push({ id: `alert-cmp-${c.id}`, type: 'Open Complaint', severity: c.priority === 'Critical' ? 'Critical' : 'Medium', message: `${c.id}: ${c.title}`, link: '/complaints', relatedId: c.id });
  });
  return alerts;
}

/* ---------- Vehicles ---------- */
export async function getVehicles(filters = {}) {
  await delay();
  let list = [...ensure().vehicles];
  if (filters.wardId) list = list.filter((v) => v.wardId === filters.wardId);
  if (filters.status) list = list.filter((v) => v.status === filters.status);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((v) =>
      v.autoId.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.displayName.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function getVehicle(id) {
  await delay();
  return ensure().vehicles.find((v) => v.id === id) || null;
}

export async function refreshVehicleLocation(id, actor = 'Demo User') {
  await delay(300);
  const v = ensure().vehicles.find((x) => x.id === id);
  if (!v) throw new Error('Vehicle not found');
  v.lat = Number((v.lat + (Math.random() - 0.5) * 0.002).toFixed(5));
  v.lng = Number((v.lng + (Math.random() - 0.5) * 0.002).toFixed(5));
  v.lastUpdate = nowISO();
  if (v.status === 'On Route') v.speed = 12 + Math.floor(Math.random() * 20);
  v.locationHistory = [
    ...(v.locationHistory || []).slice(-8),
    { lat: v.lat, lng: v.lng, timestamp: nowISO(), speed: v.speed },
  ];
  pushAudit(actor, 'Simulated Location Refresh', 'vehicle', id, `Location refreshed for ${v.displayName}`);
  persist();
  return v;
}

export async function updateVehicle(id, patch, actor = 'Admin') {
  await delay();
  const v = ensure().vehicles.find((x) => x.id === id);
  if (!v) throw new Error('Vehicle not found');
  Object.assign(v, patch);
  pushAudit(actor, 'Update Vehicle', 'vehicle', id, JSON.stringify(patch));
  persist();
  return v;
}

/* ---------- Routes / Blocks / Coverage ---------- */
export async function getRoutes(filters = {}) {
  await delay();
  let list = [...ensure().routes];
  if (filters.wardId) list = list.filter((r) => r.wardId === filters.wardId);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }
  return list;
}

export async function getBlocks(filters = {}) {
  await delay();
  let list = [...ensure().blocks];
  if (filters.wardId) list = list.filter((b) => b.wardId === filters.wardId);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
  }
  return list;
}

export async function getHouseholds(filters = {}) {
  await delay();
  let list = [...ensure().households];
  if (filters.wardId) list = list.filter((h) => h.wardId === filters.wardId);
  if (filters.blockId) list = list.filter((h) => h.blockId === filters.blockId);
  if (filters.status) list = list.filter((h) => h.coverageStatus === filters.status);
  return list;
}

export async function markStopCompleted(householdId, actor = 'Supervisor') {
  await delay();
  const hh = ensure().households.find((h) => h.id === householdId);
  if (!hh) throw new Error('Household not found');
  hh.coverageStatus = 'Collected';
  hh.lastCollection = todayISO();
  hh.verificationMethod = 'Manual';
  const route = memory.routes.find((r) => r.id === hh.routeId);
  if (route) {
    route.completedStops = Math.min(route.expectedStops, route.completedStops + 1);
    route.householdCoverage = Math.round((route.completedStops / route.expectedStops) * 100);
  }
  const vehicle = memory.vehicles.find((v) => v.routeId === hh.routeId);
  if (vehicle) {
    vehicle.completedStops = Math.min(vehicle.expectedStops, vehicle.completedStops + 1);
    vehicle.coveragePct = Math.round((vehicle.completedStops / vehicle.expectedStops) * 100);
  }
  pushAudit(actor, 'Mark Stop Completed', 'household', householdId, `Stop marked collected (simulated)`);
  persist();
  return hh;
}

export async function flagMissedPickup(householdId, actor = 'Supervisor') {
  await delay();
  const hh = ensure().households.find((h) => h.id === householdId);
  if (!hh) throw new Error('Household not found');
  hh.coverageStatus = 'Missed';
  pushAudit(actor, 'Flag Missed Pickup', 'household', householdId, 'Missed pickup flagged');
  pushNotification({
    category: 'Low Household Coverage',
    title: 'Missed pickup flagged',
    message: `Household ${hh.doorNo}, ${hh.street} marked missed`,
    relatedType: 'household',
    relatedId: householdId,
    link: '/coverage',
    priority: 'High',
  });
  persist();
  return hh;
}

export async function reassignRoute(blockId, newVehicleId, actor = 'Admin') {
  await delay();
  const block = ensure().blocks.find((b) => b.id === blockId);
  if (!block) throw new Error('Block not found');
  const oldVehicleId = block.vehicleId;
  block.vehicleId = newVehicleId;
  const route = memory.routes.find((r) => r.id === block.routeId);
  if (route) route.vehicleId = newVehicleId;
  pushAudit(actor, 'Reassign Route', 'block', blockId, `Reassigned from ${oldVehicleId} to ${newVehicleId}`);
  persist();
  return block;
}

/* ---------- Dry waste centres ---------- */
export async function getDryWasteCentres(filters = {}) {
  await delay();
  let list = [...ensure().dryWasteCentres];
  if (filters.wardId) list = list.filter((d) => d.wardId === filters.wardId || d.assignedWardIds?.includes(filters.wardId));
  if (filters.status) list = list.filter((d) => d.visitStatus === filters.status);
  return list;
}

export async function recordDwcArrival(id, actor = 'Supervisor') {
  await delay();
  const dwc = ensure().dryWasteCentres.find((d) => d.id === id);
  if (!dwc) throw new Error('Centre not found');
  dwc.actualArrival = new Date().toTimeString().slice(0, 5);
  dwc.visitStatus = 'In Progress';
  dwc.dwellMinutes = 0;
  pushAudit(actor, 'Record DWC Arrival', 'dwc', id, `Arrival recorded at ${dwc.actualArrival}`);
  persist();
  return dwc;
}

export async function recordWasteHandover(id, quantities, actor = 'Supervisor') {
  await delay();
  const dwc = ensure().dryWasteCentres.find((d) => d.id === id);
  if (!dwc) throw new Error('Centre not found');
  if (quantities) dwc.quantities = { ...dwc.quantities, ...quantities };
  dwc.handoverStatus = 'Completed';
  dwc.visitStatus = 'Completed';
  dwc.dwellMinutes = dwc.dwellMinutes || 18;
  pushAudit(actor, 'Record Waste Handover', 'dwc', id, 'Handover completed (illustrative quantities)');
  persist();
  return dwc;
}

export async function addDwcNote(id, note, actor = 'Supervisor') {
  await delay();
  const dwc = ensure().dryWasteCentres.find((d) => d.id === id);
  if (!dwc) throw new Error('Centre not found');
  dwc.notes = dwc.notes || [];
  dwc.notes.unshift({ at: nowISO(), by: actor, note });
  persist();
  return dwc;
}

export async function markDwcException(id, reason, actor = 'Supervisor') {
  await delay();
  const dwc = ensure().dryWasteCentres.find((d) => d.id === id);
  if (!dwc) throw new Error('Centre not found');
  dwc.visitStatus = 'Exception';
  dwc.notes = dwc.notes || [];
  dwc.notes.unshift({ at: nowISO(), by: actor, note: `Exception: ${reason}` });
  pushNotification({
    category: 'Pending Dry Waste Centre Visit',
    title: 'DWC exception marked',
    message: `${dwc.name}: ${reason}`,
    relatedType: 'dwc',
    relatedId: id,
    link: '/dry-waste-centres',
    priority: 'High',
  });
  pushAudit(actor, 'DWC Exception', 'dwc', id, reason);
  persist();
  return dwc;
}

/* ---------- Complaints ---------- */
export async function getComplaints(filters = {}) {
  await delay();
  let list = [...ensure().complaints];
  if (filters.status) list = list.filter((c) => c.status === filters.status);
  if (filters.category) list = list.filter((c) => c.category === filters.category);
  if (filters.wardId) list = list.filter((c) => c.wardId === filters.wardId);
  if (filters.reporterId) list = list.filter((c) => c.reporterId === filters.reporterId);
  if (filters.assignedTo) list = list.filter((c) => c.assignedTo === filters.assignedTo);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((c) =>
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list;
}

export async function getComplaint(id) {
  await delay();
  return ensure().complaints.find((c) => c.id === id) || null;
}

export async function createComplaint(payload, actor = 'Citizen') {
  await delay(250);
  const id = complaintId();
  const complaint = {
    id,
    category: payload.category,
    title: payload.title || payload.category,
    description: payload.description,
    reporterName: payload.reporterName || actor,
    reporterId: payload.reporterId,
    wardId: payload.wardId,
    blockId: payload.blockId,
    houseAddress: payload.houseAddress || null,
    routeId: payload.routeId || null,
    lat: payload.lat || null,
    lng: payload.lng || null,
    createdAt: nowISO(),
    priority: payload.priority || 'Medium',
    assignedTo: null,
    status: 'Submitted',
    photoDataUrl: payload.photoDataUrl || null,
    slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    history: [{ at: nowISO(), action: 'Submitted', by: actor, note: payload.houseAddress ? `Submitted · ${payload.houseAddress}` : 'Complaint submitted' }],
  };
  ensure().complaints.unshift(complaint);
  pushNotification({
    category: 'New Assignment',
    title: 'New complaint submitted',
    message: `${id}: ${complaint.title}`,
    relatedType: 'complaint',
    relatedId: id,
    link: '/complaints',
    priority: complaint.priority === 'Critical' ? 'Critical' : 'Medium',
  });
  pushAudit(actor, 'Create Complaint', 'complaint', id, complaint.title);
  persist();
  return complaint;
}

const PICKUP_CATEGORIES = ['Skipped Household Pickup', 'Late Auto', 'Missed Dry Waste Collection'];

export async function updateComplaintStatus(id, status, note, actor = 'Supervisor', evidence = null) {
  await delay();
  const c = ensure().complaints.find((x) => x.id === id);
  if (!c) throw new Error('Complaint not found');
  if (status === 'Resolved') {
    const needsEvidence = PICKUP_CATEGORIES.includes(c.category);
    if (needsEvidence && !evidence && !c.resolutionEvidence) {
      throw new Error('Resolution evidence (photo or demo evidence) is required for pickup-related complaints');
    }
    if (evidence) c.resolutionEvidence = evidence;
  }
  c.status = status;
  c.history.push({ at: nowISO(), action: status, by: actor, note: note || status });
  if (status === 'Resolved') {
    pushNotification({
      category: 'Resolved Complaint',
      title: 'Complaint resolved',
      message: `${id} marked resolved`,
      relatedType: 'complaint',
      relatedId: id,
      link: '/complaints',
      priority: 'Low',
    });
  }
  pushAudit(actor, `Complaint → ${status}`, 'complaint', id, note || '');
  persist();
  return c;
}

export async function assignComplaint(id, supervisorId, actor = 'Admin') {
  await delay();
  const c = ensure().complaints.find((x) => x.id === id);
  if (!c) throw new Error('Complaint not found');
  c.assignedTo = supervisorId;
  c.status = c.status === 'Submitted' || c.status === 'Verified' ? 'Assigned' : c.status;
  const sup = memory.supervisors.find((s) => s.id === supervisorId);
  c.history.push({ at: nowISO(), action: 'Assigned', by: actor, note: `Assigned to ${sup?.name || supervisorId}` });
  pushNotification({
    category: 'New Assignment',
    title: 'Complaint assigned',
    message: `${id} assigned to ${sup?.name || supervisorId}`,
    relatedType: 'complaint',
    relatedId: id,
    link: '/complaints',
  });
  pushAudit(actor, 'Assign Complaint', 'complaint', id, supervisorId);
  persist();
  return c;
}

export async function addComplaintNote(id, note, actor = 'Supervisor') {
  await delay();
  const c = ensure().complaints.find((x) => x.id === id);
  if (!c) throw new Error('Complaint not found');
  c.history.push({ at: nowISO(), action: 'Note', by: actor, note });
  persist();
  return c;
}

export async function reopenComplaint(id, reason, actor = 'Citizen') {
  await delay();
  const c = ensure().complaints.find((x) => x.id === id);
  if (!c) throw new Error('Complaint not found');
  if (c.status !== 'Resolved') throw new Error('Only resolved complaints can be reopened');
  c.status = 'Reopened';
  c.history.push({ at: nowISO(), action: 'Reopened', by: actor, note: reason });
  pushAudit(actor, 'Reopen Complaint', 'complaint', id, reason);
  persist();
  return c;
}

export async function updateComplaintPriority(id, priority, actor = 'Supervisor') {
  await delay();
  const c = ensure().complaints.find((x) => x.id === id);
  if (!c) throw new Error('Complaint not found');
  c.priority = priority;
  c.history.push({ at: nowISO(), action: 'Priority Updated', by: actor, note: `Priority set to ${priority}` });
  persist();
  return c;
}

/* ---------- Sweeping / Black spots ---------- */
export async function getSweepingStretches(filters = {}) {
  await delay();
  let list = [...ensure().sweepingStretches];
  if (filters.wardId) list = list.filter((s) => s.wardId === filters.wardId);
  return list;
}

export async function getBlackSpots(filters = {}) {
  await delay();
  let list = [...ensure().blackSpots];
  if (filters.wardId) list = list.filter((b) => b.wardId === filters.wardId);
  if (filters.status) list = list.filter((b) => b.status === filters.status);
  return list;
}

export async function createBlackSpot(payload, actor = 'Supervisor') {
  await delay();
  const spot = {
    id: uid('bs'),
    category: payload.category,
    severity: payload.severity || 'Medium',
    wardId: payload.wardId,
    location: payload.location,
    lat: payload.lat,
    lng: payload.lng,
    firstReported: todayISO(),
    daysUnresolved: 0,
    assignedTeam: payload.assignedTeam || null,
    status: 'Open',
    previousReports: 1,
    evidencePlaceholders: payload.evidencePlaceholders || [],
    history: [{ at: nowISO(), action: 'Reported', by: actor, note: payload.note || 'Black spot created' }],
  };
  ensure().blackSpots.unshift(spot);
  pushAudit(actor, 'Create Black Spot', 'blackSpot', spot.id, spot.location);
  persist();
  return spot;
}

export async function updateBlackSpot(id, patch, note, actor = 'Supervisor') {
  await delay();
  const spot = ensure().blackSpots.find((b) => b.id === id);
  if (!spot) throw new Error('Black spot not found');
  Object.assign(spot, patch);
  if (patch.status === 'Cleared') spot.daysUnresolved = 0;
  spot.history.push({ at: nowISO(), action: patch.status || 'Updated', by: actor, note: note || '' });
  pushAudit(actor, 'Update Black Spot', 'blackSpot', id, note || JSON.stringify(patch));
  persist();
  return spot;
}

/* ---------- AI Events ---------- */
export async function getAiEvents(filters = {}) {
  await delay();
  let list = [...ensure().aiEvents];
  if (filters.type) list = list.filter((e) => e.type === filters.type);
  if (filters.severity) list = list.filter((e) => e.severity === filters.severity);
  if (filters.wardId) list = list.filter((e) => e.wardId === filters.wardId);
  if (filters.status) list = list.filter((e) => e.status === filters.status);
  if (filters.minConfidence) list = list.filter((e) => e.confidence >= filters.minConfidence);
  return list;
}

export async function reviewAiEvent(id, action, note, actor = 'Supervisor', team = null) {
  await delay();
  const ev = ensure().aiEvents.find((e) => e.id === id);
  if (!ev) throw new Error('Event not found');
  const statusMap = {
    confirm: 'Confirmed',
    falsePositive: 'False Positive',
    assign: 'Assigned',
    escalate: 'Escalated',
    resolve: 'Resolved',
  };
  const status = statusMap[action] || action;
  ev.status = status;
  if (team) ev.assignedTeam = team;
  ev.history.push({ at: nowISO(), action: status, by: actor, note: note || status });
  pushAudit(actor, `AI Event → ${status}`, 'aiEvent', id, note || '');
  persist();
  return ev;
}

/* ---------- Scorecards ---------- */
export async function getDailyScores(filters = {}) {
  await delay();
  let list = [...ensure().dailyScores];
  if (filters.date) list = list.filter((s) => s.date === filters.date);
  if (filters.wardId) list = list.filter((s) => s.wardId === filters.wardId);
  if (filters.vehicleId) list = list.filter((s) => s.vehicleId === filters.vehicleId);
  return list;
}

export async function getMonthlyScore(vehicleId, dates) {
  await delay();
  const scores = ensure().dailyScores.filter((s) => s.vehicleId === vehicleId && (!dates || dates.includes(s.date)));
  return monthlyScoreFromDaily(scores);
}

export async function getScoreConfig() {
  await delay();
  return ensure().scoreConfig;
}

export async function updateScoreConfig(config, actor = 'Admin') {
  await delay();
  const weights = config.weights || memory.scoreConfig.weights;
  const check = validateWeights(weights);
  if (!check.valid) throw new Error(check.message);
  memory.scoreConfig = { ...memory.scoreConfig, ...config, weights };
  pushAudit(actor, 'Update Score Config', 'settings', 'scoreConfig', check.message);
  persist();
  return memory.scoreConfig;
}

export async function resetScoreConfig(actor = 'Admin') {
  await delay();
  memory.scoreConfig = {
    weights: { ...DEFAULT_SCORE_WEIGHTS },
    thresholds: { ...DEFAULT_SCORE_THRESHOLDS },
    shadowRunMode: true,
    shadowRunMonths: 2,
  };
  pushAudit(actor, 'Reset Score Config', 'settings', 'scoreConfig', 'Defaults restored');
  persist();
  return memory.scoreConfig;
}

export async function correctScore(scoreId, reason, inputs, actor = 'Admin') {
  await delay();
  const score = ensure().dailyScores.find((s) => s.id === scoreId);
  if (!score) throw new Error('Score not found');
  const newInputs = { ...score.inputs, ...inputs };
  const result = calculateDailyScore(newInputs, memory.scoreConfig.weights, memory.scoreConfig.thresholds);
  Object.assign(score, result, { inputs: newInputs });
  score.exceptions = score.exceptions || [];
  score.exceptions.push({ at: nowISO(), by: actor, reason, previousTotal: score.total });
  pushAudit(actor, 'Correct Score', 'score', scoreId, reason);
  persist();
  return score;
}

/* ---------- Notifications ---------- */
export async function getNotifications() {
  await delay(80);
  return [...ensure().notifications];
}

export async function markNotificationRead(id) {
  await delay(50);
  const n = ensure().notifications.find((x) => x.id === id);
  if (n) n.read = true;
  persist();
  return n;
}

export async function markAllNotificationsRead() {
  await delay(50);
  ensure().notifications.forEach((n) => { n.read = true; });
  persist();
  return memory.notifications;
}

export async function archiveNotification(id) {
  await delay(50);
  memory.notifications = ensure().notifications.filter((n) => n.id !== id);
  persist();
  return true;
}

/* ---------- Master data ---------- */
export async function getWards() {
  await delay(50);
  return [...ensure().wards];
}

export async function getCorporations() {
  await delay(50);
  return [...ensure().corporations];
}

export async function getSupervisors() {
  await delay(50);
  return [...ensure().supervisors];
}

export async function getMeta() {
  await delay(30);
  return ensure()._meta;
}

export async function getImpactMetrics() {
  await delay();
  return ensure().impactMetrics;
}

export async function getFeedback(filters = {}) {
  await delay();
  let list = [...ensure().feedback];
  if (filters.citizenId) list = list.filter((f) => f.citizenId === filters.citizenId);
  return list;
}

export async function submitFeedback(payload, actor = 'Citizen') {
  await delay();
  const date = payload.date || todayISO();
  const list = ensure().feedback;
  const existingIdx = list.findIndex(
    (f) => f.citizenId === payload.citizenId && f.date === date,
  );
  const fb = {
    id: existingIdx >= 0 ? list[existingIdx].id : uid('fb'),
    createdAt: nowISO(),
    ...payload,
    date,
  };
  if (existingIdx >= 0) list[existingIdx] = fb;
  else list.unshift(fb);
  pushAudit(actor, 'Submit Feedback', 'feedback', fb.id, `Rating ${fb.rating}`);
  persist();
  return fb;
}

export async function getAuditLog(limit = 50) {
  await delay();
  return ensure().auditLog.slice(0, limit);
}

export async function getCompactors() {
  await delay();
  return [...ensure().compactors];
}

export async function getFacilities() {
  await delay();
  return [...ensure().facilities];
}

export async function upsertMasterRecord(collection, record, actor = 'Admin') {
  await delay();
  const list = ensure()[collection];
  if (!list) throw new Error('Unknown collection');
  const idx = list.findIndex((x) => x.id === record.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...record };
  else list.push(record);
  pushAudit(actor, `Upsert ${collection}`, collection, record.id, 'Master data updated');
  persist();
  return record;
}

export async function deactivateMasterRecord(collection, id, actor = 'Admin') {
  await delay();
  const item = ensure()[collection]?.find((x) => x.id === id);
  if (!item) throw new Error('Not found');
  item.active = false;
  pushAudit(actor, `Deactivate ${collection}`, collection, id, 'Deactivated');
  persist();
  return item;
}

/* ---------- AI Assistant (rule-based) ---------- */
export async function askAssistant(question, role = 'admin', user = null) {
  await delay(400);
  const data = ensure();
  const q = (question || '').toLowerCase();
  const links = [];
  let answer = '';
  let table = null;

  const wardFilter = role === 'supervisor' && user?.wardIds ? new Set(user.wardIds) : null;
  const citizenWard = role === 'citizen' ? user?.wardId : null;

  if (q.includes('coverage below') || (q.includes('coverage') && q.includes('90'))) {
    let wards = data.wards.map((w) => {
      const vs = data.vehicles.filter((v) => v.wardId === w.id);
      const done = vs.reduce((s, v) => s + v.completedStops, 0);
      const exp = vs.reduce((s, v) => s + v.expectedStops, 0) || 1;
      return { ward: w.name, coverage: Math.round((done / exp) * 100), vehicles: vs.length };
    }).filter((w) => w.coverage < 90);
    if (wardFilter) wards = wards.filter((w) => {
      const ward = data.wards.find((x) => x.name === w.ward);
      return ward && wardFilter.has(ward.id);
    });
    answer = wards.length
      ? `Based on current demo data, ${wards.length} ward(s) have coverage below 90%.`
      : 'No wards currently show coverage below 90% in the demo dataset.';
    table = wards;
    links.push({ label: 'Household Coverage', path: '/coverage' });
  } else if (q.includes('pending') && (q.includes('dry') || q.includes('dwc') || q.includes('centre') || q.includes('center'))) {
    let pending = data.dryWasteCentres.filter((d) => d.visitStatus === 'Pending');
    if (wardFilter) pending = pending.filter((d) => wardFilter.has(d.wardId));
    answer = `${pending.length} dry-waste centre(s) have pending visits in the demo data.`;
    table = pending.map((d) => ({ centre: d.name, status: d.visitStatus, scheduled: d.scheduledArrival }));
    links.push({ label: 'Dry Waste Centres', path: '/dry-waste-centres' });
  } else if (q.includes('ward 112') || q.includes('112')) {
    const vs = data.vehicles.filter((v) => v.wardId === 'ward-112');
    const done = vs.reduce((s, v) => s + v.completedStops, 0);
    const exp = vs.reduce((s, v) => s + v.expectedStops, 0) || 1;
    const cov = Math.round((done / exp) * 100);
    const delayed = vs.filter((v) => v.status === 'Delayed').length;
    const openCmp = data.complaints.filter((c) => c.wardId === 'ward-112' && c.status !== 'Resolved').length;
    answer = `Ward 112 (Indiranagar) demo coverage is ${cov}%. ${delayed} delayed auto(s), ${openCmp} open complaint(s). Coverage drops in the demo are typically explained by delayed/offline vehicles and missed stops — not live BBMP telemetry.`;
    table = vs.map((v) => ({ auto: v.displayName, status: v.status, coverage: `${v.coveragePct}%` }));
    links.push({ label: 'Dashboard', path: '/dashboard' });
  } else if (q.includes('overdue') || (q.includes('complaint') && q.includes('ward'))) {
    let list = data.complaints.filter((c) => c.status !== 'Resolved');
    if (citizenWard) list = list.filter((c) => c.wardId === citizenWard && c.reporterId === user?.id);
    else if (wardFilter) list = list.filter((c) => wardFilter.has(c.wardId));
    answer = `${list.length} open/unresolved complaint(s) match your query in the demo dataset.`;
    table = list.slice(0, 8).map((c) => ({ id: c.id, title: c.title, status: c.status, priority: c.priority }));
    links.push({ label: 'Complaints', path: '/complaints' });
  } else if (q.includes('black spot') || q.includes('unresolved')) {
    let spots = [...data.blackSpots].filter((b) => b.status !== 'Cleared').sort((a, b) => b.daysUnresolved - a.daysUnresolved);
    if (wardFilter) spots = spots.filter((b) => wardFilter.has(b.wardId));
    if (citizenWard) spots = spots.filter((b) => b.wardId === citizenWard);
    answer = spots.length
      ? `Longest unresolved black spot in demo data: ${spots[0].location} (${spots[0].daysUnresolved} days).`
      : 'No unresolved black spots in filtered demo data.';
    table = spots.slice(0, 5).map((b) => ({ location: b.location, days: b.daysUnresolved, severity: b.severity, status: b.status }));
    links.push({ label: 'Sweeping & Black Spots', path: '/sweeping' });
  } else if (q.includes('score') || q.includes('performance')) {
    const today = todayISO();
    let scores = data.dailyScores.filter((s) => s.date === today);
    if (wardFilter) scores = scores.filter((s) => wardFilter.has(s.wardId));
    const avg = scores.length ? Math.round(scores.reduce((s, x) => s + x.total, 0) / scores.length) : 0;
    answer = `Today's demo average score is ${avg}/100 across ${scores.length} vehicle(s). Shadow-run mode is ${data.scoreConfig.shadowRunMode ? 'ON' : 'OFF'} — scores are illustrative and not payment recommendations.`;
    table = scores.slice(0, 8).map((s) => {
      const v = data.vehicles.find((x) => x.id === s.vehicleId);
      return { vehicle: v?.displayName || s.vehicleId, score: s.total, band: s.band };
    });
    links.push({ label: 'Performance Scorecards', path: '/scorecards' });
  } else {
    answer = 'I can answer from the current demo dataset. Try asking about coverage below 90%, pending dry-waste-centre visits, Ward 112 coverage, overdue complaints, or longest unresolved black spots.';
    table = [
      { suggestion: 'Which wards had coverage below 90%?' },
      { suggestion: 'Which autos have pending dry-waste-centre visits?' },
      { suggestion: 'Why did Ward 112\'s coverage drop?' },
      { suggestion: 'Show overdue complaints in my ward' },
      { suggestion: 'Which black spots have remained unresolved the longest?' },
    ];
  }

  return {
    id: uid('chat'),
    question,
    answer,
    table,
    links,
    disclaimer: 'Answers are generated locally from demo sample data — not from a connected AI service or live BBMP systems.',
    at: nowISO(),
  };
}
