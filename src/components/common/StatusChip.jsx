import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../../theme/palette';

export default function StatusChip({ status, size = 'small', sx }) {
  const color = STATUS_COLORS[status] || '#5A6B7D';
  return (
    <Chip
      label={status || '—'}
      size={size}
      sx={{
        bgcolor: `${color}14`,
        color,
        border: `1px solid ${color}33`,
        fontWeight: 600,
        maxWidth: '100%',
        '& .MuiChip-label': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          px: 1,
        },
        ...sx,
      }}
    />
  );
}
