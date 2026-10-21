/** Central design tokens — matched to City Leaf logo (navy + leaf green) */

export const colors = {
  // Logo navy circle
  navy: '#143A4F',
  darkNavy: '#0F2A3A',
  navyDeep: '#0A1C28',
  navyMuted: '#2A5366',
  // Logo leaf greens
  teal: '#1FA86A',
  tealSoft: '#7DDBC4',
  emerald: '#2DBE6A',
  emeraldDark: '#1B8F4E',
  leaf: '#2DBE6A',
  leafBright: '#4CD68A',
  leafDeep: '#1B8F4E',
  lightGreen: '#E8F8EF',
  amber: '#D99224',
  amberSoft: '#FBF3E6',
  critical: '#C83C3C',
  criticalSoft: '#F9EAEA',
  info: '#2A6F97',
  infoSoft: '#E8F1F6',
  bg: '#EAF0F4',
  bgElevated: '#F5F8FA',
  paper: '#FFFFFF',
  text: '#143A4F',
  textSecondary: '#5B6F80',
  textDisabled: '#94A3B8',
  border: '#D5DEE6',
  borderStrong: '#B8C5D0',
  sidebar: '#0F2A3A',
  sidebarHover: 'rgba(255,255,255,0.06)',
  sidebarActive: 'rgba(45,190,106,0.28)',
  sidebarBorder: 'rgba(255,255,255,0.1)',
  sidebarText: 'rgba(255,255,255,0.92)',
  sidebarMuted: 'rgba(255,255,255,0.58)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 20,
  pageY: 20,
  pageX: { xs: 16, sm: 20, md: 24 },
};

export const layout = {
  sidebarWidth: 256,
  sidebarCollapsed: 68,
  topbarHeight: 52,
  bottomNavHeight: 60,
  contentMaxWidth: 1240,
  drawerWidth: 420,
  controlHeight: 38,
  iconSm: 16,
  iconMd: 18,
  iconLg: 20,
  kpiIconBox: 36,
};

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  pill: 999,
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(15,42,58,0.05)',
  sm: '0 1px 3px rgba(15,42,58,0.06)',
  md: '0 4px 12px rgba(15,42,58,0.08)',
  focus: '0 0 0 3px rgba(45,190,106,0.28)',
};

export const typographyScale = {
  pageTitle: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
  sectionTitle: { fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.01em' },
  kpiValue: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
  kpiLabel: { fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' },
};

export const motion = {
  fast: '120ms ease',
  normal: '180ms ease',
};
