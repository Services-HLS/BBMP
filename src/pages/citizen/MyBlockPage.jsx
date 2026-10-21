import { useMemo } from 'react';
import { Alert, Box, Stack, Typography, Chip, Grid } from '@mui/material';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import StatusChip from '../../components/common/StatusChip';
import LoadingState from '../../components/common/LoadingState';
import MapView from '../../components/maps/MapView';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function MyBlockPage() {
  const { data, loading } = useAppData();
  const { user } = useAuth();
  const { t } = useTranslation();

  const view = useMemo(() => {
    if (!data || !user) return null;
    const ward = data.wards.find((w) => w.id === user.wardId);
    const block = data.blocks.find((b) => b.id === user.blockId);
    const route = data.routes.find((r) => r.id === block?.routeId);
    const vehicle = data.vehicles.find((v) => v.id === block?.vehicleId)
      || data.vehicles.find((v) => v.blockId === user.blockId);
    const supervisor = data.supervisors.find((s) => s.wardIds?.includes(user.wardId));
    const sweeping = data.sweepingStretches.filter((s) => s.wardId === user.wardId);
    const blackSpots = data.blackSpots
      .filter((b) => b.wardId === user.wardId && b.status !== 'Cleared')
      .sort((a, b) => b.daysUnresolved - a.daysUnresolved);
    return { ward, block, route, vehicle, supervisor, sweeping, blackSpots };
  }, [data, user]);

  if (loading || !data) return <LoadingState />;
  if (!view) return <LoadingState />;

  const { ward, block, route, vehicle, supervisor, sweeping, blackSpots } = view;

  return (
    <PageContainer>
      <PageHeader title={t('myBlock')} subtitle={`${ward?.name || ''} · ${block?.name || ''}`} />

      <Alert severity="info" icon={false}>Supervisor contacts are demo placeholders only.</Alert>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Collection timings">
            <Stack spacing={1}>
              <Typography variant="body2">Window: {route?.scheduleStart || '06:30'} – {route?.scheduleEnd || '11:00'}</Typography>
              <Typography variant="body2">Route: {route?.name || '—'}</Typography>
              <Typography variant="body2">Assigned auto: {vehicle?.displayName || '—'} ({vehicle?.autoId || '—'})</Typography>
              <Typography variant="body2">Expected stops: {route?.expectedStops ?? '—'}</Typography>
              <Typography variant="body2">Coverage today: {route?.householdCoverage ?? vehicle?.coveragePct ?? '—'}%</Typography>
              <Typography variant="caption" color="text.secondary">
                Wet waste: daily morning · Dry waste: mid-week slot (demo schedule)
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Supervisor / JHI">
            <Stack spacing={0.75}>
              <Typography variant="body2">{supervisor?.name || '—'} ({supervisor?.role || '—'})</Typography>
              <Typography variant="body2">{supervisor?.phone || '+91 XXXXX XXXXX (placeholder)'}</Typography>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Sweeping stretches">
            {sweeping.length === 0 && (
              <Typography variant="body2" color="text.secondary">No sweeping stretches for this ward.</Typography>
            )}
            <Stack spacing={1.5}>
              {sweeping.map((s) => (
                <Box key={s.id}>
                  <Typography variant="body2" fontWeight={600}>{s.roadName}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    <StatusChip status={s.status} />
                    <Typography variant="caption">
                      {s.completionPct}% · {s.completedKm}/{s.plannedKm} km · {s.team}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Nearby black spots">
            {blackSpots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No open black spots in demo data for your ward.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                <MapView
                  height={240}
                  markers={blackSpots.map((b) => ({
                    id: b.id,
                    lat: b.lat,
                    lng: b.lng,
                    label: b.location,
                    status: b.status,
                    useCircle: true,
                    color: b.severity === 'Critical' || b.severity === 'High' ? '#D94841' : '#E9A23B',
                  }))}
                  focus={blackSpots[0] ? [blackSpots[0].lat, blackSpots[0].lng] : undefined}
                />
                {blackSpots.map((b) => (
                  <Box key={b.id}>
                    <Typography variant="body2" fontWeight={600}>{b.location}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      <Chip size="small" label={b.severity} />
                      <Chip size="small" label={`${b.daysUnresolved} days`} />
                    </Stack>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.35 }}>
                      {b.category} · {b.status}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
