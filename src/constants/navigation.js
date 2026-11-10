import {
  LayoutDashboard, Truck, Route, House, Recycle, MessageSquareWarning,
  Brush, Camera, MessageCircle, Gauge, FileBarChart, Bot, Leaf,
  Bell, Settings, MapPin, Flag, ClipboardList, CalendarCheck, ClipboardCheck,
} from 'lucide-react';
import { ROLES } from './index';

export const ADMIN_NAV = [
  {
    group: 'Operations',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Live Vehicle Tracking', path: '/vehicles', icon: Truck, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Routes & Blocks', path: '/routes', icon: Route, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Household Coverage', path: '/coverage', icon: House, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Dry Waste Centres', path: '/dry-waste-centres', icon: Recycle, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
    ],
  },
  {
    group: 'Civic Issues',
    items: [
      { label: 'Complaint Management', path: '/complaints', icon: MessageSquareWarning, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Sweeping & Black Spots', path: '/sweeping', icon: Brush, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Dashcam & AI Events', path: '/dashcam', icon: Camera, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Citizen Feedback', path: '/feedback', icon: MessageCircle, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { label: 'Performance Scorecards', path: '/scorecards', icon: Gauge, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Monthly Reports', path: '/reports', icon: FileBarChart, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'AI Assistant', path: '/assistant', icon: Bot, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Impact Dashboard', path: '/impact', icon: Leaf, roles: [ROLES.ADMIN] },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
      { label: 'Settings', path: '/settings', icon: Settings, roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
    ],
  },
];

export const CITIZEN_NAV = [
  { label: 'Home', path: '/citizen', icon: House, roles: [ROLES.CITIZEN] },
  { label: 'Track My Auto', path: '/citizen/track', icon: MapPin, roles: [ROLES.CITIZEN] },
  { label: 'Report a Problem', path: '/citizen/report', icon: Flag, roles: [ROLES.CITIZEN] },
  { label: 'My Reports', path: '/citizen/reports', icon: ClipboardList, roles: [ROLES.CITIZEN] },
  { label: 'Collection Calendar', path: '/citizen/calendar', icon: CalendarCheck, roles: [ROLES.CITIZEN] },
  { label: "Today's Pickup", path: '/citizen/pickup', icon: ClipboardCheck, roles: [ROLES.CITIZEN] },
  { label: 'Settings', path: '/citizen/settings', icon: Settings, roles: [ROLES.CITIZEN] },
];

export const CITIZEN_BOTTOM_NAV = [
  { label: 'Home', path: '/citizen', icon: House },
  { label: 'Track', path: '/citizen/track', icon: MapPin },
  { label: 'Report', path: '/citizen/report', icon: Flag },
  { label: 'Reports', path: '/citizen/reports', icon: ClipboardList },
  { label: 'More', path: '/citizen/settings', icon: Settings },
];

export const OPS_BOTTOM_NAV = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Vehicles', path: '/vehicles', icon: Truck },
  { label: 'Complaints', path: '/complaints', icon: MessageSquareWarning },
  { label: 'Alerts', path: '/notifications', icon: Bell },
  { label: 'More', path: '/settings', icon: Settings },
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
