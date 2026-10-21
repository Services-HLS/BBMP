import { Box, Typography, Button } from '@mui/material';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <Box
      sx={{
        py: 5,
        px: 2,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <Box sx={{ mb: 1.5, opacity: 0.45, display: 'flex', justifyContent: 'center' }}>
        <Icon size={36} strokeWidth={1.75} />
      </Box>
      <Typography variant="subtitle1" color="text.primary" fontWeight={700}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mt: 0.5, mb: actionLabel ? 2 : 0, maxWidth: 400, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1.5 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
