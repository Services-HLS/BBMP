import {
  LayoutDashboard, Truck, Route, House, Recycle, MessageSquareWarning,
  Brush, Camera, MessageCircle, Gauge, FileBarChart, Bot, Leaf,
  Bell, Settings, MapPin, Flag, ClipboardList, CalendarCheck, ClipboardCheck,
} from 'lucide-react';
import { ROLES } from './index';

export const ADMIN_NAV = [
  {
    group: 'Operations',
    groupKey: 'navOperations',
    items: [
      { label: 'Dashboard', labelKey: 'dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Live Vehicle Tracking', labelKey: 'liveVehicleTracking', path: '/vehicles', icon: Truck, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Ward simulation', path: '/simulation', icon: MapPin, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Ward 39 houses', path: '/ward-39', icon: House, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Routes & Blocks', labelKey: 'routesBlocks', path: '/routes', icon: Route, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Household Coverage', labelKey: 'householdCoverage', path: '/coverage', icon: House, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Dry Waste Centres', labelKey: 'dryWasteCentres', path: '/dry-waste-centres', icon: Recycle, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
    ],
  },
  {
    group: 'Civic Issues',
    groupKey: 'navCivicIssues',
    items: [
      { label: 'Complaint Management', labelKey: 'complaintManagement', path: '/complaints', icon: MessageSquareWarning, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Sweeping & Black Spots', labelKey: 'sweepingBlackSpots', path: '/sweeping', icon: Brush, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      {
        label: 'Dashcam & AI Events',
        labelKey: 'dashcamAiEvents',
        path: '/dashcam',
        icon: Camera,
        roles: [ROLES.ADMIN, ROLES.SUPERVISOR],
        /** Collapsed row shows only this short label +; full name appears after expand */
        sidebarReveal: true,
        revealLabel: 'AI',
      },
      { label: 'Citizen Feedback', labelKey: 'citizenFeedback', path: '/feedback', icon: MessageCircle, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
    ],
  },
  {
    group: 'Analytics',
    groupKey: 'navAnalytics',
    items: [
      { label: 'Performance Scorecards', labelKey: 'performanceScorecards', path: '/scorecards', icon: Gauge, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Monthly Reports', labelKey: 'monthlyReports', path: '/reports', icon: FileBarChart, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'AI Assistant', labelKey: 'aiAssistant', path: '/assistant', icon: Bot, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Impact Dashboard', labelKey: 'impactDashboard', path: '/impact', icon: Leaf, roles: [ROLES.ADMIN] },
    ],
  },
  {
    group: 'System',
    groupKey: 'navSystem',
    items: [
      { label: 'Notifications', labelKey: 'notifications', path: '/notifications', icon: Bell, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Settings', labelKey: 'settings', path: '/settings', icon: Settings, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
    ],
  },
];

export const CITIZEN_NAV = [
  { label: 'Home', labelKey: 'home', path: '/citizen', icon: House, roles: [ROLES.CITIZEN] },
  { label: 'Track My Auto', labelKey: 'trackMyAuto', path: '/citizen/track', icon: MapPin, roles: [ROLES.CITIZEN] },
  { label: 'Report a Problem', labelKey: 'reportProblem', path: '/citizen/report', icon: Flag, roles: [ROLES.CITIZEN] },
  { label: 'My Reports', labelKey: 'myReports', path: '/citizen/reports', icon: ClipboardList, roles: [ROLES.CITIZEN] },
  { label: 'Collection Calendar', labelKey: 'collectionCalendarNav', path: '/citizen/calendar', icon: CalendarCheck, roles: [ROLES.CITIZEN] },
  { label: "Today's Pickup", labelKey: 'todaysPickup', path: '/citizen/pickup', icon: ClipboardCheck, roles: [ROLES.CITIZEN] },
  { label: 'Settings', labelKey: 'settings', path: '/citizen/settings', icon: Settings, roles: [ROLES.CITIZEN] },
];

export const CITIZEN_BOTTOM_NAV = [
  { label: 'Home', labelKey: 'navHome', shortLabel: 'Home', shortLabelKey: 'navHome', path: '/citizen', icon: House },
  { label: 'Track', labelKey: 'navTrack', shortLabel: 'Track', shortLabelKey: 'navTrack', path: '/citizen/track', icon: MapPin },
  { label: 'Report', labelKey: 'navReport', shortLabel: 'Report', shortLabelKey: 'navReport', path: '/citizen/report', icon: Flag },
  { label: 'Reports', labelKey: 'navReports', shortLabel: 'List', shortLabelKey: 'navList', path: '/citizen/reports', icon: ClipboardList },
  { label: 'More', labelKey: 'navMore', shortLabel: 'More', shortLabelKey: 'navMore', path: '/citizen/settings', icon: Settings },
];

export const OPS_BOTTOM_NAV = [
  { label: 'Home', labelKey: 'navHome', shortLabel: 'Home', shortLabelKey: 'navHome', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Vehicles', labelKey: 'navVehicles', shortLabel: 'Fleet', shortLabelKey: 'navFleet', path: '/vehicles', icon: Truck },
  { label: 'Complaints', labelKey: 'navComplaints', shortLabel: 'Issues', shortLabelKey: 'navIssues', path: '/complaints', icon: MessageSquareWarning },
  { label: 'Alerts', labelKey: 'navAlerts', shortLabel: 'Alerts', shortLabelKey: 'navAlerts', path: '/notifications', icon: Bell },
  { label: 'More', labelKey: 'navMore', shortLabel: 'More', shortLabelKey: 'navMore', path: '/settings', icon: Settings },
];

export function filterNavByRole(navGroups, role) {
  return navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);
}

// Keep ClipboardCheck available for role screens that import from here later
export { ClipboardCheck };
