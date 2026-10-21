import { Box } from '@mui/material';

/** Ensures every page shares the same content width and vertical rhythm */
export default function PageContainer({ children, sx, dense = false, className }) {
  return (
    <Box
      className={['bbmp-page', className].filter(Boolean).join(' ')}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: dense ? 1.5 : 2,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
