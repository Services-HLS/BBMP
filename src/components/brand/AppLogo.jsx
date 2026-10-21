import { Box, Stack, Typography } from '@mui/material';
import CivicMark from './CivicMark';
import { colors } from '../../theme/tokens';

/**
 * Brand lockup: Eco City Leaf Emblem + "BBMP" + "One App".
 */
export default function AppLogo({
  compact = false,
  showEnv = true,
  variant = 'light',
  subtitle = 'Solid Waste Management & Civic Operations',
  markSize,
}) {
  const isDark = variant === 'dark';
  const size = markSize ?? (compact ? 36 : 42);
  const isHero = size >= 64;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={{ xs: 1.25, sm: 1.5 }}
      sx={{ minWidth: 0, maxWidth: '100%' }}
    >
      <CivicMark size={size} variant={variant} />
      {!compact && (
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 0.15,
          }}
        >
          <Typography
            component="div"
            noWrap
            sx={{
              fontFamily: '"Plus Jakarta Sans", "Source Sans 3", "Segoe UI", sans-serif',
              fontWeight: 800,
              fontSize: isHero
                ? { xs: '1.4rem', sm: '1.7rem', lg: '1.9rem' }
                : { xs: '0.98rem', sm: '1.08rem' },
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.75,
            }}
          >
            <Box
              component="span"
              sx={{
                color: isDark ? '#FFFFFF' : colors.navy,
                textShadow: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              BBMP
            </Box>
            <Box
              component="span"
              sx={{
                color: isDark ? colors.leafBright : colors.leaf,
                textShadow: isDark ? '0 1px 3px rgba(0,0,0,0.35)' : 'none',
              }}
            >
              One App
            </Box>
          </Typography>
          {showEnv ? (
            <Typography
              noWrap
              sx={{
                display: 'block',
                mt: isHero ? 0.55 : 0.35,
                fontFamily: '"Plus Jakarta Sans", "Source Sans 3", "Segoe UI", sans-serif',
                fontSize: isHero ? { xs: '0.78rem', sm: '0.88rem' } : '0.65rem',
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '0.01em',
                color: isDark ? 'rgba(220,230,236,0.82)' : colors.textSecondary,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      )}
    </Stack>
  );
}
