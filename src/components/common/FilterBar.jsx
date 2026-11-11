import { Box, Stack } from '@mui/material';

/**
 * Consistent filter/toolbar row — wraps cleanly on tablet/mobile.
 */
export default function FilterBar({ children, endActions, sx, className }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      className={['bswml-filter-bar', className].filter(Boolean).join(' ')}
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(16,40,60,0.04)',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.25,
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          width: { xs: '100%', sm: 'auto' },
          '& > .MuiFormControl-root': { minWidth: { xs: '100%', sm: 132 }, flex: { sm: '0 1 160px' } },
          '& > .MuiTextField-root': { minWidth: { xs: '100%', sm: 160 }, flex: { sm: '1 1 200px' } },
        }}
      >
        {children}
      </Box>
      {endActions && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
          {endActions}
        </Box>
      )}
    </Stack>
  );
}
