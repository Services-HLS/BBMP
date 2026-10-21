import { Box, Typography } from '@mui/material';
import LoadingSpinner from './LoadingSpinner';

export default function LoadingState({
  label = 'Loading…',
  fullPage = false,
  size = 56,
}) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      sx={{
        py: fullPage ? 0 : 8,
        minHeight: fullPage ? '100vh' : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.75,
        width: '100%',
      }}
    >
      <LoadingSpinner size={size} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: '0.01em' }}
      >
        {label}
      </Typography>
    </Box>
  );
}
