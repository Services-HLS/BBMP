import { Box, Stack, Typography } from '@mui/material';
import { APP_ORG_NAME, APP_SHORT_NAME } from '../../constants';
import { BSWML_SEALS_SRC } from './brandAssets';

/**
 * Official BSWML lockup: Karnataka + Greater Bengaluru seals + abbreviation.
 * The seals asset already includes the full org name under the emblems.
 */
export default function BswmlBrandLockup({
  variant = 'light',
  compact = false,
  showAbbreviation = true,
  /** Set true only if using a seals-only image without the org title */
  showOrgName = false,
  align = 'center',
}) {
  const isDark = variant === 'dark';

  return (
    <Stack
      alignItems={align === 'center' ? 'center' : 'flex-start'}
      spacing={compact ? 0.65 : 0.9}
      sx={{ width: '100%', maxWidth: '100%' }}
    >
      <Box
        component="img"
        src={BSWML_SEALS_SRC}
        alt={`${APP_SHORT_NAME} — ${APP_ORG_NAME}. Government of Karnataka and Greater Bengaluru Authority seals.`}
        sx={{
          width: '100%',
          maxWidth: compact ? 260 : { xs: 300, sm: 340, md: 400 },
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          borderRadius: 1.25,
          bgcolor: isDark ? 'rgba(255,255,255,0.97)' : '#FFFFFF',
          px: { xs: 1, sm: 1.25 },
          py: { xs: 0.75, sm: 1 },
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.28)'
            : '0 2px 10px rgba(15,42,58,0.08)',
        }}
      />

      {showAbbreviation && (
        <Typography
          component="div"
          sx={{
            textAlign: align,
            fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
            fontWeight: 800,
            letterSpacing: compact ? '0.1em' : '0.14em',
            fontSize: compact
              ? { xs: '1.2rem', sm: '1.4rem' }
              : { xs: '1.45rem', sm: '1.7rem', md: '1.85rem' },
            lineHeight: 1.05,
            color: isDark ? '#FFFFFF' : '#0F3D2E',
            textShadow: isDark ? '0 1px 3px rgba(0,0,0,0.35)' : 'none',
          }}
        >
          {APP_SHORT_NAME}
        </Typography>
      )}

      {showOrgName && (
        <Typography
          component="div"
          sx={{
            textAlign: align,
            fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
            fontWeight: 700,
            letterSpacing: { xs: '0.02em', sm: '0.04em' },
            textTransform: 'uppercase',
            fontSize: compact
              ? { xs: '0.58rem', sm: '0.68rem' }
              : { xs: '0.62rem', sm: '0.72rem', md: '0.78rem' },
            lineHeight: 1.35,
            color: isDark ? 'rgba(220,230,236,0.92)' : '#1E5631',
            maxWidth: compact ? 300 : 440,
          }}
        >
          {APP_ORG_NAME}
        </Typography>
      )}
    </Stack>
  );
}
