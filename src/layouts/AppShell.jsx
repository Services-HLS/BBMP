import { useMemo, useState } from 'react';
import {
  AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Badge, Menu, MenuItem, Divider, useMediaQuery, BottomNavigation,
  BottomNavigationAction, Paper, Tooltip, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  TextField, InputAdornment, List as MuiList,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon, Bell, Moon, Sun, ChevronLeft, ChevronRight, Search as SearchIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import AppLogo from '../components/brand/AppLogo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useThemeMode } from '../context/ThemeContext';
import { ADMIN_NAV, CITIZEN_NAV, CITIZEN_BOTTOM_NAV, OPS_BOTTOM_NAV, filterNavByRole } from '../constants/navigation';
import {
  ROLE_LABELS, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT, BOTTOMBAR_HEIGHT,
  CONTENT_MAX_WIDTH, APP_ENV_LABEL,
} from '../constants';
import { colors } from '../theme/tokens';

export default function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const { user, logout, isCitizen } = useAuth();
  const { unreadCount } = useNotifications();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = useMemo(() => {
    if (isCitizen) return [{ group: 'Citizen Portal', items: CITIZEN_NAV }];
    return filterNavByRole(ADMIN_NAV, user?.role);
  }, [isCitizen, user?.role]);

  const bottomItems = isCitizen ? CITIZEN_BOTTOM_NAV : OPS_BOTTOM_NAV;
  const drawerWidth = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const showPermanentSidebar = !isMobile;

  const allNavItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);

  const searchResults = useMemo(() => {
    if (!searchQ) return allNavItems;
    const q = searchQ.toLowerCase();
    return allNavItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [searchQ, allNavItems]);

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
          subtitle="SWM & Civic Operations"
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
                {group.group}
              </Typography>
            )}
            <List dense disablePadding>
              {group.items.map((item) => {
                const active = isActive(item.path) || location.pathname === item.path;
                const Icon = item.icon;
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
                      px: collapsed && !isMobile ? 1 : 1.25,
                      justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
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
                        minWidth: collapsed && !isMobile ? 0 : 34,
                        color: active ? colors.leafBright : 'inherit',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} strokeWidth={2.1} />
                    </ListItemIcon>
                    {!(collapsed && !isMobile) && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: 13,
                          fontWeight: active ? 700 : 600,
                          noWrap: true,
                        }}
                      />
                    )}
                  </ListItemButton>
                );
                return collapsed && !isMobile ? (
                  <Tooltip key={item.path} title={item.label} placement="right">{btn}</Tooltip>
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
            label="DEMO · SAMPLE DATA"
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
        <Toolbar sx={{ gap: 0.75, minHeight: `${TOPBAR_HEIGHT}px !important` }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon size={20} />
          </IconButton>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 0.5 }}>
            <AppLogo compact showEnv={false} />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {format(new Date(), 'EEE, dd MMM yyyy · HH:mm')}
          </Typography>

          <Chip
            label={ROLE_LABELS[user?.role] || 'Demo'}
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

          <IconButton onClick={() => setSearchOpen(true)} aria-label="Search pages" size="small">
            <SearchIcon size={18} />
          </IconButton>
          <IconButton onClick={toggleTheme} aria-label="Toggle theme" size="small">
            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </IconButton>
          <IconButton
            onClick={() => navigate(isCitizen ? '/citizen/settings' : '/notifications')}
            aria-label="Notifications"
            size="small"
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Bell size={18} />
            </Badge>
          </IconButton>
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
              <Typography variant="caption" color="text.secondary">{ROLE_LABELS[user?.role]}</Typography>
            </Box>
            <Divider />
            <MenuItem dense onClick={() => { setProfileAnchor(null); navigate(isCitizen ? '/citizen/settings' : '/settings'); }}>
              Settings
            </MenuItem>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                To use another role, logout and sign in with different demo credentials.
              </Typography>
            </Box>
            <MenuItem dense onClick={() => { setProfileAnchor(null); logout(); navigate('/login'); }}>
              Logout
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
            '& .Mui-selected': { color: `${colors.navy} !important` },
          }}
        >
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={<Icon size={18} strokeWidth={2.1} />}
              />
            );
          })}
        </BottomNavigation>
      </Paper>

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>Go to page</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search navigation…"
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
                <ListItemText primary={item.label} secondary={item.path} />
              </ListItemButton>
            ))}
          </MuiList>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
