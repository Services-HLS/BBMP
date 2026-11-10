export const APP_NAME = 'BBMP One App';
export const APP_TAGLINE = 'Solid Waste Management & Civic Operations';
export const APP_ENV_LABEL = 'DEMO ENVIRONMENT · SAMPLE DATA';
export const APP_VERSION = '1.0.0-demo';
export const STORAGE_VERSION = '1.2.0';
export const STORAGE_KEY = `bbmp-one-app-v${STORAGE_VERSION}`;
export const SESSION_KEY = 'bbmp-one-app-session';
export const PREFS_KEY = 'bbmp-one-app-prefs';
export const CITIZEN_PROFILE_KEY = 'bbmp-citizen-profiles';

/** Proposal-scale reference figures (not equal to demo record counts) */
export const PROPOSAL_SCALE = {
  corporations: 5,
  constituencies: 27,
  wards: 198,
  musterLocations: 238,
  autosBlocks: 4994,
  dryWasteCentres: 118,
  sweepingKm: 16000,
};

export const ROLES = {
  CITIZEN: 'citizen',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.CITIZEN]: 'Citizen',
  [ROLES.SUPERVISOR]: 'Field Supervisor / JHI',
  [ROLES.ADMIN]: 'BBMP Administrator',
};

export const DEMO_USERS = [
  {
    id: 'user-citizen-1',
    name: 'Priya Sharma',
    username: 'citizen',
    password: 'citizen123',
    email: 'priya.demo@example.com',
    role: ROLES.CITIZEN,
    wardId: 'ward-112',
    blockId: 'block-112-A',
    phone: '+91 98XXX XX001',
    defaultAddress: {
      houseNo: '42',
      street: '100 Feet Road',
      area: 'Indiranagar',
      landmark: 'Near metro station',
      city: 'Bengaluru',
      pincode: '560038',
    },
  },
  {
    id: 'user-supervisor-1',
    name: 'Ramesh Kumar',
    username: 'supervisor',
    password: 'supervisor123',
    email: 'ramesh.jhi@demo.bbmp.local',
    role: ROLES.SUPERVISOR,
    wardIds: ['ward-112', 'ward-113', 'ward-114'],
    phone: '+91 98XXX XX002',
  },
  {
    id: 'user-admin-1',
    name: 'Ananya Reddy',
    username: 'admin',
    password: 'admin123',
    email: 'ananya.admin@demo.bbmp.local',
    role: ROLES.ADMIN,
    phone: '+91 98XXX XX003',
  },
];

export const VEHICLE_STATUSES = [
  'On Route',
  'Idle',
  'Delayed',
  'Offline',
  'Centre Visit Pending',
];

export const COMPLAINT_CATEGORIES = [
  'Skipped Household Pickup',
  'Late Auto',
  'Missed Dry Waste Collection',
  'Black Spot / Illegal Dumping',
  'Pothole',
  'Debris',
  'Suggestion',
];

export const COMPLAINT_STATUSES = [
  'Submitted',
  'Verification Pending',
  'Verified',
  'Assigned',
  'In Progress',
  'Resolution Evidence Submitted',
  'Resolved',
  'Reopened',
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const AI_EVENT_TYPES = [
  'Pothole',
  'Debris',
  'Suspected Illegal Dumping',
  'Route Deviation',
  'Speeding',
  'Unusual Stoppage',
];

export const AI_EVENT_STATUSES = [
  'New',
  'Confirmed',
  'False Positive',
  'Assigned',
  'Escalated',
  'Resolved',
];

export const BLACK_SPOT_CATEGORIES = [
  'Illegal Dumping',
  'Overflowing Bin',
  'Construction Debris',
  'Recurring Dump Site',
  'Open Drain Waste',
];

export const DEFAULT_SCORE_WEIGHTS = {
  stopsVsNormal: 25,
  housesCovered: 25,
  dryWasteCentreVisit: 20,
  routeCompletionTime: 10,
  speedAlerts: 10,
  unnecessaryStoppages: 5,
  deviceUptime: 5,
};

export const DEFAULT_SCORE_THRESHOLDS = {
  fullPaymentMin: 85,
  reducedPaymentMin: 70,
  coverageTarget: 95,
  stopsTargetRatio: 1.0,
  maxSpeedAlerts: 0,
  maxStoppages: 2,
  routeTimeToleranceMinutes: 30,
};

export const PAYMENT_BANDS = {
  FULL: 'Full Payment Band (85–100)',
  REDUCED: 'Reduced Band (70–84)',
  REVIEW: 'Review Band (<70)',
};

export const NOTIFICATION_CATEGORIES = [
  'Route Deviation',
  'Excessive Stoppage',
  'Speed Violation',
  'Low Household Coverage',
  'Pending Dry Waste Centre Visit',
  'Overdue Complaint',
  'New Assignment',
  'Resolved Complaint',
  'System',
];

export const DATE_FILTERS = ['daily', 'weekly', 'monthly'];

export const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };

export { layout as LAYOUT_TOKENS } from '../theme/tokens';
export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 68;
export const TOPBAR_HEIGHT = 52;
export const BOTTOMBAR_HEIGHT = 60;
export const CONTENT_MAX_WIDTH = 1240;
