import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colors, layout } from '../../theme/tokens';

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'primary', onClick }) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(16,40,60,0.05)',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        '&:hover': onClick
          ? {
              boxShadow: '0 4px 14px rgba(16,40,60,0.1)',
              borderColor: alpha(colors.teal, 0.45),
              transform: 'translateY(-1px)',
            }
          : undefined,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                mt: 0.75,
                fontSize: { xs: '1.15rem', sm: '1.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: 'text.primary',
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                wordBreak: { xs: 'break-word', sm: 'normal' },
              }}
              title={String(value)}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block', lineHeight: 1.35 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && (
            <Box
              aria-hidden
              sx={{
                width: layout.kpiIconBox,
                height: layout.kpiIconBox,
                borderRadius: 1.5,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                bgcolor: (t) => alpha(
                  color === 'primary' ? colors.teal : (t.palette[color]?.main || t.palette.primary.main),
                  0.12,
                ),
                color: (t) => (color === 'primary' ? colors.teal : (t.palette[color]?.main || t.palette.primary.main)),
              }}
            >
              <Icon size={18} strokeWidth={2.25} />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
