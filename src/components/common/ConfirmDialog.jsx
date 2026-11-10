import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmColor = 'primary',
  loading = false,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 2 }}>{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? (
          <DialogContentText>{message}</DialogContentText>
        ) : (
          message
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: 'stretch',
          gap: 1,
          '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
          '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
        }}
      >
        <Button onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" color={confirmColor} disabled={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
