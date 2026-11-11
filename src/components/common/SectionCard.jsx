import { Card, CardContent, Stack, Typography, Box } from '@mui/material';

export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  contentSx,
  sx,
  noPadding = false,
}) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(16,40,60,0.05)',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            px: 2,
            pt: 1.75,
            pb: title && !subtitle ? 1 : 0.5,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            justifyContent: 'space-between',
            gap: 1.25,
            flexWrap: 'wrap',
            borderBottom: subtitle || action ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {title && (
              <Typography
                component="h2"
                sx={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && (
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                width: { xs: '100%', sm: 'auto' },
                '& > .MuiButton-root': { flex: { xs: '1 1 auto', sm: '0 0 auto' } },
              }}
            >
              {action}
            </Box>
          )}
        </Box>
      )}
      {noPadding ? (
        <Box sx={{ flex: 1, minHeight: 0, ...contentSx }}>{children}</Box>
      ) : (
        <CardContent
          sx={{
            flex: 1,
            pt: title ? 1 : 2,
            '&:last-child': { pb: 2 },
            ...contentSx,
          }}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={1}
      sx={{ mb: 1.5 }}
    >
      <Typography className="bswml-section-title" component="h2" sx={{ m: 0 }}>
        {title}
      </Typography>
      {action}
    </Stack>
  );
}
