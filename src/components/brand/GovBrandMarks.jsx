import { Box, Stack, Tooltip } from '@mui/material';
import {
  GREATER_BENGALURU_AUTHORITY_SRC,
  KARNATAKA_GOV_EMBLEM_SRC,
} from './brandAssets';

/**
 * Karnataka Government + Greater Bengaluru Authority seals (from CT Monitoring PPT).
 * Circular crop hides the black square corners from the source artwork.
 */
export default function GovBrandMarks({
  size = 40,
  gap = 1,
  dense = false,
}) {
  const markSize = dense ? Math.min(size, 32) : size;

  const markSx = {
    width: markSize,
    height: markSize,
    minWidth: markSize,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    bgcolor: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
    border: '1px solid rgba(255,255,255,0.35)',
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={gap}
      sx={{ flexShrink: 0 }}
      aria-label="Government of Karnataka and Greater Bengaluru Authority"
    >
      <Tooltip title="Government of Karnataka">
        <Box
          component="img"
          src={KARNATAKA_GOV_EMBLEM_SRC}
          alt="Government of Karnataka"
          sx={{
            ...markSx,
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </Tooltip>
      <Tooltip title="Greater Bengaluru Authority">
        <Box
          component="img"
          src={GREATER_BENGALURU_AUTHORITY_SRC}
          alt="Greater Bengaluru Authority"
          sx={{
            ...markSx,
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </Tooltip>
    </Stack>
  );
}
