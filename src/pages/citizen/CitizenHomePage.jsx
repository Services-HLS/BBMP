import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Stack,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, CalendarCheck } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import LoadingState from '../../components/common/LoadingState';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { saveCitizenProfile } from '../../utils/storage';
import {
  EMPTY_HOUSE_ADDRESS,
  formatHouseAddress,
  getCitizenHouseAddress,
  hasHouseAddress,
} from '../../utils/citizenAddress';

function resolveOutcome(fb) {
  if (!fb) return null;
  if (fb.outcome) return fb.outcome;
  if (fb.noService) return 'no_service';
  if (fb.collected) return 'collected';
  return 'missed_by_auto';
}

export default function CitizenHomePage() {
  const { data, loading } = useAppData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [address, setAddress] = useState(EMPTY_HOUSE_ADDRESS);
  const [draft, setDraft] = useState(EMPTY_HOUSE_ADDRESS);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setAddress(getCitizenHouseAddress(user));
  }, [user]);

  const monthSummary = useMemo(() => {
    const stats = { collected: 0, missed_by_auto: 0, garbage_not_kept: 0 };
    if (!data?.feedback || !user) return stats;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    data.feedback
      .filter((f) => f.citizenId === user.id && String(f.date).startsWith(ym))
      .forEach((f) => {
        const o = resolveOutcome(f);
        if (stats[o] != null) stats[o] += 1;
      });
    return stats;
  }, [data, user]);

  const openEdit = () => {
    setDraft({ ...EMPTY_HOUSE_ADDRESS, ...address });
    setDialogOpen(true);
  };

  const saveAddress = () => {
    const next = {
      houseNo: draft.houseNo.trim(),
      street: draft.street.trim(),
      area: draft.area.trim(),
      landmark: draft.landmark.trim(),
      city: draft.city.trim() || 'Bengaluru',
      pincode: draft.pincode.trim(),
    };
    setAddress(next);
    if (user?.id) saveCitizenProfile(user.id, { address: next });
    setDialogOpen(false);
  };

  if (loading || !data || !user) return <LoadingState />;

  return (
    <PageContainer>
      <PageHeader
        title={t('home')}
        subtitle={`${t('welcomeCitizen')}${user.name ? ` — ${user.name}` : ''}`}
      />

      <Alert severity="info" icon={false}>{t('demoNotice')}</Alert>

      <SectionCard
        title={t('myHouseAddress')}
        action={
          <Button
            size="small"
            variant={hasHouseAddress(address) ? 'outlined' : 'contained'}
            startIcon={hasHouseAddress(address) ? <Pencil size={14} /> : <MapPin size={14} />}
            onClick={openEdit}
          >
            {hasHouseAddress(address) ? t('editAddress') : t('addAddress')}
          </Button>
        }
      >
        {hasHouseAddress(address) ? (
          <Stack spacing={0.5}>
            <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: 'pre-line' }}>
              {formatHouseAddress(address)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('doorstepForAddress')}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">{t('noAddressYet')}</Typography>
            <Button variant="contained" startIcon={<MapPin size={16} />} onClick={openEdit} sx={{ alignSelf: 'flex-start' }}>
              {t('addAddress')}
            </Button>
          </Stack>
        )}
      </SectionCard>

      <SectionCard
        title={t('collectionCalendar')}
        subtitle={t('collectionCalendarHint')}
        action={
          <Button
            size="small"
            variant="contained"
            startIcon={<CalendarCheck size={14} />}
            onClick={() => navigate('/citizen/calendar')}
          >
            {t('collectionCalendarNav')}
          </Button>
        }
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(45,190,106,0.15)' }}>
              <Typography variant="caption" fontWeight={700}>{t('outcomeCollected')}: {monthSummary.collected}</Typography>
            </Box>
            <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(211,47,47,0.12)' }}>
              <Typography variant="caption" fontWeight={700}>{t('outcomeMissedByAuto')}: {monthSummary.missed_by_auto}</Typography>
            </Box>
            <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(245,158,11,0.16)' }}>
              <Typography variant="caption" fontWeight={700}>{t('outcomeGarbageNotKept')}: {monthSummary.garbage_not_kept}</Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('openCalendarHint')}
          </Typography>
        </Stack>
      </SectionCard>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } } }}
      >
        <Button variant="contained" onClick={() => navigate('/citizen/track')}>{t('trackMyAuto')}</Button>
        <Button variant="outlined" onClick={() => navigate('/citizen/report')}>{t('reportProblem')}</Button>
        <Button variant="text" onClick={() => navigate('/citizen/pickup')}>{t('todaysPickup')}</Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{hasHouseAddress(address) ? t('editAddress') : t('addAddress')}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <TextField label={t('houseNo')} value={draft.houseNo} onChange={(e) => setDraft((d) => ({ ...d, houseNo: e.target.value }))} fullWidth required />
            <TextField label={t('street')} value={draft.street} onChange={(e) => setDraft((d) => ({ ...d, street: e.target.value }))} fullWidth required />
            <TextField label={t('area')} value={draft.area} onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))} fullWidth required />
            <TextField label={t('landmark')} value={draft.landmark} onChange={(e) => setDraft((d) => ({ ...d, landmark: e.target.value }))} fullWidth />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField label={t('city')} value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField label={t('pincode')} value={draft.pincode} onChange={(e) => setDraft((d) => ({ ...d, pincode: e.target.value }))} fullWidth inputProps={{ inputMode: 'numeric', maxLength: 6 }} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2 },
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: 1,
            '& > :not(style) ~ :not(style)': { ml: { xs: 0, sm: 1 } },
            '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
          }}
        >
          <Button onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={saveAddress} disabled={!draft.houseNo.trim() || !draft.street.trim() || !draft.area.trim()}>
            {t('saveAddress')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
