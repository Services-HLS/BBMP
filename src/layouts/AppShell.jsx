import { useEffect, useMemo, useState } from 'react';
import {
  AppBar, Box, Button, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Badge, Menu, MenuItem, Divider, useMediaQuery, BottomNavigation,
  BottomNavigationAction, Paper, Tooltip, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  TextField, InputAdornment, List as MuiList, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon, Bell, Moon, Sun, ChevronLeft, ChevronRight, Search as SearchIcon,
  Plus, Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import AppLogo from '../components/brand/AppLogo';
import GovBrandMarks from '../components/brand/GovBrandMarks';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useThemeMode } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { ADMIN_NAV, CITIZEN_NAV, CITIZEN_BOTTOM_NAV, OPS_BOTTOM_NAV, filterNavByRole } from '../constants/navigation';
import {
  ROLE_LABELS, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT, BOTTOMBAR_HEIGHT,
  CONTENT_MAX_WIDTH, APP_ENV_LABEL,
} from '../constants';
import { colors } from '../theme/tokens';

const DASHCAM_NAV_KEY = 'bswml_sidebar_dashcam_open';

export default function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [dashcamNavOpen, setDashcamNavOpen] = useState(() => {
    try {
      return localStorage.getItem(DASHCAM_NAV_KEY) === '1';
    } catch {
      return false;
    }
  });
  const { user, logout, isCitizen } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { mode, toggleTheme } = useThemeMode();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => setLanguage(language === 'kn' ? 'en' : 'kn');
  const headerNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(DASHCAM_NAV_KEY, dashcamNavOpen ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [dashcamNavOpen]);

  useEffect(() => {
    if (location.pathname.startsWith('/dashcam')) {
      setDashcamNavOpen(true);
    }
  }, [location.pathname]);

  const navLabel = (item) => (item.labelKey ? t(item.labelKey) : item.label);
  const navShortLabel = (item) => (item.shortLabelKey ? t(item.shortLabelKey) : (item.shortLabel || navLabel(item)));
  const roleLabel = (role) => {
    if (role === 'citizen') return t('roleCitizen');
    if (role === 'supervisor') return t('roleSupervisor');
    if (role === 'admin') return t('roleAdmin');
    return ROLE_LABELS[role] || 'Demo';
  };

  const navGroups = useMemo(() => {
    if (isCitizen) return [{ group: 'Citizen Portal', groupKey: 'citizenPortal', items: CITIZEN_NAV }];
    return filterNavByRole(ADMIN_NAV, user?.role);
  }, [isCitizen, user?.role]);

  const bottomItems = isCitizen ? CITIZEN_BOTTOM_NAV : OPS_BOTTOM_NAV;
  const drawerWidth = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const showPermanentSidebar = !isMobile;

  const allNavItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);

  const searchResults = useMemo(() => {
    if (!searchQ) return allNavItems;
    const q = searchQ.toLowerCase();
    return allNavItems.filter((i) => {
      const translated = i.labelKey ? t(i.labelKey) : '';
      return i.label.toLowerCase().includes(q) || translated.toLowerCase().includes(q);
    });
  }, [searchQ, allNavItems, t]);

  const isActive = (path) =>
    location.pathname === path || (path !== '/citizen' && path !== '/dashboard' && location.pathname.startsWith(`${path}/`));

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: colors.sidebar,
        color: colors.sidebarText,
        backgroundImage: `
          linear-gradient(180deg, rgba(8,22,36,0.88) 0%, rgba(16,40,60,0.82) 40%, rgba(10,28,44,0.9) 100%),
          url(/sidebar-swm.jpg)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Box
        sx={{
          height: TOPBAR_HEIGHT + 4,
          px: collapsed && !isMobile ? 1 : 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          gap: 0.75,
          borderBottom: `1px solid ${colors.sidebarBorder}`,
          flexShrink: 0,
          bgcolor: 'rgba(8, 22, 36, 0.45)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <AppLogo
          compact={collapsed && !isMobile}
          showEnv={!(collapsed && !isMobile)}
          variant="dark"
          markSize={collapsed && !isMobile ? 36 : 42}
          subtitle={t('appSubtitle')}
        />
        {!isMobile && (
          <IconButton
            size="small"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            sx={{ color: colors.sidebarText, '&:hover': { bgcolor: colors.sidebarHover } }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </IconButton>
        )}
      </Box>

      <Box
        data-scroll-reset
        sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.25, px: 1 }}
      >
        {navGroups.map((group) => (
          <Box key={group.group} sx={{ mb: 1.5 }}>
            {!(collapsed && !isMobile) && (
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  px: 1.5,
                  mb: 0.5,
                  color: colors.sidebarMuted,
                  fontSize: '0.625rem',
                }}
              >
                {group.groupKey ? t(group.groupKey) : group.group}
              </Typography>
            )}
            <List dense disablePadding>
              {group.items.map((item) => {
                const active = isActive(item.path) || location.pathname === item.path;
                const Icon = item.icon;
                const iconOnly = collapsed && !isMobile;
                const itemLabel = navLabel(item);

                if (item.sidebarReveal && !dashcamNavOpen) {
                  const revealLabel = item.revealLabel || 'AI';
                  const revealBtn = (
                    <ListItemButton
                      key={`${item.path}-reveal`}
                      onClick={() => setDashcamNavOpen(true)}
                      sx={{
                        mb: 0.25,
                        minHeight: 40,
                        px: iconOnly ? 1 : 1.25,
                        justifyContent: iconOnly ? 'center' : 'flex-start',
                        color: colors.sidebarMuted,
                        border: '1px dashed rgba(255,255,255,0.18)',
                        '&:hover': { bgcolor: colors.sidebarHover, color: colors.sidebarText },
                      }}
                      aria-label={`Show ${itemLabel}`}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: iconOnly ? 0 : 34,
                          color: 'inherit',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={18} strokeWidth={2.25} />
                      </ListItemIcon>
                      {!iconOnly && (
                        <ListItemText
                          primary={revealLabel}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 700, noWrap: true }}
                        />
                      )}
                    </ListItemButton>
                  );
                  return iconOnly ? (
                    <Tooltip key={`${item.path}-reveal`} title={`Show ${itemLabel}`} placement="right">
                      {revealBtn}
                    </Tooltip>
                  ) : (
                    <Box key={`${item.path}-reveal`}>{revealBtn}</Box>
                  );
                }

                const btn = (
                  <ListItemButton
                    key={item.path}
                    selected={active}
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    sx={{
                      mb: 0.25,
                      minHeight: 40,
                      px: iconOnly ? 1 : 1.25,
                      pr: item.sidebarReveal && !iconOnly ? 0.5 : undefined,
                      justifyContent: iconOnly ? 'center' : 'flex-start',
                      color: active ? '#FFFFFF' : colors.sidebarText,
                      border: '1px solid transparent',
                      '&.Mui-selected': {
                        bgcolor: colors.sidebarActive,
                        color: '#FFFFFF',
                        borderColor: 'rgba(76,214,138,0.35)',
                        '& .MuiListItemIcon-root': { color: colors.leafBright },
                        '&:hover': { bgcolor: 'rgba(45,190,106,0.36)' },
                      },
                      '&:hover': {
                        bgcolor: active ? 'rgba(45,190,106,0.36)' : colors.sidebarHover,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: iconOnly ? 0 : 34,
                        color: active ? colors.leafBright : 'inherit',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} strokeWidth={2.1} />
                    </ListItemIcon>
                    {!iconOnly && (
                      <ListItemText
                        primary={itemLabel}
                        primaryTypographyProps={{
                          fontSize: 13,
                          fontWeight: active ? 700 : 600,
                          noWrap: true,
                        }}
                      />
                    )}
                    {item.sidebarReveal && !iconOnly && (
                      <IconButton
                        size="small"
                        aria-label={`Hide ${itemLabel}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDashcamNavOpen(false);
                          if (location.pathname.startsWith(item.path)) {
                            navigate('/dashboard');
                            setMobileOpen(false);
                          }
                        }}
                        sx={{
                          color: colors.sidebarMuted,
                          ml: 0.25,
                          '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </IconButton>
                    )}
                  </ListItemButton>
                );
                return iconOnly ? (
                  <Tooltip
                    key={item.path}
                    title={itemLabel}
                    placement="right"
                  >
                    {btn}
                  </Tooltip>
                ) : (
                  <Box key={item.path}>{btn}</Box>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: `1px solid ${colors.sidebarBorder}`,
          bgcolor: 'rgba(8, 22, 36, 0.4)',
        }}
      >
        {collapsed && !isMobile ? (
          <Tooltip title={APP_ENV_LABEL} placement="right">
            <Chip
              size="small"
              label="Demo"
              sx={{
                width: '100%',
                height: 22,
                fontSize: '0.625rem',
                fontWeight: 700,
                bgcolor: alpha(colors.amber, 0.18),
                color: '#F0C878',
                border: '1px solid',
                borderColor: alpha(colors.amber, 0.45),
              }}
            />
          </Tooltip>
        ) : (
          <Chip
            label={t('demoSampleData')}
            size="small"
            sx={{
              width: '100%',
              height: 22,
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              justifyContent: 'flex-start',
              bgcolor: alpha(colors.amber, 0.16),
              color: '#F0C878',
              border: '1px solid',
              borderColor: alpha(colors.amber, 0.4),
            }}
          />
        )}
      </Box>
    </Box>
  );

  const bottomValue = (() => {
    const exact = bottomItems.findIndex((i) => location.pathname === i.path);
    if (exact >= 0) return exact;
    return bottomItems.findIndex(
      (i) => i.path !== '/citizen' && i.path !== '/dashboard' && location.pathname.startsWith(i.path)
    );
  })();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top bar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${showPermanentSidebar ? drawerWidth : 0}px)` },
          ml: { md: showPermanentSidebar ? `${drawerWidth}px` : 0 },
          bgcolor: alpha(theme.palette.background.paper, mode === 'dark' ? 0.92 : 0.94),
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create(['width', 'margin'], { duration: 180 }),
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 0.25, sm: 0.75 },
            minHeight: `${TOPBAR_HEIGHT}px !important`,
            px: { xs: 1, sm: 2 },
            overflow: 'hidden',
          }}
        >
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon size={20} />
          </IconButton>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 0.5, minWidth: 0, flexShrink: 1 }}>
            <AppLogo compact showEnv={false} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: { xs: 0.25, sm: 0.75 },
              flexShrink: 0,
            }}
          >
            <GovBrandMarks size={isMobile ? 28 : 34} gap={0.75} dense />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {format(new Date(), 'EEE, dd MMM yyyy · HH:mm')}
          </Typography>

          <Chip
            label={roleLabel(user?.role)}
            size="small"
            sx={{
              display: { xs: 'none', lg: 'inline-flex' },
              ml: 1,
              height: 24,
              fontWeight: 700,
              bgcolor: alpha(colors.teal, 0.1),
              color: colors.teal,
              border: '1px solid',
              borderColor: alpha(colors.teal, 0.28),
            }}
          />

          <Box sx={{ flex: 1 }} />

          <Tooltip title={language === 'kn' ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ'}>
            <Chip
              clickable
              onClick={toggleLanguage}
              aria-label={t('language')}
              size="small"
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    component="span"
                    sx={{
                      fontWeight: language === 'en' ? 800 : 500,
                      opacity: language === 'en' ? 1 : 0.55,
                      display: { xs: language === 'en' ? 'inline' : 'none', sm: 'inline' },
                    }}
                  >
                    EN
                  </Box>
                  <Box
                    component="span"
                    sx={{ opacity: 0.4, fontWeight: 500, display: { xs: 'none', sm: 'inline' } }}
                  >
                    |
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      fontWeight: language === 'kn' ? 800 : 500,
                      opacity: language === 'kn' ? 1 : 0.55,
                      fontFamily: 'Noto Sans Kannada, system-ui, sans-serif',
                      display: { xs: language === 'kn' ? 'inline' : 'none', sm: 'inline' },
                    }}
                  >
                    ಕನ್ನಡ
                  </Box>
                </Box>
              }
              sx={{
                height: 28,
                px: 0.25,
                mr: 0.25,
                maxWidth: { xs: 72, sm: 'none' },
                fontSize: '0.72rem',
                letterSpacing: 0,
                bgcolor: alpha(colors.teal, language === 'kn' ? 0.16 : 0.08),
                color: 'text.primary',
                border: '1px solid',
                borderColor: alpha(colors.teal, language === 'kn' ? 0.45 : 0.22),
                '&:hover': {
                  bgcolor: alpha(colors.teal, 0.18),
                  borderColor: alpha(colors.teal, 0.4),
                },
              }}
            />
          </Tooltip>

          <IconButton onClick={() => setSearchOpen(true)} aria-label="Search pages" size="small">
            <SearchIcon size={18} />
          </IconButton>
          <IconButton onClick={toggleTheme} aria-label="Toggle theme" size="small">
            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </IconButton>
          <IconButton
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            aria-label={t('notifications')}
            size="small"
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Bell size={18} />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  width: { xs: 'min(100vw - 24px, 360px)', sm: 380 },
                  maxHeight: 440,
                  mt: 1,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography fontWeight={700} fontSize={14}>{t('notifications')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {unreadCount} unread · {roleLabel(user?.role)}
                </Typography>
              </Box>
              {unreadCount > 0 && (
                <Button size="small" onClick={() => markAllRead()}>
                  Mark all
                </Button>
              )}
            </Box>
            <Divider />
            {headerNotifications.length === 0 ? (
              <Box sx={{ px: 2, py: 2.5 }}>
                <Typography variant="body2" color="text.secondary">No notifications for this login.</Typography>
              </Box>
            ) : (
              headerNotifications.map((n) => (
                <MenuItem
                  key={n.id}
                  dense
                  onClick={async () => {
                    setNotifAnchor(null);
                    await markRead(n.id);
                    if (n.link) navigate(n.link);
                    else navigate('/notifications');
                  }}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1.25,
                    whiteSpace: 'normal',
                    bgcolor: n.read ? 'transparent' : alpha(colors.teal, 0.06),
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ minWidth: 0, width: '100%' }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.25 }}>
                      {!n.read && <Chip size="small" color="error" label="New" sx={{ height: 18, fontSize: '0.65rem' }} />}
                      <Typography variant="caption" color="text.secondary">{n.category}</Typography>
                    </Stack>
                    <Typography fontWeight={700} fontSize={13} sx={{ lineHeight: 1.3 }}>{n.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', mt: 0.25 }}>
                      {n.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
            <Divider />
            <MenuItem
              dense
              onClick={() => {
                setNotifAnchor(null);
                navigate('/notifications');
              }}
              sx={{ justifyContent: 'center', fontWeight: 700, color: colors.teal }}
            >
              View all notifications
            </MenuItem>
          </Menu>
          <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} aria-label="Profile menu" size="small">
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: colors.navy,
                fontSize: 13,
                fontWeight: 700,
                border: `2px solid ${alpha(colors.teal, 0.45)}`,
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography fontWeight={700} fontSize={14}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{roleLabel(user?.role)}</Typography>
            </Box>
            <Divider />
            <MenuItem dense onClick={() => { setProfileAnchor(null); navigate(isCitizen ? '/citizen/settings' : '/settings'); }}>
              {t('settings')}
            </MenuItem>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                {t('switchRoleHint')}
              </Typography>
            </Box>
            <MenuItem dense onClick={() => { setProfileAnchor(null); logout(); navigate('/login'); }}>
              {t('logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar — unified for all roles on desktop */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', { duration: 180 }),
        }}
        aria-label="Main navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              top: 0,
              height: '100%',
              border: 'none',
              bgcolor: colors.sidebar,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              top: 0,
              height: '100vh',
              borderRight: `1px solid ${colors.sidebarBorder}`,
              bgcolor: colors.sidebar,
              transition: theme.transitions.create('width', { duration: 180 }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main — light workspace panel (matches login right) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          minHeight: '100vh',
          pt: `${TOPBAR_HEIGHT}px`,
          pb: {
            xs: `calc(${BOTTOMBAR_HEIGHT}px + env(safe-area-inset-bottom) + 24px)`,
            md: 3,
          },
          background: mode === 'dark'
            ? `linear-gradient(180deg, ${colors.navyDeep} 0%, ${colors.darkNavy} 100%)`
            : `linear-gradient(165deg, #E4ECF2 0%, ${colors.bg} 42%, #F1F5F8 100%)`,
          overflowX: 'hidden',
          transition: theme.transitions.create(['width', 'margin'], { duration: 180 }),
        }}
      >
        <Box
          sx={{
            px: { xs: 1.5, sm: 2.5, md: 3 },
            py: { xs: 1.75, sm: 2.5 },
            maxWidth: CONTENT_MAX_WIDTH,
            mx: 'auto',
            width: '100%',
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Mobile bottom nav */}
      <Paper
        className="no-print safe-bottom"
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderTop: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          bgcolor: 'background.paper',
          boxShadow: '0 -4px 16px rgba(16,40,60,0.08)',
        }}
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={bottomValue < 0 ? 0 : bottomValue}
          onChange={(_, idx) => navigate(bottomItems[idx].path)}
          sx={{
            height: BOTTOMBAR_HEIGHT,
            '& .Mui-selected': { color: `${colors.navy} !important` },
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.5,
              py: 0.5,
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.625rem',
              lineHeight: 1.2,
              '&.Mui-selected': { fontSize: '0.625rem' },
            },
          }}
        >
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <BottomNavigationAction
                key={item.path}
                label={navShortLabel(item)}
                icon={<Icon size={18} strokeWidth={2.1} />}
              />
            );
          })}
        </BottomNavigation>
      </Paper>

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>{t('search')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder={t('search')}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon size={16} /></InputAdornment>
              ),
            }}
            sx={{ mb: 1.5, mt: 0.5 }}
          />
          <MuiList dense>
            {searchResults.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSearchOpen(false);
                  setSearchQ('');
                }}
              >
                <ListItemText primary={navLabel(item)} secondary={item.path} />
              </ListItemButton>
            ))}
          </MuiList>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
