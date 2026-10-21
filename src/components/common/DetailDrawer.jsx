import { Box, Drawer, IconButton, Stack, Typography, Divider } from '@mui/material';
import { X } from 'lucide-react';

const WIDTH = { xs: '100%', sm: 420, md: 440 };

/**
 * Standard right detail drawer for record inspection across ops pages.
 */
export default function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  statusSlot,
  children,
  width,
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: width || WIDTH,
          maxWidth: '100vw',
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap title={title}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block">
                {subtitle}
              </Typography>
            )}
            {statusSlot && <Box sx={{ mt: 0.75 }}>{statusSlot}</Box>}
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close detail">
            <X size={18} />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ p: 2.5, pb: 4 }}>{children}</Box>
    </Drawer>
  );
}

export function DrawerSection({ title, children }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      {title && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            {title}
          </Typography>
          <Divider sx={{ mb: 1.25 }} />
        </>
      )}
      {children}
    </Box>
  );
}
