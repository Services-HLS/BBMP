import { Box } from '@mui/material';
import CivicMark from '../brand/CivicMark';

/**
 * Single branded loading animation used across the app.
 */
export default function LoadingSpinner({ size = 56 }) {
  const ring = size + 18;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: ring,
        height: ring,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2.5px solid',
          borderColor: 'rgba(21, 52, 75, 0.12)',
          borderTopColor: '#2DBE6A',
          borderRightColor: '#143A4F',
          animation: 'bswml-spin 0.85s linear infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 6,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderBottomColor: 'rgba(76, 214, 138, 0.9)',
          borderLeftColor: 'rgba(45, 190, 106, 0.45)',
          animation: 'bswml-spin 1.35s linear infinite reverse',
        }}
      />
      <Box
        sx={{
          animation: 'bswml-pulse 1.4s ease-in-out infinite',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CivicMark size={Math.round(size * 0.7)} variant="light" />
      </Box>
    </Box>
  );
}
