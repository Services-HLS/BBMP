import { Box, Breadcrumbs, Link, Stack, Typography, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { APP_ENV_LABEL } from '../../constants';

/**
 * Canonical page header — every route should use this for alignment.
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  showSampleBadge = false,
}) {
  return (
    <Box
      sx={{
        mb: 2.5,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          t.palette.mode === 'dark'
            ? 'transparent'
            : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
        mx: { xs: -0.5, sm: 0 },
        px: { xs: 0.5, sm: 0 },
        borderRadius: { sm: 1 },
      }}
    >
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          sx={{ mb: 0.75, '& .MuiBreadcrumbs-separator': { mx: 0.75 } }}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((b, i) =>
            b.to && i < breadcrumbs.length - 1 ? (
              <Link
                key={b.label}
                component={RouterLink}
                to={b.to}
                underline="hover"
                color="text.secondary"
                variant="caption"
                sx={{ fontWeight: 500 }}
              >
                {b.label}
              </Link>
            ) : (
              <Typography key={b.label} variant="caption" color="text.primary" fontWeight={600}>
                {b.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={1.5}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.35rem' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                color: 'primary.main',
              }}
            >
              {title}
            </Typography>
            {showSampleBadge && (
              <Chip
                label={APP_ENV_LABEL}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 22 }}
              />
            )}
          </Stack>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, maxWidth: 720, lineHeight: 1.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              '& > .MuiButton-root': {
                flex: { xs: '1 1 auto', sm: '0 0 auto' },
              },
            }}
          >
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
