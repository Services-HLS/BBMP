import { DEFAULT_SCORE_WEIGHTS, DEFAULT_SCORE_THRESHOLDS, BENGALURU_CENTER } from '../constants';
import { calculateDailyScore } from '../utils/scoring';
import { applyHouseholdCoverage, slaDeadlineFor } from '../utils/issues';
import { todayISO, daysAgoISO, nowISO } from '../utils/date';

/** Deterministic pseudo-random from seed string */
function seeded(n) {
  const x = Math.sin(n * 9999) * 10000;
  return x - Math.floor(x);
}

function offsetCoord(baseLat, baseLng, i, scale = 0.04) {
  const lat = baseLat + (seeded(i) - 0.5) * scale;
  const lng = baseLng + (seeded(i + 100) - 0.5) * scale;
  return { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
}

export function createSeedData() {
  const corporations = [
    { id: 'corp-east', name: 'East Corporation', code: 'EAST' },
    { id: 'corp-west', name: 'West Corporation', code: 'WEST' },
    { id: 'corp-north', name: 'North Corporation', code: 'NORTH' },
    { id: 'corp-south', name: 'South Corporation', code: 'SOUTH' },
    { id: 'corp-central', name: 'Central Corporation', code: 'CENTRAL' },
  ];

  const constituencies = [
    { id: 'const-c1', name: 'Shivajinagar', corporationId: 'corp-central' },
    { id: 'const-c2', name: 'Chickpet', corporationId: 'corp-central' },
    { id: 'const-e1', name: 'C.V. Raman Nagar', corporationId: 'corp-east' },
    { id: 'const-e2', name: 'Mahadevapura', corporationId: 'corp-east' },
    { id: 'const-w1', name: 'Rajajinagar', corporationId: 'corp-west' },
    { id: 'const-n1', name: 'Hebbal', corporationId: 'corp-north' },
    { id: 'const-s1', name: 'Jayanagar', corporationId: 'corp-south' },
    { id: 'const-s2', name: 'BTM Layout', corporationId: 'corp-south' },
  ];

  const wardDefs = [
    { id: 'ward-112', name: 'Ward 112 — Indiranagar', number: 112, constituencyId: 'const-e1', corporationId: 'corp-east', lat: 12.9784, lng: 77.6408 },
    { id: 'ward-113', name: 'Ward 113 — Domlur', number: 113, constituencyId: 'const-e1', corporationId: 'corp-east', lat: 12.9609, lng: 77.6387 },
    { id: 'ward-114', name: 'Ward 114 — HAL Airport', number: 114, constituencyId: 'const-e2', corporationId: 'corp-east', lat: 12.9490, lng: 77.6682 },
    { id: 'ward-120', name: 'Ward 120 — Koramangala', number: 120, constituencyId: 'const-s2', corporationId: 'corp-south', lat: 12.9352, lng: 77.6245 },
    { id: 'ward-145', name: 'Ward 145 — Jayanagar', number: 145, constituencyId: 'const-s1', corporationId: 'corp-south', lat: 12.9308, lng: 77.5838 },
    { id: 'ward-65', name: 'Ward 65 — Rajajinagar', number: 65, constituencyId: 'const-w1', corporationId: 'corp-west', lat: 12.9911, lng: 77.5522 },
    { id: 'ward-18', name: 'Ward 18 — Hebbal', number: 18, constituencyId: 'const-n1', corporationId: 'corp-north', lat: 13.0358, lng: 77.5970 },
    { id: 'ward-88', name: 'Ward 88 — Shivajinagar', number: 88, constituencyId: 'const-c1', corporationId: 'corp-central', lat: 12.9850, lng: 77.6050 },
  ];

  const wards = wardDefs.map((w) => ({
    ...w,
    active: true,
    households: 800 + Math.floor(seeded(w.number) * 1200),
    areaKm2: Number((1.2 + seeded(w.number + 5) * 2.5).toFixed(2)),
  }));

  const musters = wards.flatMap((w, wi) =>
    [0, 1].map((mi) => ({
      id: `muster-${w.number}-${mi + 1}`,
      name: `${w.name.split('—')[1]?.trim() || w.name} Muster ${mi + 1}`,
      wardId: w.id,
      corporationId: w.corporationId,
      lat: w.lat + (mi * 0.008),
      lng: w.lng + (mi * 0.006),
    }))
  );

  const supervisors = [
    { id: 'sup-1', name: 'Ramesh Kumar', role: 'JHI', wardIds: ['ward-112', 'ward-113', 'ward-114'], phone: '+91 98XXX XX002', active: true },
    { id: 'sup-2', name: 'Lakshmi Devi', role: 'JHI', wardIds: ['ward-120', 'ward-145'], phone: '+91 98XXX XX004', active: true },
    { id: 'sup-3', name: 'Suresh Patil', role: 'Supervisor', wardIds: ['ward-65', 'ward-18'], phone: '+91 98XXX XX005', active: true },
    { id: 'sup-4', name: 'Fatima Begum', role: 'JHI', wardIds: ['ward-88'], phone: '+91 98XXX XX006', active: true },
  ];

  const contractors = [
    { id: 'con-east', name: 'East Sweep Services', active: true },
    { id: 'con-west', name: 'West Ward Collectors', active: true },
    { id: 'con-north', name: 'North Fleet Co', active: true },
    { id: 'con-south', name: 'South City Waste', active: true },
    { id: 'con-central', name: 'Central Muster Works', active: true },
  ];

  const packages = [
    { id: 'pkg-east', name: 'Package East', contractorId: 'con-east', corporationId: 'corp-east', active: true },
    { id: 'pkg-west', name: 'Package West', contractorId: 'con-west', corporationId: 'corp-west', active: true },
    { id: 'pkg-north', name: 'Package North', contractorId: 'con-north', corporationId: 'corp-north', active: true },
    { id: 'pkg-south', name: 'Package South', contractorId: 'con-south', corporationId: 'corp-south', active: true },
    { id: 'pkg-central', name: 'Package Central', contractorId: 'con-central', corporationId: 'corp-central', active: true },
  ];

  const packageFor = (corporationId) => packages.find((pkg) => pkg.corporationId === corporationId) || null;

  const driverNames = [
    'Manjunath R', 'Venkat G', 'Imran Khan', 'Suresh B', 'Naveen K',
    'Ravi Prasad', 'Abdul Rahman', 'Gopal Krishna', 'Yogesh M', 'Prakash T',
    'Anil Kumar', 'Dinesh S', 'Harish N', 'Kiran Raj', 'Mohan Das',
    'Pavan Gowda', 'Santosh R', 'Umesh P', 'Vijay Kumar', 'Ashok N',
    'Basavaraj', 'Chandan M', 'Deepak S', 'Eshwar K',
  ];

  const statuses = ['On Route', 'On Route', 'On Route', 'Idle', 'Delayed', 'Offline', 'Centre Visit Pending', 'On Route'];
  const blocks = [];
  const vehicles = [];
  const routes = [];

  let autoIdx = 0;
  wards.forEach((ward, wi) => {
    const blockCount = wi < 3 ? 4 : 3;
    for (let bi = 0; bi < blockCount; bi += 1) {
      autoIdx += 1;
      const blockId = `block-${ward.number}-${String.fromCharCode(65 + bi)}`;
      const vehicleId = `auto-${String(1000 + autoIdx).padStart(4, '0')}`;
      const routeId = `route-${ward.number}-${String.fromCharCode(65 + bi)}`;
      const status = statuses[autoIdx % statuses.length];
      const expectedStops = 35 + Math.floor(seeded(autoIdx) * 25);
      const completedStops = status === 'Offline' ? 0 : Math.floor(expectedStops * (0.4 + seeded(autoIdx + 3) * 0.55));
      const coveragePct = Math.round((completedStops / expectedStops) * 100);
      const coord = offsetCoord(ward.lat, ward.lng, autoIdx);
      const muster = musters.find((m) => m.wardId === ward.id);
      const supervisor = supervisors.find((s) => s.wardIds.includes(ward.id));

      blocks.push({
        id: blockId,
        name: `Block ${String.fromCharCode(65 + bi)}`,
        code: `${ward.number}-${String.fromCharCode(65 + bi)}`,
        wardId: ward.id,
        corporationId: ward.corporationId,
        constituencyId: ward.constituencyId,
        musterId: muster?.id,
        vehicleId,
        routeId,
        households: 40 + Math.floor(seeded(autoIdx + 7) * 80),
        packageId: packageFor(ward.corporationId)?.id || null,
        contractorId: packageFor(ward.corporationId)?.contractorId || null,
        active: true,
      });

      vehicles.push({
        id: vehicleId,
        autoId: `KA-01-AW-${1000 + autoIdx}`,
        displayName: `Auto ${1000 + autoIdx}`,
        driverName: driverNames[autoIdx % driverNames.length],
        wardId: ward.id,
        blockId,
        routeId,
        corporationId: ward.corporationId,
        constituencyId: ward.constituencyId,
        musterId: muster?.id,
        supervisorId: supervisor?.id,
        packageId: packageFor(ward.corporationId)?.id || null,
        contractorId: packageFor(ward.corporationId)?.contractorId || null,
        status,
        lat: coord.lat,
        lng: coord.lng,
        speed: status === 'On Route' ? 15 + Math.floor(seeded(autoIdx) * 25) : 0,
        completedStops,
        expectedStops,
        coveragePct,
        routeStartTime: status === 'Offline' ? null : `${todayISO()}T06:${String(15 + (autoIdx % 30)).padStart(2, '0')}:00.000Z`,
        estimatedCompletion: status === 'Offline' ? null : `${todayISO()}T10:${String(30 + (autoIdx % 25)).padStart(2, '0')}:00.000Z`,
        lastUpdate: nowISO(),
        dwcStatus: status === 'Centre Visit Pending' ? 'Pending' : completedStops > expectedStops * 0.7 ? 'Visited' : 'Scheduled',
        dwcId: `dwc-${(autoIdx % 8) + 1}`,
        active: true,
        locationHistory: Array.from({ length: 6 }, (_, hi) => {
          const hCoord = offsetCoord(ward.lat, ward.lng, autoIdx + hi * 10, 0.02);
          return { ...hCoord, timestamp: new Date(Date.now() - (5 - hi) * 10 * 60000).toISOString(), speed: 10 + hi * 3 };
        }),
      });

      const checkpoints = Array.from({ length: 5 }, (_, ci) => {
        const c = offsetCoord(ward.lat, ward.lng, autoIdx * 10 + ci, 0.015);
        return {
          id: `cp-${routeId}-${ci}`,
          name: `Checkpoint ${ci + 1}`,
          ...c,
          completed: ci < Math.floor((completedStops / expectedStops) * 5),
          order: ci + 1,
        };
      });

      routes.push({
        id: routeId,
        name: `Route ${ward.number}${String.fromCharCode(65 + bi)}`,
        wardId: ward.id,
        blockId,
        vehicleId,
        corporationId: ward.corporationId,
        expectedStops,
        completedStops,
        householdCoverage: coveragePct,
        sweepingPoints: 8 + (autoIdx % 5),
        sweepingCompleted: Math.floor((8 + (autoIdx % 5)) * (coveragePct / 100)),
        dwcId: `dwc-${(autoIdx % 8) + 1}`,
        scheduleStart: '06:30',
        scheduleEnd: '11:00',
        supervisorId: supervisor?.id,
        checkpoints,
        path: checkpoints.map((c) => [c.lat, c.lng]),
        active: true,
      });
    }
  });

  const dryWasteCentres = Array.from({ length: 8 }, (_, i) => {
    const ward = wards[i % wards.length];
    const c = offsetCoord(ward.lat, ward.lng, 200 + i, 0.03);
    const assignedRoutes = routes.filter((r) => r.dwcId === `dwc-${i + 1}`).map((r) => r.id);
    return {
      id: `dwc-${i + 1}`,
      centreId: `DWC-BLR-${String(i + 1).padStart(3, '0')}`,
      name: `Dry Waste Centre — ${ward.name.split('—')[1]?.trim() || ward.name} ${i + 1}`,
      wardId: ward.id,
      corporationId: ward.corporationId,
      ...c,
      assignedRouteIds: assignedRoutes,
      assignedWardIds: [...new Set(assignedRoutes.map((rid) => routes.find((r) => r.id === rid)?.wardId).filter(Boolean))],
      scheduledArrival: '10:30',
      actualArrival: i % 3 === 0 ? null : '10:45',
      visitStatus: i % 3 === 0 ? 'Pending' : i % 3 === 1 ? 'Completed' : 'In Progress',
      dwellMinutes: i % 3 === 0 ? 0 : 15 + (i * 3),
      handoverStatus: i % 3 === 0 ? 'Not Started' : 'Completed',
      quantities: {
        paper: 40 + i * 5,
        plastic: 25 + i * 3,
        metal: 8 + i,
        glass: 12 + i * 2,
        other: 10 + i,
      },
      notes: [],
      active: true,
    };
  });

  const households = [];
  blocks.slice(0, 12).forEach((block, bi) => {
    const count = 8;
    for (let hi = 0; hi < count; hi += 1) {
      const ward = wards.find((w) => w.id === block.wardId);
      const c = offsetCoord(ward.lat, ward.lng, 500 + bi * 20 + hi, 0.01);
      const collected = seeded(bi * 20 + hi) > 0.25;
      households.push({
        id: `hh-${block.id}-${hi + 1}`,
        doorNo: `${10 + hi}`,
        street: ['MG Road', '100 Feet Road', 'Double Road', 'Service Road', 'Cross Road'][hi % 5],
        wardId: block.wardId,
        blockId: block.id,
        routeId: block.routeId,
        ...c,
        coverageStatus: collected ? 'Collected' : 'Pending',
        lastCollection: collected ? todayISO() : daysAgoISO(1 + (hi % 3)),
        verificationMethod: collected ? (hi % 2 === 0 ? 'GPS Geofence' : 'Manual') : null,
        wasteSegregation: hi % 3 === 0 ? 'Good' : hi % 3 === 1 ? 'Partial' : 'Needs Improvement',
      });
    }
  });

  const sweepingStretches = wards.flatMap((ward, wi) =>
    [0, 1].map((si) => {
      const wardBlocks = blocks.filter((b) => b.wardId === ward.id);
      const block = wardBlocks[si % Math.max(wardBlocks.length, 1)] || null;
      const planned = 2.5 + seeded(wi * 10 + si) * 4;
      const completed = planned * (0.5 + seeded(wi + si) * 0.5);
      return {
        id: `sweep-${ward.number}-${si + 1}`,
        roadName: `${ward.name.split('—')[1]?.trim() || ward.name} Stretch ${si + 1}`,
        wardId: ward.id,
        blockId: block?.id || null,
        team: `PK Team ${wi + 1}${String.fromCharCode(65 + si)}`,
        supervisorId: supervisors.find((s) => s.wardIds.includes(ward.id))?.id,
        plannedKm: Number(planned.toFixed(2)),
        completedKm: Number(completed.toFixed(2)),
        completionPct: Math.round((completed / planned) * 100),
        status: completed / planned > 0.9 ? 'Completed' : completed / planned > 0.5 ? 'In Progress' : 'Pending',
        lastVerification: daysAgoISO(si),
      };
    })
  );

  applyHouseholdCoverage(vehicles, routes, blocks, households);

  const houseFor = (blockId, index = 1) => households.find((h) => h.id === `hh-${blockId}-${index}`) || null;

  const blackSpots = [
    {
      id: 'bs-1', category: 'Illegal Dumping', severity: 'High', wardId: 'ward-112',
      blockId: 'block-112-A', householdId: houseFor('block-112-A', 1)?.id || null,
      doorNo: houseFor('block-112-A', 1)?.doorNo || '10',
      location: '100 Feet Road junction', lat: 12.9789, lng: 77.6415,
      firstReported: daysAgoISO(12), daysUnresolved: 12, assignedTeam: 'PK Team 1A',
      status: 'Open', previousReports: 3, evidencePlaceholders: ['dump-1'], history: [
        { at: daysAgoISO(12), action: 'Reported', by: 'Citizen', note: 'Recurring dump near corner shop' },
      ],
    },
    {
      id: 'bs-2', category: 'Overflowing Bin', severity: 'Medium', wardId: 'ward-113',
      blockId: 'block-113-A', householdId: houseFor('block-113-A', 2)?.id || null,
      doorNo: houseFor('block-113-A', 2)?.doorNo || '11',
      location: 'Domlur Bus Stop', lat: 12.9615, lng: 77.6390,
      firstReported: daysAgoISO(5), daysUnresolved: 5, assignedTeam: 'PK Team 2A',
      status: 'In Progress Cleanup', previousReports: 1, evidencePlaceholders: ['bin-1'], history: [
        { at: daysAgoISO(5), action: 'Reported', by: 'Supervisor', note: 'Bin overflowing after market day' },
        { at: daysAgoISO(1), action: 'Assigned', by: 'Ramesh Kumar', note: 'Cleanup scheduled' },
      ],
    },
    {
      id: 'bs-3', category: 'Construction Debris', severity: 'High', wardId: 'ward-120',
      blockId: 'block-120-A', householdId: houseFor('block-120-A', 3)?.id || null,
      doorNo: houseFor('block-120-A', 3)?.doorNo || '12',
      location: '5th Block Koramangala', lat: 12.9340, lng: 77.6250,
      firstReported: daysAgoISO(20), daysUnresolved: 20, assignedTeam: 'PK Team 3A',
      status: 'Open', previousReports: 5, evidencePlaceholders: ['debris-1'], history: [
        { at: daysAgoISO(20), action: 'Reported', by: 'Citizen', note: 'Construction waste blocking footpath' },
      ],
    },
    {
      id: 'bs-4', category: 'Recurring Dump Site', severity: 'Critical', wardId: 'ward-145',
      blockId: 'block-145-A', householdId: houseFor('block-145-A', 1)?.id || null,
      doorNo: houseFor('block-145-A', 1)?.doorNo || '10',
      location: 'Near Jayanagar 4th Block park', lat: 12.9315, lng: 77.5845,
      firstReported: daysAgoISO(45), daysUnresolved: 45, assignedTeam: 'PK Team 3B',
      status: 'Open', previousReports: 8, evidencePlaceholders: ['recur-1'], history: [
        { at: daysAgoISO(45), action: 'Reported', by: 'JHI', note: 'Long-standing dump site' },
      ],
    },
    {
      id: 'bs-5', category: 'Open Drain Waste', severity: 'Medium', wardId: 'ward-65',
      blockId: 'block-65-A', householdId: houseFor('block-65-A', 4)?.id || null,
      doorNo: houseFor('block-65-A', 4)?.doorNo || '13',
      location: 'Rajajinagar industrial area', lat: 12.9920, lng: 77.5530,
      firstReported: daysAgoISO(3), daysUnresolved: 0, assignedTeam: 'PK Team 4A',
      status: 'Cleared', previousReports: 2, evidencePlaceholders: ['drain-1', 'drain-cleared'], history: [
        { at: daysAgoISO(3), action: 'Reported', by: 'Citizen', note: 'Waste in open drain' },
        { at: todayISO(), action: 'Verified Clearance', by: 'Suresh Patil', note: 'Cleared and verified' },
      ],
    },
  ];

  const complaints = [
    {
      id: 'CMP-100001', category: 'Skipped Household Pickup', title: 'Door 42 not collected',
      description: 'Our household on 100 Feet Road was skipped this morning even though we kept wet waste out.',
      reporterName: 'Priya Sharma', reporterId: 'user-citizen-1', wardId: 'ward-112', blockId: 'block-112-A',
      routeId: 'route-112-A', lat: 12.9790, lng: 77.6410, createdAt: `${daysAgoISO(0)}T07:30:00.000Z`,
      priority: 'High', assignedTo: 'sup-1', status: 'Assigned', photoDataUrl: null,
      slaDeadline: `${daysAgoISO(-1)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(0)}T07:30:00.000Z`, action: 'Submitted', by: 'Priya Sharma', note: 'Complaint submitted' },
        { at: `${daysAgoISO(0)}T08:15:00.000Z`, action: 'Assigned', by: 'System', note: 'Assigned to Ramesh Kumar (JHI)' },
      ],
    },
    {
      id: 'CMP-100002', category: 'Late Auto', title: 'Auto delayed beyond 10 AM',
      description: 'Collection auto usually arrives by 8:30 but has not come yet.',
      reporterName: 'Arjun Mehta', reporterId: 'user-citizen-2', wardId: 'ward-113', blockId: 'block-113-A',
      routeId: 'route-113-A', lat: 12.9610, lng: 77.6395, createdAt: `${daysAgoISO(1)}T10:00:00.000Z`,
      priority: 'Medium', assignedTo: 'sup-1', status: 'On site', photoDataUrl: null,
      slaDeadline: `${daysAgoISO(0)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(1)}T10:00:00.000Z`, action: 'Submitted', by: 'Arjun Mehta', note: 'Complaint submitted' },
        { at: `${daysAgoISO(1)}T11:00:00.000Z`, action: 'Verified', by: 'Ramesh Kumar', note: 'Vehicle delayed confirmed' },
        { at: `${daysAgoISO(0)}T07:00:00.000Z`, action: 'In Progress', by: 'Ramesh Kumar', note: 'Following up with driver' },
      ],
    },
    {
      id: 'CMP-100003', category: 'Black Spot / Illegal Dumping', title: 'Dumping near park entrance',
      description: 'Repeated illegal dumping near the park entrance on Double Road.',
      reporterName: 'Sneha Rao', reporterId: 'user-citizen-3', wardId: 'ward-120', blockId: 'block-120-A',
      routeId: 'route-120-A', lat: 12.9355, lng: 77.6255, createdAt: `${daysAgoISO(3)}T09:00:00.000Z`,
      priority: 'Critical', assignedTo: 'sup-2', status: 'Verification Pending', photoDataUrl: null,
      slaDeadline: `${daysAgoISO(1)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(3)}T09:00:00.000Z`, action: 'Submitted', by: 'Sneha Rao', note: 'Complaint submitted' },
      ],
    },
    {
      id: 'CMP-100004', category: 'Pothole', title: 'Deep pothole on service road',
      description: 'Large pothole causing vehicle damage risk near auto stand.',
      reporterName: 'Vikram Singh', reporterId: 'user-citizen-4', wardId: 'ward-145', blockId: 'block-145-A',
      routeId: 'route-145-A', lat: 12.9310, lng: 77.5840, createdAt: `${daysAgoISO(5)}T14:00:00.000Z`,
      priority: 'High', assignedTo: 'sup-2', status: 'Resolved', photoDataUrl: null,
      resolutionEvidence: 'demo-evidence-pothole',
      slaDeadline: `${daysAgoISO(2)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(5)}T14:00:00.000Z`, action: 'Submitted', by: 'Vikram Singh', note: 'Complaint submitted' },
        { at: `${daysAgoISO(4)}T10:00:00.000Z`, action: 'Assigned', by: 'Lakshmi Devi', note: 'Assigned to road crew' },
        { at: `${daysAgoISO(2)}T16:00:00.000Z`, action: 'Resolution Evidence Submitted', by: 'Lakshmi Devi', note: 'Filled and leveled' },
        { at: `${daysAgoISO(2)}T17:00:00.000Z`, action: 'Resolved', by: 'Lakshmi Devi', note: 'Closed with evidence' },
      ],
    },
    {
      id: 'CMP-100005', category: 'Missed Dry Waste Collection', title: 'Dry waste not collected on Tuesday',
      description: 'Scheduled dry waste pickup was missed for our block.',
      reporterName: 'Priya Sharma', reporterId: 'user-citizen-1', wardId: 'ward-112', blockId: 'block-112-A',
      routeId: 'route-112-A', lat: 12.9785, lng: 77.6409, createdAt: `${daysAgoISO(2)}T11:00:00.000Z`,
      priority: 'Medium', assignedTo: 'sup-1', status: 'Resolved', photoDataUrl: null,
      resolutionEvidence: 'demo-evidence-drywaste',
      slaDeadline: `${daysAgoISO(1)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(2)}T11:00:00.000Z`, action: 'Submitted', by: 'Priya Sharma', note: 'Complaint submitted' },
        { at: `${daysAgoISO(1)}T09:00:00.000Z`, action: 'Resolved', by: 'Ramesh Kumar', note: 'Special pickup completed' },
      ],
    },
    {
      id: 'CMP-100006', category: 'Debris', title: 'Fallen tree debris on road',
      description: 'Tree branch debris blocking half the carriageway after last night storm.',
      reporterName: 'Kavitha N', reporterId: 'user-citizen-5', wardId: 'ward-18', blockId: 'block-18-A',
      routeId: 'route-18-A', lat: 13.0360, lng: 77.5975, createdAt: `${daysAgoISO(0)}T06:45:00.000Z`,
      priority: 'Critical', assignedTo: null, status: 'Submitted', photoDataUrl: null,
      slaDeadline: `${daysAgoISO(-1)}T12:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(0)}T06:45:00.000Z`, action: 'Submitted', by: 'Kavitha N', note: 'Complaint submitted' },
      ],
    },
    {
      id: 'CMP-100007', category: 'Suggestion', title: 'Add evening dry waste slot',
      description: 'Request evening collection window for working residents.',
      reporterName: 'Deepa Iyer', reporterId: 'user-citizen-6', wardId: 'ward-88', blockId: 'block-88-A',
      routeId: 'route-88-A', lat: 12.9855, lng: 77.6055, createdAt: `${daysAgoISO(4)}T18:00:00.000Z`,
      priority: 'Low', assignedTo: 'sup-4', status: 'Verified', photoDataUrl: null,
      slaDeadline: `${daysAgoISO(-3)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(4)}T18:00:00.000Z`, action: 'Submitted', by: 'Deepa Iyer', note: 'Suggestion submitted' },
        { at: `${daysAgoISO(3)}T10:00:00.000Z`, action: 'Verified', by: 'Fatima Begum', note: 'Logged for planning review' },
      ],
    },
    {
      id: 'CMP-100008', category: 'Skipped Household Pickup', title: 'Missed pickup — house 18',
      description: 'Wet waste left out but auto passed without collecting.',
      reporterName: 'Rahul Desai', reporterId: 'user-citizen-7', wardId: 'ward-65', blockId: 'block-65-A',
      routeId: 'route-65-A', lat: 12.9915, lng: 77.5525, createdAt: `${daysAgoISO(6)}T08:00:00.000Z`,
      priority: 'High', assignedTo: 'sup-3', status: 'Reopened', photoDataUrl: null,
      resolutionEvidence: 'demo-evidence-old',
      slaDeadline: `${daysAgoISO(4)}T18:00:00.000Z`,
      history: [
        { at: `${daysAgoISO(6)}T08:00:00.000Z`, action: 'Submitted', by: 'Rahul Desai', note: 'Complaint submitted' },
        { at: `${daysAgoISO(5)}T15:00:00.000Z`, action: 'Resolved', by: 'Suresh Patil', note: 'Marked resolved' },
        { at: `${daysAgoISO(4)}T09:00:00.000Z`, action: 'Reopened', by: 'Rahul Desai', note: 'Still not collected on next day' },
      ],
    },
  ];

  complaints.forEach((complaint) => {
    const block = blocks.find((b) => b.id === complaint.blockId);
    complaint.source = 'complaint';
    complaint.packageId = block?.packageId || null;
    complaint.contractorId = block?.contractorId || null;
    complaint.buildingId = complaint.blockId ? `bldg-${complaint.blockId}-1` : null;
    complaint.slaDeadline = slaDeadlineFor(complaint.category, complaint.createdAt);
    if (complaint.resolutionEvidence && String(complaint.resolutionEvidence).startsWith('demo-evidence')) {
      complaint.resolutionEvidence = null;
    }
  });

  const aiEvents = [
    {
      id: 'AIE-10001', type: 'Pothole', vehicleId: vehicles[0]?.id, routeId: vehicles[0]?.routeId,
      wardId: vehicles[0]?.wardId, timestamp: `${daysAgoISO(0)}T08:12:00.000Z`,
      lat: vehicles[0]?.lat, lng: vehicles[0]?.lng, severity: 'High', confidence: 92,
      status: 'New', assignedTeam: null, evidencePlaceholder: 'pothole-snap-1',
      history: [{ at: `${daysAgoISO(0)}T08:12:00.000Z`, action: 'Detected', by: 'AI Engine (Demo)', note: 'Dashcam detection' }],
    },
    {
      id: 'AIE-10002', type: 'Speeding', vehicleId: vehicles[2]?.id, routeId: vehicles[2]?.routeId,
      wardId: vehicles[2]?.wardId, timestamp: `${daysAgoISO(0)}T07:45:00.000Z`,
      lat: vehicles[2]?.lat, lng: vehicles[2]?.lng, severity: 'Medium', confidence: 88,
      status: 'Confirmed', assignedTeam: 'sup-1', evidencePlaceholder: 'speed-snap-1',
      history: [
        { at: `${daysAgoISO(0)}T07:45:00.000Z`, action: 'Detected', by: 'AI Engine (Demo)', note: 'Speed > limit' },
        { at: `${daysAgoISO(0)}T08:00:00.000Z`, action: 'Confirmed', by: 'Ramesh Kumar', note: 'Valid alert' },
      ],
    },
    {
      id: 'AIE-10003', type: 'Unusual Stoppage', vehicleId: vehicles[4]?.id, routeId: vehicles[4]?.routeId,
      wardId: vehicles[4]?.wardId, timestamp: `${daysAgoISO(0)}T09:20:00.000Z`,
      lat: vehicles[4]?.lat, lng: vehicles[4]?.lng, severity: 'Medium', confidence: 75,
      status: 'Assigned', assignedTeam: 'sup-1', evidencePlaceholder: 'stop-snap-1',
      history: [
        { at: `${daysAgoISO(0)}T09:20:00.000Z`, action: 'Detected', by: 'AI Engine (Demo)', note: 'Idle > 15 min' },
        { at: `${daysAgoISO(0)}T09:40:00.000Z`, action: 'Assigned', by: 'System', note: 'Assigned for review' },
      ],
    },
    {
      id: 'AIE-10004', type: 'Suspected Illegal Dumping', vehicleId: vehicles[6]?.id, routeId: vehicles[6]?.routeId,
      wardId: vehicles[6]?.wardId, timestamp: `${daysAgoISO(1)}T10:05:00.000Z`,
      lat: vehicles[6]?.lat, lng: vehicles[6]?.lng, severity: 'Critical', confidence: 81,
      status: 'Escalated', assignedTeam: 'sup-2', evidencePlaceholder: 'dump-snap-1',
      history: [
        { at: `${daysAgoISO(1)}T10:05:00.000Z`, action: 'Detected', by: 'AI Engine (Demo)', note: 'Dumping gesture detected' },
        { at: `${daysAgoISO(1)}T11:00:00.000Z`, action: 'Escalated', by: 'Lakshmi Devi', note: 'Needs field verification' },
      ],
    },
    {
      id: 'AIE-10005', type: 'Route Deviation', vehicleId: vehicles[3]?.id, routeId: vehicles[3]?.routeId,
      wardId: vehicles[3]?.wardId, timestamp: `${daysAgoISO(0)}T08:50:00.000Z`,
      lat: vehicles[3]?.lat, lng: vehicles[3]?.lng, severity: 'Low', confidence: 70,
      status: 'False Positive', assignedTeam: null, evidencePlaceholder: 'dev-snap-1',
      history: [
        { at: `${daysAgoISO(0)}T08:50:00.000Z`, action: 'Detected', by: 'AI Engine (Demo)', note: 'Off planned polyline' },
        { at: `${daysAgoISO(0)}T09:10:00.000Z`, action: 'False Positive', by: 'Ramesh Kumar', note: 'Temporary diversion due to road work' },
      ],
    },
    {
      id: 'AIE-10006', type: 'Debris', vehicleId: vehicles[8]?.id, routeId: vehicles[8]?.routeId,
      wardId: vehicles[8]?.wardId, timestamp: `${daysAgoISO(2)}T07:30:00.000Z`,
      lat: vehicles[8]?.lat, lng: vehicles[8]?.lng, severity: 'Medium', confidence: 85,
      status: 'Resolved', assignedTeam: 'sup-3', evidencePlaceholder: 'debris-snap-1',
      history: [
        { at: `${daysAgoISO(2)}T07:30:00.000Z`, action: 'Detected', by: 'AI Engine (Demo)', note: 'Debris on carriageway' },
        { at: `${daysAgoISO(1)}T14:00:00.000Z`, action: 'Resolved', by: 'Suresh Patil', note: 'Cleared by sweeping team' },
      ],
    },
  ];

  aiEvents.forEach((event) => {
    const vehicle = vehicles.find((v) => v.id === event.vehicleId);
    const noMovement = vehicle && (vehicle.status === 'Offline' || vehicle.speed === 0);
    if (noMovement && (event.type === 'Speeding' || event.type === 'Unusual Stoppage')) {
      event.status = 'False Positive';
      event.history.push({
        at: nowISO(),
        action: 'False Positive',
        by: 'System',
        note: 'Suppressed: offline or 0 km/h, so this is not a live deviation',
      });
    }
  });

  const clampEventTime = (iso) => {
    if (!iso) return iso;
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) return iso;
    const latest = Date.now() - 5 * 60 * 1000;
    return time > latest ? new Date(latest).toISOString() : iso;
  };
  const clampHistory = (rows) => {
    (rows || []).forEach((row) => {
      if (row.at) row.at = clampEventTime(row.at);
    });
  };
  complaints.forEach((complaint) => {
    complaint.createdAt = clampEventTime(complaint.createdAt);
    clampHistory(complaint.history);
    complaint.slaDeadline = slaDeadlineFor(complaint.category, complaint.createdAt);
  });
  aiEvents.forEach((event) => {
    event.timestamp = clampEventTime(event.timestamp);
    clampHistory(event.history);
  });

  const dailyScores = [];
  vehicles.forEach((v, vi) => {
    for (let d = 0; d < 14; d += 1) {
      const date = daysAgoISO(d);
      const expectedStops = v.expectedStops;
      const completedStops = Math.floor(expectedStops * (0.75 + seeded(vi * 20 + d) * 0.25));
      const blockHouses = households.filter((h) => h.blockId === v.blockId);
      const liveServed = blockHouses.filter((h) => h.coverageStatus === 'Collected').length;
      const housesExpected = d === 0 && blockHouses.length
        ? blockHouses.length
        : (blocks.find((b) => b.id === v.blockId)?.households || 60);
      const housesCovered = d === 0 && blockHouses.length
        ? liveServed
        : Math.floor(housesExpected * (0.7 + seeded(vi + d) * 0.3));
      const dwcVisited = seeded(vi + d + 3) > 0.2;
      const offlineDay = v.status === 'Offline' && d === 0;
      const inputs = {
        expectedStops,
        completedStops,
        housesExpected,
        housesCovered,
        dwcVisited,
        routeMinutes: 150 + Math.floor(seeded(vi + d) * 80),
        plannedMinutes: 180,
        speedAlerts: offlineDay ? 0 : (seeded(vi + d) > 0.85 ? 1 : 0),
        unnecessaryStoppages: offlineDay ? 0 : Math.floor(seeded(vi + d + 1) * 4),
        deviceUptimePct: offlineDay ? 0 : 90 + Math.floor(seeded(vi + d + 2) * 10),
        offline: offlineDay,
        gpsPings: offlineDay ? 0 : 12,
      };
      const result = calculateDailyScore(inputs);
      dailyScores.push({
        id: `score-${v.id}-${date}`,
        vehicleId: v.id,
        wardId: v.wardId,
        blockId: v.blockId,
        date,
        inputs,
        ...result,
        shadowRun: true,
        exceptions: [],
      });
    }
  });

  const pendingDwcVehicle = vehicles.find((v) => v.status === 'Centre Visit Pending') || vehicles[0];

  /* Dummy notifications scoped by login:
   * - citizen (Priya): personal pickup / report alerts
   * - supervisor (Ramesh): wards 112–114 ops alerts
   * - admin (Ananya): all ops + city-wide digests
   */
  const notifications = [
    // —— Shared ops (admin + supervisor ward scope) ——
    {
      id: 'notif-1', category: 'Pending Dry Waste Centre Visit', title: 'DWC visit pending',
      message: `${pendingDwcVehicle?.displayName || 'Auto'} has pending dry-waste-centre visit.`,
      priority: 'High', createdAt: `${daysAgoISO(0)}T09:00:00.000Z`, read: false,
      relatedType: 'vehicle', relatedId: pendingDwcVehicle?.id,
      link: '/vehicles',
      roles: ['admin', 'supervisor'],
      wardIds: pendingDwcVehicle?.wardId ? [pendingDwcVehicle.wardId] : ['ward-112'],
    },
    {
      id: 'notif-2', category: 'Overdue Complaint', title: 'Complaint approaching SLA',
      message: 'CMP-100003 requires verification — SLA at risk in Ward 120.',
      priority: 'Critical', createdAt: `${daysAgoISO(0)}T08:30:00.000Z`, read: false,
      relatedType: 'complaint', relatedId: 'CMP-100003', link: '/complaints',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-120'],
    },
    {
      id: 'notif-3', category: 'Speed Violation', title: 'Speed alert confirmed',
      message: 'AIE-10002 speeding event confirmed for review (Ward 113).',
      priority: 'Medium', createdAt: `${daysAgoISO(0)}T08:05:00.000Z`, read: false,
      relatedType: 'aiEvent', relatedId: 'AIE-10002', link: '/dashcam',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-113'],
    },
    {
      id: 'notif-4', category: 'Low Household Coverage', title: 'Coverage below 90%',
      message: 'Ward 112 autos reporting coverage below target this morning.',
      priority: 'High', createdAt: `${daysAgoISO(0)}T10:00:00.000Z`, read: false,
      relatedType: 'ward', relatedId: 'ward-112', link: '/coverage',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-112'],
    },
    {
      id: 'notif-5', category: 'Resolved Complaint', title: 'Complaint resolved',
      message: 'CMP-100005 (missed dry waste) marked resolved in Ward 112.',
      priority: 'Low', createdAt: `${daysAgoISO(1)}T09:30:00.000Z`, read: true,
      relatedType: 'complaint', relatedId: 'CMP-100005', link: '/complaints',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-112'],
    },
    {
      id: 'notif-6', category: 'New Assignment', title: 'New complaint assigned',
      message: 'CMP-100001 assigned to JHI Ramesh Kumar — Ward 112.',
      priority: 'Medium', createdAt: `${daysAgoISO(0)}T08:20:00.000Z`, read: false,
      relatedType: 'complaint', relatedId: 'CMP-100001', link: '/complaints',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-112'],
    },
    {
      id: 'notif-11', category: 'Route Deviation', title: 'Route deviation in Domlur',
      message: 'Auto on Route 113A left planned polyline for 8 minutes.',
      priority: 'Medium', createdAt: `${daysAgoISO(0)}T09:40:00.000Z`, read: false,
      relatedType: 'aiEvent', relatedId: 'AIE-10005', link: '/dashcam',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-113'],
    },
    {
      id: 'notif-12', category: 'Excessive Stoppage', title: 'Long stoppage — HAL Airport',
      message: 'Collection auto idle >15 min near Ward 114 muster point.',
      priority: 'High', createdAt: `${daysAgoISO(0)}T10:25:00.000Z`, read: false,
      relatedType: 'vehicle', relatedId: vehicles.find((v) => v.wardId === 'ward-114')?.id || vehicles[1]?.id,
      link: '/vehicles',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-114'],
    },
    {
      id: 'notif-13', category: 'Overdue Complaint', title: 'Black spot follow-up due',
      message: 'Illegal dumping spot in Ward 112 still open — schedule sweep check.',
      priority: 'High', createdAt: `${daysAgoISO(0)}T11:15:00.000Z`, read: true,
      relatedType: 'complaint', relatedId: 'CMP-100003', link: '/sweeping',
      roles: ['admin', 'supervisor'],
      wardIds: ['ward-112'],
    },

    // —— Admin-only city-wide digests ——
    {
      id: 'notif-10', category: 'System', title: 'City-wide SLA digest',
      message: '3 complaints outside East demo wards need admin review today.',
      priority: 'Medium', createdAt: `${daysAgoISO(0)}T11:00:00.000Z`, read: false,
      relatedType: 'system', relatedId: null, link: '/complaints',
      roles: ['admin'],
    },
    {
      id: 'notif-14', category: 'System', title: 'Monthly scorecard draft ready',
      message: 'March demo scorecards are ready for admin sign-off.',
      priority: 'Low', createdAt: `${daysAgoISO(0)}T12:10:00.000Z`, read: false,
      relatedType: 'system', relatedId: null, link: '/scorecards',
      roles: ['admin'],
    },
    {
      id: 'notif-15', category: 'System', title: 'Impact dashboard refresh',
      message: 'Illustrative CO₂ and diversion metrics updated for leadership view.',
      priority: 'Low', createdAt: `${daysAgoISO(1)}T08:00:00.000Z`, read: true,
      relatedType: 'system', relatedId: null, link: '/impact',
      roles: ['admin'],
    },

    // —— Citizen (Priya) ——
    {
      id: 'notif-7', category: 'Complaint Update', title: 'Your report was resolved',
      message: 'CMP-100005 is now Resolved. Open My Reports for the timeline.',
      priority: 'Medium', createdAt: `${daysAgoISO(1)}T09:35:00.000Z`, read: false,
      relatedType: 'complaint', relatedId: 'CMP-100005', link: '/citizen/reports',
      roles: ['citizen'],
      userIds: ['user-citizen-1'],
    },
    {
      id: 'notif-8', category: 'Arrival Alert', title: 'Auto is nearby',
      message: 'Your collection auto is about 5 minutes away from 100 Feet Road.',
      priority: 'High', createdAt: `${daysAgoISO(0)}T07:45:00.000Z`, read: false,
      relatedType: 'vehicle', relatedId: vehicles[0]?.id, link: '/citizen/track',
      roles: ['citizen'],
      userIds: ['user-citizen-1'],
    },
    {
      id: 'notif-9', category: 'Pickup Reminder', title: 'Today’s doorstep collection',
      message: 'Keep wet and dry waste ready before the auto arrives.',
      priority: 'Low', createdAt: `${daysAgoISO(0)}T06:30:00.000Z`, read: false,
      relatedType: 'system', relatedId: null, link: '/citizen/pickup',
      roles: ['citizen'],
      userIds: ['user-citizen-1'],
    },
    {
      id: 'notif-16', category: 'Complaint Update', title: 'New report received',
      message: 'CMP-100001 (Door 42 not collected) was submitted successfully.',
      priority: 'Low', createdAt: `${daysAgoISO(2)}T10:05:00.000Z`, read: true,
      relatedType: 'complaint', relatedId: 'CMP-100001', link: '/citizen/reports',
      roles: ['citizen'],
      userIds: ['user-citizen-1'],
    },
    {
      id: 'notif-17', category: 'Pickup Reminder', title: 'Mark yesterday’s pickup',
      message: 'Add a reason on the Collection Calendar if pickup was missed.',
      priority: 'Medium', createdAt: `${daysAgoISO(1)}T18:00:00.000Z`, read: false,
      relatedType: 'system', relatedId: null, link: '/citizen/calendar',
      roles: ['citizen'],
      userIds: ['user-citizen-1'],
    },
    {
      id: 'notif-18', category: 'Arrival Alert', title: 'Dry waste day tomorrow',
      message: 'Demo reminder: dry waste collection window is scheduled for tomorrow morning.',
      priority: 'Low', createdAt: `${daysAgoISO(0)}T19:00:00.000Z`, read: true,
      relatedType: 'system', relatedId: null, link: '/citizen/calendar',
      roles: ['citizen'],
      userIds: ['user-citizen-1'],
    },
  ];

  const feedback = Array.from({ length: 35 }, (_, i) => {
    const date = daysAgoISO(i);
    const dow = new Date(`${date}T12:00:00`).getDay();
    if (dow === 0) {
      return {
        id: `fb-${i + 1}`,
        citizenId: 'user-citizen-1',
        wardId: 'ward-112',
        blockId: 'block-112-A',
        date,
        collected: false,
        outcome: 'no_service',
        noService: true,
        reason: 'No collection scheduled (Sunday)',
        rating: null,
        segregationFeedback: '',
        comment: 'No collection scheduled (Sunday)',
        createdAt: `${date}T12:00:00.000Z`,
      };
    }
    const roll = seeded(i + 11);
    let outcome = 'collected';
    let reason;
    let comment = 'Doorstep pickup done';
    if (roll < 0.12) {
      outcome = 'missed_by_auto';
      reason = 'Auto did not come to our street';
      comment = 'Auto missed collection';
    } else if (roll < 0.22) {
      outcome = 'garbage_not_kept';
      reason = 'We did not keep garbage out';
      comment = 'Waste not kept outside that day';
    }
    return {
      id: `fb-${i + 1}`,
      citizenId: 'user-citizen-1',
      wardId: 'ward-112',
      blockId: 'block-112-A',
      date,
      collected: outcome === 'collected',
      outcome,
      reason,
      rating: outcome === 'collected' ? 3 + Math.floor(seeded(i + 5) * 3) : 2,
      segregationFeedback: outcome === 'collected' ? 'Good' : 'Partial',
      comment,
      createdAt: `${date}T12:00:00.000Z`,
    };
  });

  const auditLog = [
    {
      id: 'audit-1', at: `${daysAgoISO(0)}T06:00:00.000Z`, actor: 'System', action: 'Seed Data Loaded',
      entityType: 'system', entityId: 'seed', detail: 'Deterministic demo dataset initialised',
    },
  ];

  const impactMetrics = {
    assumptions: {
      diversionRate: 0.42,
      co2ePerTonneAvoided: 0.45,
      costPerTonne: 1850,
      compostYieldPerTonneWet: 0.35,
      wteKwhPerTonne: 450,
    },
    daily: Array.from({ length: 14 }, (_, i) => {
      const date = daysAgoISO(13 - i);
      const wet = 180 + Math.floor(seeded(i) * 40);
      const dry = 95 + Math.floor(seeded(i + 2) * 30);
      const total = wet + dry;
      return {
        date,
        wetTonnes: wet,
        dryTonnes: dry,
        totalTonnes: total,
        recycledTonnes: Math.round(dry * 0.65),
        compostTonnes: Math.round(wet * 0.35),
        wteKwh: Math.round(dry * 0.2 * 450),
        co2eAvoided: Number((total * 0.42 * 0.45).toFixed(1)),
        costPerTonne: 1850,
        satisfactionPct: 72 + Math.floor(seeded(i + 5) * 18),
        avgBlackSpotDays: 8 + Math.floor(seeded(i + 7) * 10),
      };
    }),
  };

  const compactors = [
    { id: 'comp-1', name: 'Compactor Point — Indiranagar', wardId: 'ward-112', lat: 12.9770, lng: 77.6420, dailyTonnes: 28, status: 'Operational' },
    { id: 'comp-2', name: 'Compactor Point — Koramangala', wardId: 'ward-120', lat: 12.9345, lng: 77.6235, dailyTonnes: 32, status: 'Operational' },
    { id: 'comp-3', name: 'Compactor Point — Hebbal', wardId: 'ward-18', lat: 13.0345, lng: 77.5960, dailyTonnes: 22, status: 'Maintenance' },
  ];

  const facilities = [
    { id: 'fac-1', name: 'Processing Facility — North', type: 'Composting', capacityTpd: 200, utilisedTpd: 145, status: 'Operational' },
    { id: 'fac-2', name: 'Processing Facility — East', type: 'MRF', capacityTpd: 150, utilisedTpd: 118, status: 'Operational' },
    { id: 'fac-3', name: 'WtE Illustrative Unit', type: 'Waste-to-Energy', capacityTpd: 300, utilisedTpd: 210, status: 'Illustrative' },
  ];

  notifications.forEach((note) => {
    note.createdAt = clampEventTime(note.createdAt);
  });

  return {
    _meta: {
      seededAt: nowISO(),
      label: 'Sample Data Environment',
      proposalScaleNote: 'Headline figures (5 corporations, 198 wards, 4,994 autos, 118 DWCs, 16,000 km sweeping) are proposal-scale references. This demo loads a smaller consistent subset.',
      mapCenter: BENGALURU_CENTER,
      demoRecordCounts: {
        corporations: corporations.length,
        constituencies: constituencies.length,
        wards: wards.length,
        vehicles: vehicles.length,
        blocks: blocks.length,
        dryWasteCentres: dryWasteCentres.length,
        complaints: complaints.length,
      },
    },
    corporations,
    constituencies,
    contractors,
    packages,
    wards,
    musters,
    supervisors,
    blocks,
    vehicles,
    routes,
    households,
    dryWasteCentres,
    compactors,
    facilities,
    sweepingStretches,
    blackSpots,
    complaints,
    aiEvents,
    dailyScores,
    notifications,
    feedback,
    auditLog,
    impactMetrics,
    scoreConfig: {
      weights: { ...DEFAULT_SCORE_WEIGHTS },
      thresholds: { ...DEFAULT_SCORE_THRESHOLDS },
      shadowRunMode: true,
      shadowRunMonths: 2,
    },
    settings: {
      appName: 'BSWML One App',
      sampleDataIndicator: true,
    },
  };
}
