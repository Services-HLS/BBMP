import { Box } from '@mui/material';
import { APP_ICON_SRC } from './brandAssets';

/**
 * Eco City Leaf Emblem — used across login, shell, splash, and loading.
 */
export default function CivicMark({ size = 40, variant = 'light' }) {
  const isDark = variant === 'dark';

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'transparent',
        boxShadow: isDark
          ? '0 4px 16px rgba(0,0,0,0.45)'
          : '0 2px 10px rgba(15,42,58,0.18)',
      }}
    >
      <Box
        component="img"
        src={APP_ICON_SRC}
        alt=""
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
        }}
      />
    </Box>
  );
}
