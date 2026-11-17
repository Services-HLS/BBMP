import { createTheme, alpha } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { colors, layout, radii, shadows } from './tokens';

const getDesignTokens = (mode) => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      ...palette,
    },
    typography: {
      fontFamily: '"Source Sans 3", "Plus Jakarta Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
        fontWeight: 800,
        fontSize: '1.5rem',
        letterSpacing: '-0.025em',
        lineHeight: 1.25,
      },
      h2: {
        fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
        fontWeight: 700,
        fontSize: '1.25rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.3,
      },
      h3: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.35 },
      h4: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.35 },
      h5: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4 },
      h6: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.4 },
      subtitle1: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.45 },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.45 },
      body1: { fontSize: '0.875rem', lineHeight: 1.55 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
      caption: { fontSize: '0.75rem', lineHeight: 1.4, color: palette.text.secondary },
      overline: {
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        lineHeight: 1.4,
        textTransform: 'uppercase',
      },
    },
    shape: { borderRadius: radii.lg },
    spacing: 8,
    shadows: [
      'none',
      shadows.xs,
      shadows.sm,
      shadows.md,
      shadows.md,
      shadows.md,
      ...Array(19).fill(shadows.md),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--bswml-navy': colors.navy,
            '--bswml-dark-navy': colors.darkNavy,
            '--bswml-teal': colors.teal,
            '--bswml-emerald': colors.emerald,
            '--bswml-bg': isDark ? palette.background.default : colors.bg,
            '--bswml-paper': isDark ? palette.background.paper : colors.paper,
            '--bswml-border': palette.divider,
            '--bswml-text': palette.text.primary,
            '--bswml-sidebar': `${layout.sidebarWidth}px`,
            '--bswml-topbar': `${layout.topbarHeight}px`,
            '--bswml-content-max': `${layout.contentMaxWidth}px`,
            '--bswml-radius': `${radii.lg}px`,
          },
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(palette.text.secondary, 0.28),
              borderRadius: 4,
            },
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: { size: 'small', disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            minHeight: 38,
            padding: '7px 16px',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
            '&.Mui-focusVisible': { boxShadow: shadows.focus },
          },
          sizeSmall: { minHeight: 34, padding: '5px 12px' },
          containedPrimary: {
            '&:hover': { backgroundColor: colors.darkNavy },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            '&.Mui-focusVisible': { boxShadow: shadows.focus },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: radii.lg,
            border: `1px solid ${palette.divider}`,
            boxShadow: isDark ? 'none' : shadows.xs,
            backgroundImage: 'none',
            backgroundColor: palette.background.paper,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: {
            borderColor: palette.divider,
            borderRadius: radii.xl,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 26,
            borderRadius: radii.pill,
          },
          sizeSmall: { height: 22 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${palette.divider}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: `${layout.topbarHeight}px !important`,
            paddingLeft: '16px !important',
            paddingRight: '16px !important',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              backgroundColor: isDark ? alpha('#fff', 0.03) : colors.bgElevated,
              color: palette.text.secondary,
              fontSize: '0.75rem',
              textTransform: 'none',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: palette.divider,
            padding: '10px 14px',
            fontSize: '0.8125rem',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover:hover': {
              backgroundColor: isDark ? alpha('#fff', 0.03) : alpha(colors.navy, 0.03),
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiFormControl: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            backgroundColor: isDark ? alpha('#fff', 0.03) : colors.paper,
            minHeight: layout.controlHeight,
          },
          input: { paddingTop: 9, paddingBottom: 9 },
        },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: { height: 2, borderRadius: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 40,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            paddingInline: 14,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            '&.Mui-focusVisible': { boxShadow: shadows.focus },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radii.xl,
            margin: 16,
            width: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
            '&.MuiDialog-paperFullScreen': {
              margin: 0,
              width: '100%',
              maxHeight: '100%',
              borderRadius: 0,
            },
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '12px 16px 16px',
            gap: 8,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            alignItems: 'center',
            fontSize: '0.8125rem',
            border: `1px solid ${alpha(palette.divider, 0.9)}`,
          },
          standardInfo: {
            backgroundColor: isDark ? alpha(colors.info, 0.15) : colors.infoSoft,
            color: isDark ? palette.text.primary : colors.navy,
          },
          standardWarning: {
            backgroundColor: isDark ? alpha(colors.amber, 0.15) : colors.amberSoft,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { borderRadius: radii.md },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: { height: layout.bottomNavHeight },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            minWidth: 0,
            flex: 1,
            paddingTop: 8,
            paddingLeft: 4,
            paddingRight: 4,
            '&.Mui-selected': { color: `${colors.navy} !important` },
          },
          label: {
            fontSize: '0.625rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode = 'light') => createTheme(getDesignTokens(mode));

export { lightPalette, darkPalette };
export { colors, spacing, layout, radii, shadows, typographyScale, motion } from './tokens';
