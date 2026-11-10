import { Box } from '@mui/material';

/** Ensures every page shares the same content width and vertical rhythm */
export default function PageContainer({ children, sx, dense = false, className }) {
  return (
    <Box
      className={['bbmp-page', className].filter(Boolean).join(' ')}
      sx={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: dense ? { xs: 1.25, sm: 1.5 } : { xs: 1.5, sm: 2 },
        overflowX: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
