import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Eye,
  EyeOff,
  LogIn,
  MapPinned,
  MessageSquareWarning,
  Truck,
} from 'lucide-react';
import AppLogo from '../components/brand/AppLogo';
import { useAuth } from '../context/AuthContext';
import {
  DEMO_USERS,
  ROLES,
  ROLE_LABELS,
  APP_ENV_LABEL,
  APP_VERSION,
  PROPOSAL_SCALE,
} from '../constants';

const CAPABILITIES = [
  {
    icon: Truck,
    label: 'Waste collection monitoring',
    detail: 'Track autos, routes, and ward coverage in real time.',
  },
  {
    icon: MessageSquareWarning,
    label: 'Citizen grievance management',
    detail: 'Intake, verify, and close civic complaints in the field.',
  },
  {
    icon: MapPinned,
    label: 'Ward-level operations',
    detail: 'Blocks, dry-waste centres, and sweeping black spots.',
  },
  {
    icon: ClipboardCheck,
    label: 'Field verification & scorecards',
    detail: 'Pickup evidence and a 100-point performance model.',
  },
];

const SCALE_HIGHLIGHTS = [
  { value: PROPOSAL_SCALE.wards, label: 'Wards (ref.)' },
  { value: PROPOSAL_SCALE.autosBlocks, label: 'Autos / blocks' },
  { value: PROPOSAL_SCALE.dryWasteCentres, label: 'Dry-waste centres' },
];

function PanelBackdrop() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src="/login-panel-swm.jpg?v=2"
        alt=""
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(100deg, rgba(8, 22, 36, 0.82) 0%, rgba(12, 32, 48, 0.62) 38%, rgba(12, 32, 48, 0.38) 72%, rgba(12, 32, 48, 0.28) 100%),
            linear-gradient(180deg, rgba(8, 22, 36, 0.28) 0%, transparent 35%, rgba(8, 22, 36, 0.42) 100%)
          `,
        }}
      />
    </Box>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCreds, setShowDemoCreds] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(role === ROLES.CITIZEN ? '/citizen' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = login(username, password);
      navigate(user.role === ROLES.CITIZEN ? '/citizen' : '/dashboard');
    } catch {
      setError('Invalid username or password. Use the demo credentials below.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (user) => {
    setUsername(user.username);
    setPassword(user.password);
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: { lg: '100vh' },
        maxHeight: { lg: '100vh' },
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'minmax(0, 1.35fr) minmax(360px, 420px)',
        },
        bgcolor: 'background.default',
        overflow: { lg: 'hidden' },
      }}
    >
      {/* Left identity panel — static, no scroll */}
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          height: { lg: '100%' },
          minHeight: { sm: 180, md: 220, lg: 0 },
          bgcolor: '#10283C',
          color: '#fff',
          px: { sm: 3, lg: 4 },
          py: { sm: 2.25, lg: 2.75 },
          overflow: 'hidden',
        }}
      >
        <PanelBackdrop />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { lg: 'space-between' },
            gap: { xs: 1, lg: 1.75 },
            maxWidth: { lg: 640, xl: 700 },
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <AppLogo
              variant="dark"
              showEnv
              markSize={64}
              subtitle="Solid Waste Management & Civic Operations"
            />

            <Typography
              sx={{
                mt: { sm: 2, md: 2.75, lg: 3.25 },
                fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
                fontSize: { sm: '1.25rem', md: '1.55rem', lg: '1.7rem' },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.22,
                maxWidth: { lg: 580 },
                color: '#FFFFFF',
              }}
            >
              Municipal operations for Bengaluru’s solid waste & civic services
            </Typography>
            <Typography
              sx={{
                mt: 1.1,
                fontSize: { sm: '0.82rem', md: '0.9rem' },
                color: 'rgba(220,230,236,0.8)',
                lineHeight: 1.55,
                maxWidth: { lg: 560 },
                display: { sm: 'none', md: 'block' },
              }}
            >
              Built on ward SWM, grievance, and field-verification patterns from Karnataka civic platforms —
              as a modern sample-data prototype for citizens, field supervisors, and administrators.
            </Typography>
          </Box>

          <Stack
            spacing={0.85}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              maxWidth: 540,
              flexShrink: 1,
              minHeight: 0,
            }}
          >
            {CAPABILITIES.map(({ icon: Icon, label, detail }) => (
              <Stack
                key={label}
                direction="row"
                spacing={1.1}
                alignItems="center"
                sx={{
                  px: 1.15,
                  py: 0.85,
                  borderRadius: 1.25,
                  bgcolor: 'rgba(8, 24, 38, 0.55)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'rgba(45,190,106,0.22)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#4CD68A',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} strokeWidth={2.1} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.25 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ mt: 0.15, fontSize: '0.72rem', color: 'rgba(255,255,255,0.66)', lineHeight: 1.35 }}>
                    {detail}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Box sx={{ display: { xs: 'none', lg: 'block' }, maxWidth: 560, flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgba(125, 219, 196, 0.9)',
                mb: 0.75,
              }}
            >
              Proposal-scale reference
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.1 }}>
              {SCALE_HIGHLIGHTS.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    flex: 1,
                    px: 1.1,
                    py: 0.9,
                    borderRadius: 1.25,
                    bgcolor: 'rgba(8, 24, 38, 0.5)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {item.value.toLocaleString('en-IN')}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: '0.65rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.25 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Typography
              sx={{
                fontSize: '0.74rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.45,
              }}
            >
              Fictional sample data only. Sign in on the right, then logout before switching roles.
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontSize: '0.62rem',
                color: 'rgba(255,255,255,0.48)',
              }}
            >
              Not an official BBMP production system · Demo {APP_VERSION}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right login panel */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
          height: { lg: '100%' },
          overflow: { lg: 'auto' },
          px: { xs: 2, sm: 2.5, lg: 2.5 },
          py: { xs: 2.25, lg: 3 },
          pb: { xs: 'calc(24px + env(safe-area-inset-bottom))', lg: 3 },
        }}
      >
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
          <AppLogo
            showEnv
            markSize={52}
            subtitle="Solid Waste Management"
          />
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.75 }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
            Platform · Sign in
          </Typography>
          <Chip
            label={APP_ENV_LABEL}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              bgcolor: alpha('#D99224', 0.12),
              color: '#B87A1C',
              border: '1px solid',
              borderColor: alpha('#D99224', 0.35),
              flexShrink: 0,
            }}
          />
        </Stack>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '1.2rem', md: '1.35rem' },
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'text.primary',
            lineHeight: 1.25,
          }}
        >
          Sign in to continue
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mt: 0.5, mb: 1.5, maxWidth: 520, lineHeight: 1.45, fontSize: '0.8125rem' }}
        >
          Enter demo credentials for your role. After login, logout is required to switch roles.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          {error && (
            <Alert severity="error" sx={{ py: 0.5, fontSize: '0.78rem' }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            size="small"
            fullWidth
            required
            inputProps={{ 'aria-label': 'Username' }}
          />

          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            size="small"
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={submitting || !username.trim() || !password}
            endIcon={<LogIn size={15} />}
            sx={{ mt: 0.25, alignSelf: 'stretch' }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            mt: 2,
            overflow: 'hidden',
            borderColor: 'divider',
          }}
        >
          <Button
            fullWidth
            onClick={() => setShowDemoCreds((v) => !v)}
            endIcon={showDemoCreds ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            sx={{
              justifyContent: 'space-between',
              px: 1.5,
              py: 1.1,
              borderRadius: 0,
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '0.78rem',
              textTransform: 'none',
            }}
          >
            {showDemoCreds ? 'Hide demo credentials' : 'Show demo credentials'}
          </Button>

          <Collapse in={showDemoCreds}>
            <Divider />
            <Stack spacing={1} sx={{ p: 1.25 }}>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.4, px: 0.25 }}>
                Tap a row to fill the form. Passwords are for this sample prototype only.
              </Typography>
              {DEMO_USERS.map((user) => (
                <Paper
                  key={user.id}
                  component="button"
                  type="button"
                  variant="outlined"
                  onClick={() => fillCredentials(user)}
                  sx={{
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    p: 1.1,
                    bgcolor: 'background.paper',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha('#15344B', 0.03),
                    },
                  }}
                >
                  <Typography fontWeight={700} fontSize="0.78rem" color="text.primary">
                    {ROLE_LABELS[user.role]}
                  </Typography>
                  <Typography sx={{ mt: 0.2, fontSize: '0.68rem', color: 'text.secondary' }}>
                    {user.name}
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 0.15, sm: 1.5 }}
                    sx={{ mt: 0.55 }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
                      {user.username}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', fontFamily: 'ui-monospace, monospace', color: 'text.secondary', wordBreak: 'break-all' }}>
                      {user.password}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Collapse>
        </Paper>

        <Box sx={{ flex: 1, minHeight: 8 }} />

        <Divider sx={{ my: 1.5 }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={0.35}
          sx={{ color: 'text.secondary' }}
        >
          <Typography sx={{ fontSize: '0.65rem' }}>
            One role per session · Logout to switch
          </Typography>
          <Typography sx={{ fontSize: '0.65rem' }}>
            v{APP_VERSION} · Frontend prototype
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
