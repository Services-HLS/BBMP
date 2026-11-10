import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', p: { xs: 2, sm: 3 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <Typography
          sx={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'primary.main' }}
        >
          404
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Page not found in this demo app.
        </Typography>
        <Button
          variant="contained"
          onClick={() =>
            navigate(
              isAuthenticated
                ? (role === ROLES.CITIZEN ? '/citizen' : '/dashboard')
                : '/login'
            )
          }
        >
          Back to start
        </Button>
      </Paper>
    </Box>
  );
}
