import { useMemo } from 'react';
import { Alert, Box, Stack, Typography, Chip, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MapPin, Flag, Clock, Truck } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import LoadingState from '../../components/common/LoadingState';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatTime, formatDateTime } from '../../utils/date';

export default function CitizenHomePage() {
  const { data, loading } = useAppData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const view = useMemo(() => {
    if (!data || !user) return null;
    const ward = data.wards.find((w) => w.id === user.wardId);
    const block = data.blocks.find((b) => b.id === user.blockId);
    const vehicle = data.vehicles.find((v) => v.blockId === user.blockId)
      || data.vehicles.find((v) => v.wardId === user.wardId);
    const route = data.routes.find((r) => r.id === block?.routeId || r.id === vehicle?.routeId);
    const alerts = data.notifications.filter((n) => !n.read).slice(0, 3);
    const stopsAway = vehicle && vehicle.status !== 'Offline'
      ? Math.max(0, (vehicle.expectedStops || 0) - (vehicle.completedStops || 0))
      : '—';
    const wardSpots = data.blackSpots.filter((b) => b.wardId === user.wardId && b.status !== 'Cleared').length;
    const cleanliness = (vehicle?.coveragePct || 0) >= 90 && wardSpots === 0
      ? 'Good'
      : (vehicle?.coveragePct || 0) >= 70
        ? 'Fair'
        : 'Needs Attention';
    return { ward, block, vehicle, route, alerts, stopsAway, cleanliness };
  }, [data, user]);

  if (loading || !data) return <LoadingState />;
  if (!view) return <LoadingState />;

  const { ward, block, vehicle, route, alerts, stopsAway, cleanliness } = view;

  return (
    <PageContainer>
      <PageHeader
        title={t('home')}
        subtitle={`${t('welcomeCitizen')} — ${ward?.name || ''}`}
      />

      <Alert severity="info" icon={false}>{t('demoNotice')}</Alert>

      <Typography variant="body2" color="text.secondary">
        {t('ward')}: <strong>{ward?.name || user.wardId}</strong>
        {' · '}
        {t('block')}: <strong>{block?.name || user.blockId}</strong>
        {block?.code ? ` (${block.code})` : ''}
      </Typography>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t('vehicleStatus')}
            value={vehicle?.status || '—'}
            subtitle={vehicle?.displayName}
            icon={Truck}
            color="primary"
            onClick={() => navigate('/citizen/track')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t('estimatedArrival')}
            value={vehicle?.estimatedCompletion ? formatTime(vehicle.estimatedCompletion) : (route?.scheduleEnd || '—')}
            subtitle={route ? `${route.scheduleStart} – ${route.scheduleEnd}` : undefined}
            icon={Clock}
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t('stopsAway')}
            value={stopsAway}
            subtitle={vehicle ? `${vehicle.completedStops}/${vehicle.expectedStops} done` : undefined}
            icon={MapPin}
            color="warning"
            onClick={() => navigate('/citizen/track')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t('cleanliness')}
            value={cleanliness}
            icon={Flag}
            color="success"
            onClick={() => navigate('/citizen/block')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title={t('todaysSchedule')}>
            <Stack spacing={1.25}>
              <Typography variant="body2">
                <strong>Route window:</strong> {route?.scheduleStart || '—'} – {route?.scheduleEnd || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Auto:</strong> {vehicle?.autoId || '—'} · {vehicle?.driverName || '—'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2"><strong>{t('status')}:</strong></Typography>
                {vehicle && <StatusChip status={vehicle.status} />}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {t('latestUpdate')}: {formatDateTime(vehicle?.lastUpdate)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
                <Button variant="contained" onClick={() => navigate('/citizen/track')}>
                  {t('trackMyAuto')}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/citizen/report')}>
                  {t('reportProblem')}
                </Button>
                <Button variant="text" onClick={() => navigate('/citizen/pickup')}>
                  {t('todaysPickup')}
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title={t('recentAlerts')}>
            {alerts.length === 0 && (
              <Typography variant="body2" color="text.secondary">No unread alerts.</Typography>
            )}
            <Stack spacing={1.5}>
              {alerts.map((a) => (
                <Box key={a.id}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={a.priority} />
                    <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                  </Stack>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.35 }}>
                    {a.message}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
