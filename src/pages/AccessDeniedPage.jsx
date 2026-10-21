import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../constants';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Paper variant="outlined" sx={{ p: 4, maxWidth: 440, textAlign: 'center', width: '100%' }}>
        <Box sx={{ opacity: 0.45, mb: 1.5, display: 'flex', justifyContent: 'center' }}>
          <ShieldOff size={36} strokeWidth={1.75} />
        </Box>
        <Typography variant="h5" fontWeight={700}>Access denied</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Your role ({ROLE_LABELS[role] || role || 'none'}) cannot open this page.
          Logout and sign in with another demo account to switch roles.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
          <Button
            variant="contained"
            onClick={() => navigate(role === ROLES.CITIZEN ? '/citizen' : '/dashboard')}
          >
            Go home
          </Button>
          <Button
            variant="outlined"
            onClick={() => { logout(); navigate('/login'); }}
          >
            Logout
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
